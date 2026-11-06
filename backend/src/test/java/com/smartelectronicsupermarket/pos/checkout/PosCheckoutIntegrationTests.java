package com.smartelectronicsupermarket.pos.checkout;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.Product;
import com.smartelectronicsupermarket.inventory.domain.ProductUnit;
import com.smartelectronicsupermarket.inventory.domain.UnitCondition;
import com.smartelectronicsupermarket.inventory.domain.Warehouse;
import com.smartelectronicsupermarket.inventory.repository.GoodsReceiptRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductUnitRepository;
import com.smartelectronicsupermarket.inventory.repository.PurchaseOrderRepository;
import com.smartelectronicsupermarket.inventory.repository.WarehouseRepository;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.CreateSaleRequest;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.SaleLine;
import com.smartelectronicsupermarket.pos.checkout.model.PosDtos.SaleReceipt;
import com.smartelectronicsupermarket.pos.checkout.persistence.PosSaleRepository;
import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutException;
import com.smartelectronicsupermarket.pos.checkout.service.PosCheckoutService;
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
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "sasms.pos.demo-prices.TV-TEST=15000000")
class PosCheckoutIntegrationTests {
    private static final String AVAILABLE_ONE = "000020261029POS02";
    private static final String AVAILABLE_TWO = "000000000002";
    private static final String DEFECTIVE = "000000000003";

    @Autowired PosCheckoutService service;
    @Autowired PosSaleRepository saleRepository;
    @Autowired GoodsReceiptRepository goodsReceiptRepository;
    @Autowired ProductUnitRepository productUnitRepository;
    @Autowired PurchaseOrderRepository purchaseOrderRepository;
    @Autowired ProductRepository productRepository;
    @Autowired WarehouseRepository warehouseRepository;

    @BeforeEach
    void setUp() {
        saleRepository.deleteAll();
        goodsReceiptRepository.deleteAll();
        productUnitRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        productRepository.deleteAll();
        warehouseRepository.deleteAll();

        Warehouse warehouse = warehouseRepository.save(new Warehouse("WH-POS", "POS test warehouse"));
        Product product = productRepository.save(new Product("TV-TEST", "POS test TV"));
        productUnitRepository.saveAllAndFlush(List.of(
            new ProductUnit(AVAILABLE_ONE, product, warehouse, UnitCondition.GOOD),
            new ProductUnit(AVAILABLE_TWO, product, warehouse, UnitCondition.GOOD),
            new ProductUnit(DEFECTIVE, product, warehouse, UnitCondition.DEFECTIVE)
        ));
    }

    @Test
    void listsRealProductsAndOnlyGoodAvailableUnits() {
        assertThat(service.products()).singleElement().satisfies(product -> {
            assertThat(product.sku()).isEqualTo("TV-TEST");
            assertThat(product.unitPriceVnd()).isEqualTo(15_000_000L);
            assertThat(product.available()).isEqualTo(2);
        });
        assertThat(service.units("TV-TEST"))
            .extracting(unit -> unit.serialImei())
            .containsExactly(AVAILABLE_TWO, AVAILABLE_ONE)
            .doesNotContain(DEFECTIVE);
    }

    @Test
    void checkoutPersistsReceiptAndMarksProductUnitSoldAtomically() {
        SaleReceipt receipt = service.checkout(request("pos-test-valid", AVAILABLE_ONE));

        ProductUnit sold = productUnitRepository.findBySerialImei(AVAILABLE_ONE).orElseThrow();
        assertThat(receipt.replay()).isFalse();
        assertThat(receipt.totalVnd()).isEqualTo(15_000_000L);
        assertThat(receipt.lines()).singleElement().satisfies(line ->
            assertThat(line.serialImei()).isEqualTo(AVAILABLE_ONE)
        );
        assertThat(sold.getInventoryStatus()).isEqualTo(InventoryStatus.SOLD);
        assertThat(sold.getSoldSaleNumber()).isEqualTo(receipt.saleNumber());
        assertThat(service.units("TV-TEST"))
            .extracting(unit -> unit.serialImei())
            .containsExactly(AVAILABLE_TWO);
    }

