package com.smartelectronicsupermarket.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(name = "uk_product_sku", columnNames = "sku"))
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    protected Product() {}

    public Product(String sku, String name) {
        this.sku = sku;
        this.name = name;
    }

    public Long getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
}
