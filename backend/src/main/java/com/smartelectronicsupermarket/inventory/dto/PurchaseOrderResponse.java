package com.smartelectronicsupermarket.inventory.dto;

import com.smartelectronicsupermarket.inventory.domain.PurchaseOrderStatus;
import java.util.List;

public record PurchaseOrderResponse(
    String orderNumber,
    PurchaseOrderStatus status,
    String warehouseCode,
    String warehouseName,
    List<PurchaseOrderLineResponse> lines
) {}
