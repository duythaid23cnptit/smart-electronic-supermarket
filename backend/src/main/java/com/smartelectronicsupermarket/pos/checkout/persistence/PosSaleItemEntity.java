package com.smartelectronicsupermarket.pos.checkout.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "pos_sale_items", uniqueConstraints = {
    @UniqueConstraint(name = "uk_pos_sold_serial", columnNames = "serial_imei")
})
public class PosSaleItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private PosSaleEntity sale;

    @Column(name = "sku", nullable = false, length = 100)
    private String sku;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "serial_imei", nullable = false, length = 160)
    private String serialImei;

    @Column(name = "unit_price_vnd", nullable = false)
    private long unitPriceVnd;

    protected PosSaleItemEntity() {}

    PosSaleItemEntity(PosSaleEntity sale, String sku, String productName, String serialImei, long unitPriceVnd) {
        this.sale = sale;
        this.sku = sku;
        this.productName = productName;
        this.serialImei = serialImei;
        this.unitPriceVnd = unitPriceVnd;
    }

    public String getSku() { return sku; }
    public String getProductName() { return productName; }
    public String getSerialImei() { return serialImei; }
    public long getUnitPriceVnd() { return unitPriceVnd; }
}
