package com.smartelectronicsupermarket.inventory.dto;

import com.smartelectronicsupermarket.inventory.domain.UnitCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReceiveItemRequest(
    @NotBlank @Size(max = 80) String sku,
    @NotBlank @Size(max = 160) String serialImei,
    @NotNull UnitCondition condition
) {}
