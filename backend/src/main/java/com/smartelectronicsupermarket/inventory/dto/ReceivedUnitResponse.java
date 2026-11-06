package com.smartelectronicsupermarket.inventory.dto;

import com.smartelectronicsupermarket.inventory.domain.InventoryStatus;
import com.smartelectronicsupermarket.inventory.domain.UnitCondition;

public record ReceivedUnitResponse(
    String sku,
    String serialImei,
    UnitCondition condition,
    InventoryStatus inventoryStatus
) {}
