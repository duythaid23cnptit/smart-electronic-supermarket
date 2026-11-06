-- Optional fresh demo fixture for a dedicated SASMS MySQL database.
-- Safe to rerun: existing business keys are not updated or duplicated.
-- This is new demo data, not a migration of historical H2 W5/W6 data.
USE sasms_tv4_test;
START TRANSACTION;

INSERT IGNORE INTO warehouses (code, name)
VALUES ('WH-HCM-01', 'Kho demo TP.HCM');

INSERT IGNORE INTO products (sku, name)
VALUES
    ('TV-55-DEMO', 'Smart TV 55 inch Demo'),
    ('PHONE-DEMO', 'Điện thoại Demo');

INSERT IGNORE INTO purchase_orders (order_number, status, warehouse_id)
SELECT 'PO-MYSQL-DEMO-APPROVED', 'APPROVED', warehouse.id
FROM warehouses warehouse
WHERE warehouse.code = 'WH-HCM-01';

INSERT IGNORE INTO purchase_orders (order_number, status, warehouse_id)
SELECT 'PO-MYSQL-DEMO-DRAFT', 'DRAFT', warehouse.id
FROM warehouses warehouse
WHERE warehouse.code = 'WH-HCM-01';

INSERT IGNORE INTO purchase_order_lines (
    purchase_order_id, product_id, approved_quantity, received_quantity
)
SELECT purchase_order.id, product.id, 3, 0
FROM purchase_orders purchase_order
JOIN products product ON product.sku = 'TV-55-DEMO'
WHERE purchase_order.order_number = 'PO-MYSQL-DEMO-APPROVED';

INSERT IGNORE INTO purchase_order_lines (
    purchase_order_id, product_id, approved_quantity, received_quantity
)
SELECT purchase_order.id, product.id, 2, 0
FROM purchase_orders purchase_order
JOIN products product ON product.sku = 'PHONE-DEMO'
WHERE purchase_order.order_number = 'PO-MYSQL-DEMO-APPROVED';

INSERT IGNORE INTO purchase_order_lines (
    purchase_order_id, product_id, approved_quantity, received_quantity
)
SELECT purchase_order.id, product.id, 1, 0
FROM purchase_orders purchase_order
JOIN products product ON product.sku = 'TV-55-DEMO'
WHERE purchase_order.order_number = 'PO-MYSQL-DEMO-DRAFT';

COMMIT;

SELECT order_number, status
FROM purchase_orders
WHERE order_number IN ('PO-MYSQL-DEMO-APPROVED', 'PO-MYSQL-DEMO-DRAFT')
ORDER BY order_number;
