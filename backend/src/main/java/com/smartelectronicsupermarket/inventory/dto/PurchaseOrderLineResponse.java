package com.smartelectronicsupermarket.inventory.dto;

public record PurchaseOrderLineResponse(
    String sku,
    String productName,
    int approvedQuantity,
    int receivedQuantity,
    int remainingQuantity
) {}
