package com.smartelectronicsupermarket.pos.checkout.persistence;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pos_sales", uniqueConstraints = {
    @UniqueConstraint(name = "uk_pos_sale_key", columnNames = "idempotency_key"),
    @UniqueConstraint(name = "uk_pos_sale_number", columnNames = "sale_number")
})
public class PosSaleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sale_number", nullable = false, length = 64)
    private String saleNumber;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "request_fingerprint", nullable = false, length = 64)
    private String requestFingerprint;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "payment_method", nullable = false, length = 32)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false, length = 32)
    private String paymentStatus;

    @Column(name = "total_vnd", nullable = false)
    private long totalVnd;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PosSaleItemEntity> lines = new ArrayList<>();

    protected PosSaleEntity() {}

    public PosSaleEntity(
        String saleNumber, String idempotencyKey, String requestFingerprint,
        String customerName, String paymentMethod, long totalVnd, Instant createdAt
    ) {
        this.saleNumber = saleNumber;
        this.idempotencyKey = idempotencyKey;
        this.requestFingerprint = requestFingerprint;
        this.customerName = customerName;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = "DEMO_CONFIRMED";
        this.totalVnd = totalVnd;
        this.createdAt = createdAt;
    }

    public void addLine(String sku, String productName, String serialImei, long unitPriceVnd) {
        lines.add(new PosSaleItemEntity(this, sku, productName, serialImei, unitPriceVnd));
    }

    public String getSaleNumber() { return saleNumber; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getRequestFingerprint() { return requestFingerprint; }
    public String getCustomerName() { return customerName; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public long getTotalVnd() { return totalVnd; }
    public Instant getCreatedAt() { return createdAt; }
    public List<PosSaleItemEntity> getLines() { return lines; }
}
