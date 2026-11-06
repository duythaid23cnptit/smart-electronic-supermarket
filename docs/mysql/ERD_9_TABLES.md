# ERD — SASMS TV4 implemented MySQL scope

This ERD contains only the nine tables implemented for Inventory QR/Serial-IMEI and counter POS.

```mermaid
erDiagram
    WAREHOUSES ||--o{ PURCHASE_ORDERS : receives
    WAREHOUSES ||--o{ PRODUCT_UNITS : stores
    WAREHOUSES ||--o{ GOODS_RECEIPTS : records

    PRODUCTS ||--o{ PURCHASE_ORDER_LINES : ordered_as
    PRODUCTS ||--o{ PRODUCT_UNITS : identifies

    PURCHASE_ORDERS ||--|{ PURCHASE_ORDER_LINES : contains
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPTS : fulfilled_by

    GOODS_RECEIPTS ||--|{ GOODS_RECEIPT_ITEMS : contains
    PRODUCT_UNITS ||--o| GOODS_RECEIPT_ITEMS : received_as

    POS_SALES ||--|{ POS_SALE_ITEMS : contains
    POS_SALES o|..o{ PRODUCT_UNITS : "logical sold_sale_number (no FK)"

    WAREHOUSES {
        BIGINT id PK
        VARCHAR code UK
        VARCHAR name
    }
    PRODUCTS {
        BIGINT id PK
        VARCHAR sku UK
        VARCHAR name
    }
    PURCHASE_ORDERS {
        BIGINT id PK
        VARCHAR order_number UK
        ENUM status
        BIGINT warehouse_id FK
    }
    PURCHASE_ORDER_LINES {
        BIGINT id PK
        BIGINT purchase_order_id FK
        BIGINT product_id FK
        INT approved_quantity
        INT received_quantity
    }
    PRODUCT_UNITS {
        BIGINT id PK
        VARCHAR serial_imei UK
        BIGINT product_id FK
        BIGINT warehouse_id FK
        ENUM unit_condition
        ENUM inventory_status
        VARCHAR sold_sale_number
    }
    GOODS_RECEIPTS {
        BIGINT id PK
        VARCHAR receipt_number UK
        VARCHAR idempotency_key UK
        VARCHAR request_fingerprint
        BIGINT purchase_order_id FK
        BIGINT warehouse_id FK
        DATETIME created_at
    }
    GOODS_RECEIPT_ITEMS {
        BIGINT id PK
        BIGINT goods_receipt_id FK
        BIGINT product_unit_id FK_UK
    }
    POS_SALES {
        BIGINT id PK
        VARCHAR sale_number UK
        VARCHAR idempotency_key UK
        VARCHAR request_fingerprint
        VARCHAR customer_name
        VARCHAR payment_method
        VARCHAR payment_status
        BIGINT total_vnd
        DATETIME created_at
    }
    POS_SALE_ITEMS {
        BIGINT id PK
        BIGINT sale_id FK
        VARCHAR sku
        VARCHAR product_name
        VARCHAR serial_imei UK
        BIGINT unit_price_vnd
    }
```

`product_units.sold_sale_number` is a business reference maintained by the domain model, not a JPA relationship. The DDL deliberately does not invent a foreign key that is absent from the entity mapping.

## Alignment check against `schema.sql`

Status: **PASS**.

- Both artifacts contain exactly the same nine tables.
- The ERD contains all 10 physical foreign-key relationships declared by the DDL.
- The dotted POS Sale → ProductUnit relationship is explicitly logical and does not claim a physical FK.
- PK, single-column unique keys and foreign-key columns match the DDL.
- `purchase_order_lines` additionally has the composite unique constraint `(purchase_order_id, product_id)` in the DDL.
- Check constraints for PO quantities, ProductUnit state, sale totals and unit prices remain authoritative in `schema.sql`; they are constraints rather than ERD relationships.
- Performance indexes declared by the DDL are intentionally not represented as ERD cardinalities.
