package com.smartelectronicsupermarket.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.Product;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrder;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrderStatus;
import com.smartelectronicsupermarket.inventory.domain.UnitCondition;
import com.smartelectronicsupermarket.inventory.domain.Warehouse;
import com.smartelectronicsupermarket.inventory.dto.CreateGoodsReceiptRequest;
import com.smartelectronicsupermarket.inventory.dto.GoodsReceiptResponse;
import com.smartelectronicsupermarket.inventory.dto.ReceiveItemRequest;
import com.smartelectronicsupermarket.inventory.error.InventoryException;
import com.smartelectronicsupermarket.inventory.repository.GoodsReceiptRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductUnitRepository;
import com.smartelectronicsupermarket.inventory.repository.PurchaseOrderRepository;
import com.smartelectronicsupermarket.inventory.repository.WarehouseRepository;
import com.smartelectronicsupermarket.inventory.service.InventoryReceivingService;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class InventoryReceivingServiceTests {
    @Autowired InventoryReceivingService service;
    @Autowired ProductRepository productRepository;
    @Autowired WarehouseRepository warehouseRepository;
    @Autowired PurchaseOrderRepository purchaseOrderRepository;
    @Autowired ProductUnitRepository productUnitRepository;
    @Autowired GoodsReceiptRepository goodsReceiptRepository;

    @BeforeEach
    void setUp() {
        goodsReceiptRepository.deleteAll();
        productUnitRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        productRepository.deleteAll();
        warehouseRepository.deleteAll();

        Warehouse warehouse = warehouseRepository.save(new Warehouse("WH-TEST", "Test warehouse"));
        Product product = productRepository.save(new Product("PHONE-01", "Test phone"));
        PurchaseOrder approved = new PurchaseOrder("PO-APPROVED", PurchaseOrderStatus.APPROVED, warehouse);
        approved.addLine(product, 2);
        purchaseOrderRepository.saveAndFlush(approved);
        PurchaseOrder draft = new PurchaseOrder("PO-DRAFT", PurchaseOrderStatus.DRAFT, warehouse);
        draft.addLine(product, 2);
        purchaseOrderRepository.saveAndFlush(draft);
    }

    @Test
    void receivesApprovedOrderAndKeepsDefectiveUnitOutOfAvailableStock() {
        GoodsReceiptResponse response = service.receive(request(
            "key-success", "PO-APPROVED",
            item("00001234567890", UnitCondition.GOOD),
            item("00001234567891", UnitCondition.DEFECTIVE)
        ));

        assertThat(response.replayed()).isFalse();
        assertThat(response.availableQuantity()).isEqualTo(1);
        assertThat(response.defectiveQuantity()).isEqualTo(1);
        assertThat(productUnitRepository.findBySerialImei("00001234567891").orElseThrow().getInventoryStatus())
            .isEqualTo(InventoryStatus.DEFECTIVE);
    }

    @Test
    void rejectsDuplicateSerialAcrossReceipts() {
        service.receive(request("key-first", "PO-APPROVED", item("SERIAL-DUP", UnitCondition.GOOD)));

        assertThatThrownBy(() -> service.receive(
            request("key-second", "PO-APPROVED", item("SERIAL-DUP", UnitCondition.GOOD))))
            .isInstanceOf(InventoryException.class)
            .hasMessageContaining("đã tồn tại");
    }

    @Test
    void preservesLeadingZeroesInSerialImei() {
        service.receive(request("key-leading-zero", "PO-APPROVED", item("000000123456", UnitCondition.GOOD)));

        assertThat(productUnitRepository.findBySerialImei("000000123456")).isPresent();
        assertThat(productUnitRepository.findAll()).extracting(unit -> unit.getSerialImei())
            .containsExactly("000000123456");
    }

    @Test
    void rejectsUnapprovedPurchaseOrder() {
        assertThatThrownBy(() -> service.receive(
            request("key-draft", "PO-DRAFT", item("DRAFT-001", UnitCondition.GOOD))))
            .isInstanceOf(InventoryException.class)
            .hasMessageContaining("chưa được duyệt");
    }

    @Test
    void rejectsQuantityAboveApprovedAmount() {
        assertThatThrownBy(() -> service.receive(request(
            "key-over", "PO-APPROVED",
            item("OVER-001", UnitCondition.GOOD),
            item("OVER-002", UnitCondition.GOOD),
            item("OVER-003", UnitCondition.GOOD)
        )))
            .isInstanceOf(InventoryException.class)
            .hasMessageContaining("vượt số lượng đã duyệt");
    }

    @Test
    void replaysRepeatedRequestWithoutCreatingMoreStock() {
        CreateGoodsReceiptRequest request = request(
            "key-repeated", "PO-APPROVED", item("REPEAT-001", UnitCondition.GOOD)
        );

        GoodsReceiptResponse first = service.receive(request);
        GoodsReceiptResponse second = service.receive(request);

        assertThat(second.replayed()).isTrue();
        assertThat(second.receiptNumber()).isEqualTo(first.receiptNumber());
        assertThat(goodsReceiptRepository.count()).isEqualTo(1);
        assertThat(productUnitRepository.count()).isEqualTo(1);
    }

    @Test
    void serializesConcurrentRepeatedRequest() throws Exception {
        CreateGoodsReceiptRequest request = request(
            "key-concurrent", "PO-APPROVED", item("CONCURRENT-001", UnitCondition.GOOD)
        );
        CountDownLatch start = new CountDownLatch(1);

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<GoodsReceiptResponse> first = executor.submit(() -> {
                start.await();
                return service.receive(request);
            });
            Future<GoodsReceiptResponse> second = executor.submit(() -> {
                start.await();
                return service.receive(request);
            });
            start.countDown();

            assertThat(first.get().receiptNumber()).isEqualTo(second.get().receiptNumber());
        }
        assertThat(goodsReceiptRepository.count()).isEqualTo(1);
        assertThat(productUnitRepository.count()).isEqualTo(1);
    }

    private CreateGoodsReceiptRequest request(String key, String orderNumber, ReceiveItemRequest... items) {
        return new CreateGoodsReceiptRequest(key, orderNumber, List.of(items));
    }

    private ReceiveItemRequest item(String serial, UnitCondition condition) {
        return new ReceiveItemRequest("PHONE-01", serial, condition);
    }
}
