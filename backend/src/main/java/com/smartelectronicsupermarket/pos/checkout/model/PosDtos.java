package com.smartelectronicsupermarket.pos.checkout.model;

import java.time.Instant;
import java.util.List;

public final class PosDtos {
    private PosDtos() {}

    public record ProductView(String sku, String name, long unitPriceVnd, long available) {}
    public record UnitView(String serialImei, String sku, String quality, String status) {}
    public record SaleLine(String sku, String serialImei) {}
    public record CreateSaleRequest(
        String idempotencyKey, String customerName, String paymentMethod, List<SaleLine> lines
    ) {}
    public record ReceiptLine(String sku, String productName, String serialImei, long unitPriceVnd) {}
    public record SaleReceipt(
        String saleNumber, String paymentMethod, String paymentStatus, String customerName,
        long totalVnd, Instant createdAt, List<ReceiptLine> lines, boolean replay
    ) {}
}
