# SASMS TV4 implemented MySQL schema

## Scope and source of truth

This document reflects the current Java entities for Inventory and counter POS only. The executable source of truth is [`schema.sql`](../../backend/src/main/resources/db/mysql/schema.sql).

The repository does not contain the referenced PostgreSQL document `Thiết kế cơ sở dữ liệu SASMS.docx`, so a column-by-column comparison with that document is **NOT VERIFIED**. The reported 37-table system-wide design must not be confused with the nine tables actually implemented here. See `POSTGRESQL_37_TABLE_COMPARISON.md` for the evidence-bounded scope/platform comparison.

## Implemented tables

| Table | Purpose | Primary/unique business keys |
|---|---|---|
| `warehouses` | Receiving warehouse | PK `id`; unique `code` |
| `products` | Product/SKU master used by Inventory and POS | PK `id`; unique `sku` |
| `purchase_orders` | PO header and approval state | PK `id`; unique `order_number`; FK warehouse |
| `purchase_order_lines` | Approved and received quantity per PO/SKU | PK `id`; unique PO + product; FKs PO/product |
| `product_units` | Physical unit identified by Serial/IMEI | PK `id`; globally unique `serial_imei`; FKs product/warehouse |
| `goods_receipts` | Idempotent receiving transaction header | PK `id`; unique receipt number and idempotency key; FKs PO/warehouse |
| `goods_receipt_items` | Receipt-to-unit association | PK `id`; unique product unit; FKs receipt/unit |
| `pos_sales` | Idempotent counter sale and payment result | PK `id`; unique sale number and idempotency key |
| `pos_sale_items` | Immutable SKU/Serial/price snapshot per sale | PK `id`; unique sold Serial; FK sale |

## Entity-to-table mapping

| Java entity | Table |
|---|---|
| `Warehouse` | `warehouses` |
| `Product` | `products` |
| `PurchaseOrder` | `purchase_orders` |
| `PurchaseOrderLine` | `purchase_order_lines` |
| `ProductUnit` | `product_units` |
| `GoodsReceipt` | `goods_receipts` |
| `GoodsReceiptItem` | `goods_receipt_items` |
| `PosSaleEntity` | `pos_sales` |
| `PosSaleItemEntity` | `pos_sale_items` |

## Columns and types

All IDs use `BIGINT AUTO_INCREMENT`. All foreign keys use `BIGINT`. Identifiers and Serial/IMEI values remain `VARCHAR`, preserving leading zeroes.

### `warehouses`

- `id BIGINT` PK, auto increment.
- `code VARCHAR(50)` not null, unique.
- `name VARCHAR(200)` not null.

### `products`

- `id BIGINT` PK, auto increment.
- `sku VARCHAR(80)` not null, unique.
- `name VARCHAR(200)` not null.

### `purchase_orders`

- `id BIGINT` PK, auto increment.
- `order_number VARCHAR(80)` not null, unique.
- `status ENUM('DRAFT','APPROVED')` not null.
- `warehouse_id BIGINT` not null, FK to `warehouses.id`.

### `purchase_order_lines`

- `id BIGINT` PK, auto increment.
- `purchase_order_id BIGINT` not null, FK to `purchase_orders.id`.
- `product_id BIGINT` not null, FK to `products.id`.
- `approved_quantity INT` positive.
- `received_quantity INT` from zero through approved quantity.
- Unique `(purchase_order_id, product_id)`.

### `product_units`

- `id BIGINT` PK, auto increment.
- `serial_imei VARCHAR(160)` not null, globally unique and case-sensitive under the selected collation.
- `product_id BIGINT` and `warehouse_id BIGINT`, not-null FKs.
- `unit_condition ENUM('GOOD','DEFECTIVE')`.
- `inventory_status ENUM('AVAILABLE','DEFECTIVE','SOLD')`.
- `sold_sale_number VARCHAR(64)` nullable. The entity stores a sale business identifier rather than a JPA relationship, so the DDL deliberately does not invent a foreign key.

### `goods_receipts`

- `id BIGINT` PK, auto increment.
- `receipt_number VARCHAR(80)` not null, unique.
- `idempotency_key VARCHAR(100)` not null, unique.
- `request_fingerprint VARCHAR(64)` not null.
- `purchase_order_id BIGINT`, `warehouse_id BIGINT`, not-null FKs.
- `created_at DATETIME(6)` not null, mapped from `Instant` in UTC-aware application code.

### `goods_receipt_items`

- `id BIGINT` PK, auto increment.
- `goods_receipt_id BIGINT` not null, FK.
- `product_unit_id BIGINT` not null, unique FK.

### `pos_sales`

- `id BIGINT` PK, auto increment.
- `sale_number VARCHAR(64)` and `idempotency_key VARCHAR(100)`, both unique.
- `request_fingerprint VARCHAR(64)` not null.
- `customer_name VARCHAR(120)`, `payment_method VARCHAR(32)`, `payment_status VARCHAR(32)`.
- `total_vnd BIGINT` positive. Integer VND is preserved; no floating-point or decimal rounding is introduced.
- `created_at DATETIME(6)` not null.

### `pos_sale_items`

- `id BIGINT` PK, auto increment.
- `sale_id BIGINT` not null, FK to `pos_sales.id`.
- `sku VARCHAR(100)`, `product_name VARCHAR(200)`, `serial_imei VARCHAR(160)`.
- `unit_price_vnd BIGINT` positive.
- `serial_imei` unique, preventing a second persisted sale item for the same unit.

## Relationships and flows

The handover ERD with columns and cardinalities is available in `ERD_9_TABLES.md`.

```text
Warehouse ──< PurchaseOrder ──< PurchaseOrderLine >── Product
    │               │
    │               └──< GoodsReceipt ──< GoodsReceiptItem >── ProductUnit
    │                                                          │
    └──────────────────────────────────────────────────────────<┘

ProductUnit (GOOD + AVAILABLE)
    └── POS checkout transaction
          ├── PosSale ──< PosSaleItem
          └── ProductUnit inventory_status = SOLD
```

Receiving locks the PO, checks approval and remaining quantity, enforces global Serial uniqueness, creates GOOD as AVAILABLE and DEFECTIVE as DEFECTIVE, then records the receipt in one transaction. POS locks the selected unit, verifies GOOD + AVAILABLE, calculates price server-side, records the sale and marks the unit SOLD in one transaction.

## MySQL-specific decisions

- `InnoDB` supports transactions, foreign keys and pessimistic row locking used by the repositories.
- `utf8mb4_0900_as_cs` makes business identifiers and Serial/IMEI comparisons accent- and case-sensitive.
- JPA `IDENTITY` maps to `AUTO_INCREMENT`.
- Java enums mapped with `EnumType.STRING` are represented as MySQL `ENUM` with the implemented values.
- VND amounts remain signed 64-bit integers (`BIGINT`).
- Unique idempotency keys exist independently for receiving and POS.
- Hibernate uses `ddl-auto=validate`; schema evolution is explicit SQL, not `update` or `create-drop`.

## PostgreSQL design comparison status

Confirmed differences at the platform level are syntax and physical types such as MySQL `AUTO_INCREMENT`, `ENUM`, `DATETIME(6)`, `InnoDB` and collation naming. Detailed comparison of table names, columns or relationships against the unavailable PostgreSQL document is **NOT VERIFIED**. No unimplemented system-wide table is claimed as present.
