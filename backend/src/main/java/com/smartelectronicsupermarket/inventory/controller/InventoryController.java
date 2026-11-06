package com.smartelectronicsupermarket.inventory.controller;

import com.smartelectronicsupermarket.inventory.dto.CreateGoodsReceiptRequest;
import com.smartelectronicsupermarket.inventory.dto.GoodsReceiptResponse;
import com.smartelectronicsupermarket.inventory.dto.PurchaseOrderResponse;
import com.smartelectronicsupermarket.inventory.service.InventoryReceivingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryReceivingService receivingService;

    public InventoryController(InventoryReceivingService receivingService) {
        this.receivingService = receivingService;
    }

    @GetMapping("/purchase-orders/{orderNumber}")
    public PurchaseOrderResponse getPurchaseOrder(@PathVariable String orderNumber) {
        return receivingService.getPurchaseOrder(orderNumber);
    }

    @PostMapping("/goods-receipts")
    public ResponseEntity<GoodsReceiptResponse> createGoodsReceipt(
        @Valid @RequestBody CreateGoodsReceiptRequest request
    ) {
        GoodsReceiptResponse response = receivingService.receive(request);
        return ResponseEntity.status(response.replayed() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }
}
