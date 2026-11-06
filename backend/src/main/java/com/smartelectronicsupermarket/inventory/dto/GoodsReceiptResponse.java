package com.smartelectronicsupermarket.inventory.dto;

import java.time.Instant;
import java.util.List;

public record GoodsReceiptResponse(
    String receiptNumber,
    String idempotencyKey,
    String purchaseOrderNumber,
    String warehouseCode,
    Instant createdAt,
    boolean replayed,
    long availableQuantity,
    long defectiveQuantity,
    List<ReceivedUnitResponse> items
) {}
