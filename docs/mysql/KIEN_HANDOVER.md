# SASMS TV4 MySQL handover for Kiên

## Package contents

| Deliverable | Path | Status |
|---|---|---|
| Executable MySQL DDL | `backend/src/main/resources/db/mysql/schema.sql` | Ready |
| Database creation script | `backend/src/main/resources/db/mysql/create-databases.sql` | Ready |
| Fresh test fixture | `backend/src/main/resources/db/mysql/demo-data.sql` | Targets `sasms_tv4_test`; not historical migration |
| Spring MySQL profile | `backend/src/main/resources/application-mysql.properties` | Ready |
| Entity–Table mapping | `docs/mysql/SASMS_TV4_MYSQL_SCHEMA.md` | Ready |
| ERD for nine tables | `docs/mysql/ERD_9_TABLES.md` | Ready |
| Deployment guide | `docs/mysql/README.md` | Ready |
| E2E matrix | `docs/mysql/MYSQL_E2E_TEST_MATRIX.csv` | Ready; MYSQL-015 PASS |
| E2E report | `docs/mysql/MYSQL_TEST_REPORT.md` | Ready |
| Direct SELECT evidence summary | `docs/mysql/MYSQL_SELECT_EVIDENCE.md` | Seven tables plus database/version verified |
| PostgreSQL 37-table comparison | `docs/mysql/POSTGRESQL_37_TABLE_COMPARISON.md` | Scope/platform comparison only |

## External evidence

Screenshots, exact API JSON and the prepared SELECT script are stored outside Git at:

`D:\SASMS_MYSQL_E2E_EVIDENCE\MYSQL_E2E_20261106-180332`

Key identifiers:

- Receipt `GR-ebd97d44-ec58-44d1-8c13-ab3d16ee94c3`.
- GOOD/SOLD Serial `000020261106MYSQL01`.
- DEFECTIVE Serial `000020261106MYSQL02`.
- Sale `POS-f58295fc-053a-4f1e-9cc0-6408a20e6fef`.

## Evidence status

- Functional Inventory → POS E2E: PASS.
- Direct SELECT `product_units`: PASS.
- Direct SELECT `pos_sales`: PASS.
- Direct SELECT `pos_sale_items`: PASS.
- Direct SELECT `purchase_orders`, `purchase_order_lines`, `goods_receipts` and `goods_receipt_items`: PASS.
- `DATABASE()` = `sasms_tv4_test`; `VERSION()` = `8.0.43`: PASS.
- Historical H2-to-MySQL migration: NOT RUN and not claimed.

## Documentation rules

1. Call this the implemented TV4 Inventory/POS subset, not the full SASMS database.
2. Do not describe the fresh MySQL test fixture as migrated W5/W6 history or as a verified `sasms_tv4_demo` seed.
3. Preserve Serial/IMEI as a string and retain leading zeroes.
4. Keep idempotency and unique constraints in diagrams and descriptions.
5. Preserve the distinction between detailed row evidence and table-level confirmation when reusing MYSQL-015 evidence.
