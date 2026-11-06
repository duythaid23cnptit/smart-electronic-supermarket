package com.smartelectronicsupermarket.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateGoodsReceiptRequest(
    @NotBlank @Size(max = 100) String idempotencyKey,
    @NotBlank @Size(max = 80) String purchaseOrderNumber,
    @NotEmpty @Size(max = 200) List<@Valid ReceiveItemRequest> items
) {}
