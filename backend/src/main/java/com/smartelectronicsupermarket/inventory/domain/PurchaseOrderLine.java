package com.smartelectronicsupermarket.inventory.domain;

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
@Table(name = "purchase_order_lines", uniqueConstraints = @UniqueConstraint(name = "uk_po_line_product", columnNames = {"purchase_order_id", "product_id"}))
public class PurchaseOrderLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "approved_quantity", nullable = false)
    private int approvedQuantity;

    @Column(name = "received_quantity", nullable = false)
    private int receivedQuantity;

    protected PurchaseOrderLine() {}

    PurchaseOrderLine(PurchaseOrder purchaseOrder, Product product, int approvedQuantity) {
        this.purchaseOrder = purchaseOrder;
        this.product = product;
        this.approvedQuantity = approvedQuantity;
    }

    public void receive(int quantity) { this.receivedQuantity += quantity; }
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public int getApprovedQuantity() { return approvedQuantity; }
    public int getReceivedQuantity() { return receivedQuantity; }
}
