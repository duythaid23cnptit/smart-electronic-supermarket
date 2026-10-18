package com.smartelectronicsupermarket.inventory.service;

import com.smartelectronicsupermarket.inventory.domain.GoodsReceipt;
import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.ProductUnit;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrder;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrderLine;
import com.smartelectronicsupermarket.inventory.domain.PurchaseOrderStatus;
import com.smartelectronicsupermarket.inventory.dto.CreateGoodsReceiptRequest;
import com.smartelectronicsupermarket.inventory.dto.GoodsReceiptResponse;
import com.smartelectronicsupermarket.inventory.dto.PurchaseOrderLineResponse;
import com.smartelectronicsupermarket.inventory.dto.PurchaseOrderResponse;
import com.smartelectronicsupermarket.inventory.dto.ReceiveItemRequest;
import com.smartelectronicsupermarket.inventory.dto.ReceivedUnitResponse;
import com.smartelectronicsupermarket.inventory.error.InventoryException;
import com.smartelectronicsupermarket.inventory.repository.GoodsReceiptRepository;
import com.smartelectronicsupermarket.inventory.repository.ProductUnitRepository;
import com.smartelectronicsupermarket.inventory.repository.PurchaseOrderRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryReceivingService {
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductUnitRepository productUnitRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;

    public InventoryReceivingService(PurchaseOrderRepository purchaseOrderRepository,
                                     ProductUnitRepository productUnitRepository,
                                     GoodsReceiptRepository goodsReceiptRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.productUnitRepository = productUnitRepository;
        this.goodsReceiptRepository = goodsReceiptRepository;
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrder(String orderNumber) {
        PurchaseOrder order = purchaseOrderRepository.findDetailedByOrderNumber(orderNumber)
            .orElseThrow(() -> new InventoryException(HttpStatus.NOT_FOUND, "Không tìm thấy purchase order."));
        return toPurchaseOrderResponse(order);
    }

    @Transactional
    public GoodsReceiptResponse receive(CreateGoodsReceiptRequest request) {
        String fingerprint = fingerprint(request);
        PurchaseOrder order = purchaseOrderRepository.findByOrderNumberForUpdate(request.purchaseOrderNumber())
            .orElseThrow(() -> new InventoryException(HttpStatus.NOT_FOUND, "Không tìm thấy purchase order."));

        GoodsReceipt replay = goodsReceiptRepository.findByIdempotencyKey(request.idempotencyKey()).orElse(null);
        if (replay != null) {
            if (!replay.getRequestFingerprint().equals(fingerprint)) {
                throw new InventoryException(HttpStatus.CONFLICT, "Idempotency key đã được dùng cho payload khác.");
            }
            return toReceiptResponse(replay, true);
        }

        if (order.getStatus() != PurchaseOrderStatus.APPROVED) {
            throw new InventoryException(HttpStatus.CONFLICT, "Purchase order chưa được duyệt nên không thể nhập kho.");
        }

        validateNoDuplicateSerials(request.items());
        Map<String, PurchaseOrderLine> linesBySku = order.getLines().stream()
            .collect(Collectors.toMap(line -> line.getProduct().getSku(), Function.identity()));
        Map<String, Long> quantitiesBySku = request.items().stream()
            .collect(Collectors.groupingBy(ReceiveItemRequest::sku, Collectors.counting()));

        quantitiesBySku.forEach((sku, quantity) -> {
            PurchaseOrderLine line = linesBySku.get(sku);
            if (line == null) {
                throw new InventoryException(HttpStatus.BAD_REQUEST, "SKU " + sku + " không thuộc purchase order.");
            }
            if (line.getReceivedQuantity() + quantity > line.getApprovedQuantity()) {
                throw new InventoryException(HttpStatus.CONFLICT, "Số lượng nhận của SKU " + sku + " vượt số lượng đã duyệt.");
            }
        });

        for (ReceiveItemRequest item : request.items()) {
            if (productUnitRepository.existsBySerialImei(item.serialImei())) {
                throw new InventoryException(HttpStatus.CONFLICT, "Serial/IMEI đã tồn tại: " + item.serialImei());
            }
        }

        GoodsReceipt receipt = new GoodsReceipt(
            "GR-" + UUID.randomUUID(), request.idempotencyKey(), fingerprint, order, order.getWarehouse(),
            Instant.now().truncatedTo(ChronoUnit.MICROS)
        );
        Map<String, Integer> receivedCounts = new HashMap<>();
        for (ReceiveItemRequest item : request.items()) {
            PurchaseOrderLine line = linesBySku.get(item.sku());
            ProductUnit unit = productUnitRepository.save(new ProductUnit(
                item.serialImei(), line.getProduct(), order.getWarehouse(), item.condition()
            ));
            receipt.addItem(unit);
            receivedCounts.merge(item.sku(), 1, Integer::sum);
        }
        receivedCounts.forEach((sku, quantity) -> linesBySku.get(sku).receive(quantity));

        GoodsReceipt saved = goodsReceiptRepository.saveAndFlush(receipt);
        return toReceiptResponse(saved, false);
    }

    private void validateNoDuplicateSerials(List<ReceiveItemRequest> items) {
        Set<String> serials = new HashSet<>();
        for (ReceiveItemRequest item : items) {
            if (!serials.add(item.serialImei())) {
                throw new InventoryException(HttpStatus.CONFLICT, "Serial/IMEI bị lặp trong cùng yêu cầu: " + item.serialImei());
            }
        }
    }

    private String fingerprint(CreateGoodsReceiptRequest request) {
        StringBuilder canonical = new StringBuilder();
        appendPart(canonical, request.purchaseOrderNumber());
        request.items().forEach(item -> {
            appendPart(canonical, item.sku());
            appendPart(canonical, item.serialImei());
            appendPart(canonical, item.condition().name());
        });
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime.", exception);
        }
    }

    private void appendPart(StringBuilder target, String value) {
        target.append(value.length()).append(':').append(value).append('|');
    }

    private PurchaseOrderResponse toPurchaseOrderResponse(PurchaseOrder order) {
        List<PurchaseOrderLineResponse> lines = order.getLines().stream()
            .map(line -> new PurchaseOrderLineResponse(
                line.getProduct().getSku(), line.getProduct().getName(), line.getApprovedQuantity(),
                line.getReceivedQuantity(), line.getApprovedQuantity() - line.getReceivedQuantity()
            ))
            .toList();
        return new PurchaseOrderResponse(
            order.getOrderNumber(), order.getStatus(), order.getWarehouse().getCode(), order.getWarehouse().getName(), lines
        );
    }

    private GoodsReceiptResponse toReceiptResponse(GoodsReceipt receipt, boolean replayed) {
        List<ReceivedUnitResponse> items = receipt.getItems().stream()
            .map(item -> item.getProductUnit())
            .map(unit -> new ReceivedUnitResponse(
                unit.getProduct().getSku(), unit.getSerialImei(), unit.getCondition(), unit.getInventoryStatus()
            ))
            .toList();
        long available = items.stream().filter(item -> item.inventoryStatus() == InventoryStatus.AVAILABLE).count();
        return new GoodsReceiptResponse(
            receipt.getReceiptNumber(), receipt.getIdempotencyKey(), receipt.getPurchaseOrder().getOrderNumber(),
            receipt.getWarehouse().getCode(), receipt.getCreatedAt(), replayed, available, items.size() - available, items
        );
    }
}