    @Test
    void exactIdempotentRetryReturnsSameReceiptWithoutSecondSale() {
        CreateSaleRequest request = request("pos-test-retry", AVAILABLE_ONE);

        SaleReceipt first = service.checkout(request);
        SaleReceipt replay = service.checkout(request);

        assertThat(replay.replay()).isTrue();
        assertThat(replay.saleNumber()).isEqualTo(first.saleNumber());
        assertThat(saleRepository.count()).isEqualTo(1);
    }

    @Test
    void reusedIdempotencyKeyWithDifferentCartIsRejected() {
        service.checkout(request("pos-test-mismatch", AVAILABLE_ONE));

        assertThatThrownBy(() -> service.checkout(request("pos-test-mismatch", AVAILABLE_TWO)))
            .isInstanceOf(PosCheckoutException.class)
            .hasMessageContaining("giỏ hàng khác");
        assertThat(productUnitRepository.findBySerialImei(AVAILABLE_TWO).orElseThrow().getInventoryStatus())
            .isEqualTo(InventoryStatus.AVAILABLE);
        assertThat(saleRepository.count()).isEqualTo(1);
    }

    @Test
    void soldAndDefectiveUnitsCannotBeSold() {
        service.checkout(request("pos-test-first", AVAILABLE_ONE));

        assertThatThrownBy(() -> service.checkout(request("pos-test-sold", AVAILABLE_ONE)))
            .isInstanceOf(PosCheckoutException.class)
            .hasMessageContaining("không còn khả dụng");
        assertThatThrownBy(() -> service.checkout(request("pos-test-defective", DEFECTIVE)))
            .isInstanceOf(PosCheckoutException.class)
            .hasMessageContaining("không còn khả dụng");
        assertThat(saleRepository.count()).isEqualTo(1);
    }

    @Test
    void anyInvalidLineRollsBackWholeCheckout() {
        CreateSaleRequest request = new CreateSaleRequest(
            "pos-test-rollback",
            "Khách kiểm thử",
            "DEMO_CASH",
            List.of(new SaleLine("TV-TEST", AVAILABLE_ONE), new SaleLine("TV-TEST", DEFECTIVE))
        );

        assertThatThrownBy(() -> service.checkout(request)).isInstanceOf(PosCheckoutException.class);
        assertThat(saleRepository.count()).isZero();
        assertThat(productUnitRepository.findBySerialImei(AVAILABLE_ONE).orElseThrow().getInventoryStatus())
            .isEqualTo(InventoryStatus.AVAILABLE);
        assertThat(productUnitRepository.findBySerialImei(AVAILABLE_ONE).orElseThrow().getSoldSaleNumber())
            .isNull();
    }

    @Test
    void concurrentCashiersCannotSellSameSerialTwice() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<Boolean> first = executor.submit(() -> attemptAfter(start, "pos-test-cashier-a"));
            Future<Boolean> second = executor.submit(() -> attemptAfter(start, "pos-test-cashier-b"));
            start.countDown();

            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(true, false);
        }
        assertThat(saleRepository.count()).isEqualTo(1);
        assertThat(productUnitRepository.findBySerialImei(AVAILABLE_ONE).orElseThrow().getInventoryStatus())
            .isEqualTo(InventoryStatus.SOLD);
    }

    private boolean attemptAfter(CountDownLatch start, String key) throws InterruptedException {
        start.await();
        try {
            service.checkout(request(key, AVAILABLE_ONE));
            return true;
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private CreateSaleRequest request(String key, String serial) {
        return new CreateSaleRequest(
            key,
            "Khách kiểm thử",
            "DEMO_CASH",
            List.of(new SaleLine("TV-TEST", serial))
        );
    }
}
