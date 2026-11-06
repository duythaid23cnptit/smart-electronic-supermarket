# MySQL Workbench SELECT evidence

Date: 2026-11-06

Database reported by the tester: `sasms_tv4_test`

Evidence source: direct SELECT queries executed manually by the project member in MySQL Workbench. This document records only the results explicitly supplied after execution; it does not reconstruct unreported rows.

## Verified results

### `product_units` — PASS

| Serial/IMEI | Condition | Inventory status | Sale reference | Result |
|---|---|---|---|---|
| `000020261106MYSQL01` | GOOD | SOLD | `POS-f58295fc-053a-4f1e-9cc0-6408a20e6fef` | PASS |
| `000020261106MYSQL02` | DEFECTIVE | DEFECTIVE | Not reported/applicable | PASS |

This directly confirms that checkout persisted the SOLD state and linked the GOOD unit to the expected sale. It also confirms that the defective unit remained DEFECTIVE.

### `pos_sales` — PASS

| Sale number | Payment method | Payment status | Total VND | Result |
|---|---|---|---:|---|
| `POS-f58295fc-053a-4f1e-9cc0-6408a20e6fef` | DEMO_CASH | DEMO_CONFIRMED | 15000000 | PASS |

### `pos_sale_items` — PASS

The selected sale item contained the expected TV SKU, Serial `000020261106MYSQL01` and unit price `15000000` VND. Result: PASS.

## Completion status

None within MYSQL-015. The tester subsequently confirmed direct Workbench SELECT results for:

- `purchase_orders`.
- `purchase_order_lines`.
- `goods_receipts`.
- `goods_receipt_items`.
- `product_units`.
- `pos_sales`.
- `pos_sale_items`.

The tester also confirmed:

- `DATABASE()` = `sasms_tv4_test`.
- `VERSION()` = `8.0.43`.

The aggregate test `MYSQL-015` is therefore **PASS**. Detailed row values were supplied for the ProductUnit and POS tables; the remaining table confirmations are recorded at table/result-set level without inventing unreported column values.
