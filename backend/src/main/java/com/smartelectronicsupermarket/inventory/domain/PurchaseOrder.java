package com.smartelectronicsupermarket.inventory.domain;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders", uniqueConstraints = @UniqueConstraint(name = "uk_purchase_order_number", columnNames = "order_number"))
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, length = 80)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchaseOrderStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderLine> lines = new ArrayList<>();

    protected PurchaseOrder() {}

    public PurchaseOrder(String orderNumber, PurchaseOrderStatus status, Warehouse warehouse) {
        this.orderNumber = orderNumber;
        this.status = status;
        this.warehouse = warehouse;
    }

    public void addLine(Product product, int approvedQuantity) {
        lines.add(new PurchaseOrderLine(this, product, approvedQuantity));
    }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public PurchaseOrderStatus getStatus() { return status; }
    public Warehouse getWarehouse() { return warehouse; }
    public List<PurchaseOrderLine> getLines() { return lines; }
}
