-- SASMS TV4 implemented schema: Inventory QR/Serial-IMEI and counter POS only.
-- MySQL 8.0+. Run against an empty, dedicated sasms_tv4_demo or sasms_tv4_test database.
-- The script intentionally does not DROP, TRUNCATE, create users, or select a database.

CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    CONSTRAINT pk_warehouses PRIMARY KEY (id),
    CONSTRAINT uk_warehouse_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sku VARCHAR(80) NOT NULL,
    name VARCHAR(200) NOT NULL,
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT uk_product_sku UNIQUE (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_number VARCHAR(80) NOT NULL,
    status ENUM('DRAFT', 'APPROVED') NOT NULL,
    warehouse_id BIGINT NOT NULL,
    CONSTRAINT pk_purchase_orders PRIMARY KEY (id),
    CONSTRAINT uk_purchase_order_number UNIQUE (order_number),
    CONSTRAINT fk_purchase_order_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES warehouses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_purchase_orders_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id BIGINT NOT NULL AUTO_INCREMENT,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    approved_quantity INT NOT NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_purchase_order_lines PRIMARY KEY (id),
    CONSTRAINT uk_po_line_product UNIQUE (purchase_order_id, product_id),
    CONSTRAINT ck_po_line_approved_positive CHECK (approved_quantity > 0),
    CONSTRAINT ck_po_line_received_range CHECK (
        received_quantity >= 0 AND received_quantity <= approved_quantity
    ),
    CONSTRAINT fk_po_line_order FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_po_line_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_po_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS product_units (
    id BIGINT NOT NULL AUTO_INCREMENT,
    serial_imei VARCHAR(160) NOT NULL,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    unit_condition ENUM('GOOD', 'DEFECTIVE') NOT NULL,
    inventory_status ENUM('AVAILABLE', 'DEFECTIVE', 'SOLD') NOT NULL,
    sold_sale_number VARCHAR(64) NULL,
    CONSTRAINT pk_product_units PRIMARY KEY (id),
    CONSTRAINT uk_product_unit_serial_imei UNIQUE (serial_imei),
    CONSTRAINT ck_product_unit_state CHECK (
        (unit_condition = 'GOOD' AND inventory_status IN ('AVAILABLE', 'SOLD'))
        OR (unit_condition = 'DEFECTIVE' AND inventory_status = 'DEFECTIVE')
    ),
    CONSTRAINT ck_product_unit_sale_reference CHECK (
        (inventory_status = 'SOLD' AND sold_sale_number IS NOT NULL)
        OR (inventory_status <> 'SOLD' AND sold_sale_number IS NULL)
    ),
    CONSTRAINT fk_product_unit_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_product_unit_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES warehouses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_product_units_product_state (product_id, unit_condition, inventory_status),
    INDEX ix_product_units_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS goods_receipts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    receipt_number VARCHAR(80) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    purchase_order_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_goods_receipts PRIMARY KEY (id),
    CONSTRAINT uk_goods_receipt_number UNIQUE (receipt_number),
    CONSTRAINT uk_goods_receipt_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_goods_receipt_order FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_goods_receipt_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES warehouses (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_goods_receipts_order (purchase_order_id),
    INDEX ix_goods_receipts_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    goods_receipt_id BIGINT NOT NULL,
    product_unit_id BIGINT NOT NULL,
    CONSTRAINT pk_goods_receipt_items PRIMARY KEY (id),
    CONSTRAINT uk_receipt_product_unit UNIQUE (product_unit_id),
    CONSTRAINT fk_receipt_item_receipt FOREIGN KEY (goods_receipt_id)
        REFERENCES goods_receipts (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_receipt_item_unit FOREIGN KEY (product_unit_id)
        REFERENCES product_units (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_receipt_items_receipt (goods_receipt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS pos_sales (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_number VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    payment_status VARCHAR(32) NOT NULL,
    total_vnd BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_pos_sales PRIMARY KEY (id),
    CONSTRAINT uk_pos_sale_key UNIQUE (idempotency_key),
    CONSTRAINT uk_pos_sale_number UNIQUE (sale_number),
    CONSTRAINT ck_pos_sale_total_positive CHECK (total_vnd > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS pos_sale_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_id BIGINT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    serial_imei VARCHAR(160) NOT NULL,
    unit_price_vnd BIGINT NOT NULL,
    CONSTRAINT pk_pos_sale_items PRIMARY KEY (id),
    CONSTRAINT uk_pos_sold_serial UNIQUE (serial_imei),
    CONSTRAINT ck_pos_sale_item_price_positive CHECK (unit_price_vnd > 0),
    CONSTRAINT fk_pos_sale_item_sale FOREIGN KEY (sale_id)
        REFERENCES pos_sales (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX ix_pos_sale_items_sale (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
