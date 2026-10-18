package com.smartelectronicsupermarket.inventory.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "goods_receipts", uniqueConstraints = {
    @UniqueConstraint(name = "uk_goods_receipt_number", columnNames = "receipt_number"),
    @UniqueConstraint(name = "uk_goods_receipt_idempotency", columnNames = "idempotency_key")
})
public class GoodsReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, length = 80)
    private String receiptNumber;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "request_fingerprint", nullable = false, length = 64)
    private String requestFingerprint;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "goodsReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<GoodsReceiptItem> items = new ArrayList<>();

    protected GoodsReceipt() {}

    public GoodsReceipt(String receiptNumber, String idempotencyKey, String requestFingerprint,
                        PurchaseOrder purchaseOrder, Warehouse warehouse, Instant createdAt) {
        this.receiptNumber = receiptNumber;
        this.idempotencyKey = idempotencyKey;
        this.requestFingerprint = requestFingerprint;
        this.purchaseOrder = purchaseOrder;
        this.warehouse = warehouse;
        this.createdAt = createdAt;
    }

    public void addItem(ProductUnit unit) { items.add(new GoodsReceiptItem(this, unit)); }
    public Long getId() { return id; }
    public String getReceiptNumber() { return receiptNumber; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getRequestFingerprint() { return requestFingerprint; }
    public PurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public Warehouse getWarehouse() { return warehouse; }
    public Instant getCreatedAt() { return createdAt; }
    public List<GoodsReceiptItem> getItems() { return items; }
}
