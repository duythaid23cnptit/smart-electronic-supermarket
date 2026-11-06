# MySQL implementation and E2E test report

Date: 2026-11-06

Branch: `feat/tv4-mysql-integration` (based on UI V3 commit `0ed2555`)

PR B base commit: `0ed255582b06b49493744d778b33060f1a942a1e`

## Environment

| Check | Result |
|---|---|
| MySQL Server | PASS — MySQL Community Server 8.0.43 |
| MySQL profile | PASS — backend PID 3984 on port 8082 |
| Frontend proxy | PASS — Vite 5175 resolved `/api` to `http://127.0.0.1:8082` |
| Database fixture | PASS — two products, two POs and three PO lines read through API |
| Direct Workbench SELECT evidence | PASS — all seven requested tables verified |
| `SELECT DATABASE()` / `VERSION()` | PASS — `sasms_tv4_test` / `8.0.43` |

The target database `sasms_tv4_test` and its nine-table setup were supplied as verified prerequisites. No password was read, guessed or stored.

## Implementation

- MySQL Connector/J 9.7.0 is managed by Spring Boot 4.1.1 and packaged at runtime.
- The separate `mysql` profile takes credentials from environment variables, uses port 8082, disables H2 console/SQL initialization and uses `ddl-auto=validate`.
- H2 profiles and files remain unchanged by the MySQL configuration.
- The executable schema contains exactly nine Inventory/POS tables documented in `SASMS_TV4_MYSQL_SCHEMA.md`.

## E2E result

Inventory → POS completed successfully through frontend V3 on port 5175:

- Goods Receipt: `GR-ebd97d44-ec58-44d1-8c13-ab3d16ee94c3`.
- Receipt idempotency replay returned the same receipt with `replayed=true`.
- Duplicate Serial, quantity over PO limit and DRAFT PO returned HTTP 409 without changing inventory.
- GOOD `000020261106MYSQL01` became AVAILABLE and was visible in POS.
- DEFECTIVE `000020261106MYSQL02` was not sellable.
- Sale: `POS-f58295fc-053a-4f1e-9cc0-6408a20e6fef`.
- Payment: `DEMO_CASH`; status: `DEMO_CONFIRMED`; total: 15,000,000 VND.
- Exactly one checkout request was sent.
- After checkout, TV available changed from 1 to 0 and the sold Serial disappeared from the sellable endpoint.
- A direct `product_units` SELECT confirmed that GOOD Serial `000020261106MYSQL01` is `SOLD`, its `sold_sale_number` matches the sale, and DEFECTIVE Serial `000020261106MYSQL02` remains `DEFECTIVE`.
- Direct `pos_sales` and `pos_sale_items` SELECT results confirmed DEMO_CASH, DEMO_CONFIRMED, total/unit price 15,000,000 VND and the expected SKU/Serial.
- Direct Workbench SELECT results also confirmed `purchase_orders`, `purchase_order_lines`, `goods_receipts` and `goods_receipt_items`.
- `DATABASE()` returned `sasms_tv4_test`; `VERSION()` returned `8.0.43`.

See `MYSQL_E2E_TEST_MATRIX.csv` for Expected, Actual, HTTP status and evidence per test.

## Direct database verification

Aggregate test MYSQL-015 is **PASS** based on direct Workbench SELECT confirmation for `purchase_orders`, `purchase_order_lines`, `goods_receipts`, `goods_receipt_items`, `product_units`, `pos_sales` and `pos_sale_items`, plus `DATABASE()` and `VERSION()`. The detailed post-checkout states supplied for ProductUnit and POS are recorded in `MYSQL_SELECT_EVIDENCE.md`.

## Regression

| Command | Result |
|---|---|
| Backend `clean verify` | PASS — 22 tests, 0 failures, 0 errors, 2 guarded skips |
| Frontend tests | PASS — 16/16 |
| Frontend Vite build | PASS — `/`, `/inventory.html`, `/qr-poc.html` |
| `git diff --cached --check` | PASS after final documentation review |

## Data migration status

This is a fresh MySQL test fixture in `sasms_tv4_test` and new MySQL E2E transaction history. Historical H2 W5/W6/E2E receipts and sales were not imported. No H2 file was reset, copied, deleted or used by the MySQL E2E flow. The fixture seed state of `sasms_tv4_demo` is NOT VERIFIED.
