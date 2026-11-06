package com.smartelectronicsupermarket.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "product_units", uniqueConstraints = @UniqueConstraint(name = "uk_product_unit_serial_imei", columnNames = "serial_imei"))
public class ProductUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "serial_imei", nullable = false, length = 160)
    private String serialImei;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_condition", nullable = false, length = 20)
    private UnitCondition condition;

    @Enumerated(EnumType.STRING)
    @Column(name = "inventory_status", nullable = false, length = 20)
    private InventoryStatus inventoryStatus;

    @Column(name = "sold_sale_number", length = 64)
    private String soldSaleNumber;

    protected ProductUnit() {}

    public ProductUnit(String serialImei, Product product, Warehouse warehouse, UnitCondition condition) {
        this.serialImei = serialImei;
        this.product = product;
        this.warehouse = warehouse;
        this.condition = condition;
        this.inventoryStatus = condition == UnitCondition.GOOD ? InventoryStatus.AVAILABLE : InventoryStatus.DEFECTIVE;
    }

    public Long getId() { return id; }
    public String getSerialImei() { return serialImei; }
    public Product getProduct() { return product; }
    public Warehouse getWarehouse() { return warehouse; }
    public UnitCondition getCondition() { return condition; }
    public InventoryStatus getInventoryStatus() { return inventoryStatus; }
    public String getSoldSaleNumber() { return soldSaleNumber; }

    public void markSold(String saleNumber) {
        if (condition != UnitCondition.GOOD || inventoryStatus != InventoryStatus.AVAILABLE) {
            throw new IllegalStateException("ProductUnit is not sellable.");
        }
        if (saleNumber == null || saleNumber.isBlank() || saleNumber.length() > 64) {
            throw new IllegalArgumentException("Sale number is required.");
        }
        inventoryStatus = InventoryStatus.SOLD;
        soldSaleNumber = saleNumber;
    }
}
