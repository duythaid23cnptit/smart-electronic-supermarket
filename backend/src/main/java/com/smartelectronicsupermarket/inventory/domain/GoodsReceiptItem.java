package com.smartelectronicsupermarket.inventory.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "goods_receipt_items", uniqueConstraints = @UniqueConstraint(name = "uk_receipt_product_unit", columnNames = "product_unit_id"))
public class GoodsReceiptItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goods_receipt_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_unit_id", nullable = false)
    private ProductUnit productUnit;

    protected GoodsReceiptItem() {}

    GoodsReceiptItem(GoodsReceipt goodsReceipt, ProductUnit productUnit) {
        this.goodsReceipt = goodsReceipt;
        this.productUnit = productUnit;
    }

    public ProductUnit getProductUnit() { return productUnit; }
}
