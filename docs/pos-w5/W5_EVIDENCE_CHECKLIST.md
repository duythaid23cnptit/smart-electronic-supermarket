# W5 evidence checklist

Date: 2026-10-29

## Available now

- [x] Branch `feat/tv4-w5-pos-checkout` based on W4 commit `930c79f`.
- [x] Backend automated test output: 20 tests, zero failures/errors/skips.
- [x] Frontend automated test output: 13 tests passed.
- [x] Frontend build output: 355 modules transformed.
- [x] Live H2 API evidence for leading-zero `GOOD` Serial/IMEI.
- [x] Live H2 API evidence that `DEFECTIVE` is excluded.
- [x] Live receipt and exact-idempotency replay.
- [x] HTTP 409 evidence for reselling a sold unit.
- [x] Receipt and unavailable inventory confirmed after backend restart.
- [x] Student-reported Chrome Windows flow:
  `GR-7e86369d-5658-4dcd-84af-fed3e0318efb` → `TV-55-DEMO` /
  `000020261029POS02` → `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c`.
- [x] Student verified VND 15,000,000, `DEMO_CASH`, `DEMO_CONFIRMED`,
  backend receipt lookup and sold-unit absence from the units endpoint.
- [x] Independent resell request with a different idempotency key returned HTTP
  409 for `000020261029POS02`.
- [x] Independent backend GET matched sale, serial, total and payment fields;
  independent units GET confirmed the serial is no longer sellable.
- [x] Repository integration test uses the exact serial and verifies `SOLD`
  plus the sale-number link.
- [x] Pre-W5 H2 backup retained as
  `backend/data/sasms-demo-before-w5-20261029.mv.db` (Git-ignored).
- [x] Input folders `docs/tv4-w4` and `docs/tv4-w5-input` remain untracked
  and were not staged.

## Evidence artifacts not supplied yet

- [ ] Screenshot of goods receipt
  `GR-7e86369d-5658-4dcd-84af-fed3e0318efb`.
- [ ] Screenshot of `000020261029POS02` selected in POS.
- [ ] Screenshot of the VND 15,000,000 cart total.
- [ ] Screenshot of receipt `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c`.
- [ ] Screenshot showing the sold unit absent after reload.
- [ ] Screenshot of the HTTP/UI rejection when trying to resell the unit.
- [ ] `DEFECTIVE` receipt in inventory and its absence in POS.
- [ ] Terminal output for final Maven verify, frontend tests/build and
  `git diff --check`.

The automated browser session was not available and direct Chrome control was
not approved. The interactive UI result above is therefore attributed to the
student's manual Chrome Windows verification. Screenshot artifacts remain
unchecked because none were supplied in this repository update.

Direct SQL inspection of the live H2 file was not run because the active demo
backend held its embedded file lock. The backend was not stopped and the DB was
not reset or deleted; the repository-level SOLD/link assertion and independent
HTTP 409 request are recorded separately.

## Suggested screenshot naming

Use current timestamps and do not backdate:

- `W5_01_inventory_good_leading_zero.png`
- `W5_02_pos_serial_selected.png`
- `W5_03_pos_receipt.png`
- `W5_04_sold_unit_absent.png`
- `W5_05_duplicate_rejected.png`
- `W5_06_defective_excluded.png`
- `W5_07_test_terminals.png`
