# TV4 Week 5 POS checkout integration report

Execution date: 2026-10-29
Member: Vũ Duy Thái
Role: TV4 - Dev Lead
Branch: `feat/tv4-w5-pos-checkout`
Base: W4 commit `930c79f`

## Outcome

The W5 implementation connects POS to the existing W3/W4 `Product` and
`ProductUnit` persistence. Checkout stores `pos_sales`/`pos_sale_items` and
changes the locked real unit from `AVAILABLE` to `SOLD` in the same transaction.
No independent fake inventory was added.

This is a tested demo build, not a statement of PM acceptance or completed
business scope.

## Input and requirement audit

- Read the W5 integration guide and all POS source under
  `docs/tv4-w5-input` before integration.
- Compared it with current W3/W4 inventory entities, repositories, receiving
  service, frontend and H2 demo configuration.
- No Huy FRS/FRS_V2 file was found in this repository. FR-11/FR-12 references
  in the input guide therefore could not be verified against an authoritative
  local FRS.
- The input package was used as a design reference, not copied over W4.

## Implemented changes

- Added additive `SOLD` inventory state and nullable sale-number link on
  `ProductUnit`.
- Added pessimistic-lock lookup for a sale and filtered queries for
  `GOOD` + `AVAILABLE` units.
- Added transactional checkout service, sale/item persistence, receipt API,
  request fingerprint and unique idempotency key.
- Added server-side demo price configuration. The client cannot submit or
  override price.
- Added desktop POS UI with product/unit selection, cart, duplicate-submit
  guard, stable retry key, simulated cash checkout and receipt.
- Preserved `/api/pos/status`, all inventory APIs and W1-W4 frontend entry
  points.

## Actual issue found and resolved

The existing W4 file database defined `product_units.inventory_status` as an
H2 enum containing only `AVAILABLE` and `DEFECTIVE`. Hibernate `ddl-auto=update`
created the new POS tables and column but did not expand that enum. The first
live checkout therefore failed while writing `SOLD` with H2 SQLState 22030.

The failed transaction left the unit `AVAILABLE` and created no sale, proving
rollback behavior. A profile-`demo` startup migration now expands only that H2
enum to include `SOLD`. A byte-for-byte pre-W5 DB backup was made before the
live migration. After the fix the checkout, retry, rejection and restart checks
passed.

For any non-demo database, a reviewed Flyway/Liquibase migration is still an
Architect/DBA decision. The H2-specific migration must not be treated as a
production migration strategy.

## Verification evidence

Environment observed:

- Windows 11 x64
- Oracle Java 26.0.2.1
- Maven Wrapper / Maven 3.9.16
- Spring Boot 4.1.1
- Node.js 22.23.1
- npm 10.9.8

Final runs completed:

- Maven `clean verify`: **PASS**, 20 tests, 0 failures, 0 errors, 0 skipped;
  packaged `pos-service-0.0.1-SNAPSHOT.jar`.
- Frontend test: **PASS**, 13/13.
- Frontend build: **PASS**, 355 modules transformed. The count decreased from
  the earlier run because the obsolete Serial/IMEI skeleton status UI imports
  were removed.
- npm audit: **FAIL**, 4 known vulnerabilities (3 high, 1 moderate).
  `follow-redirects` and `source-map-js` report non-force fixes; eliminating the
  `esbuild` advisory would require the breaking Vite 8 upgrade suggested by
  `npm audit fix --force`. No dependency was changed automatically.
- Live Kho -> POS -> Kho API/H2 flow: **PASS**.
- Browser UI execution by the developer: **NOT RUN** because the automation
  host was unavailable and access to the existing Chrome window was not
  approved.
- Manual Chrome Windows execution reported by the student: **PASS** with the
  concrete receipt and sale identifiers recorded below. No screenshot file was
  supplied in the repository during this update.

Live scenario:

1. Goods receipt created `GOOD` unit `000020261029W5GOOD` and `DEFECTIVE` unit
   `000020261029W5DEF` against the approved demo PO.
2. POS exposed only the GOOD value and preserved all leading zeros.
3. Checkout stored sale
   `POS-35c7f260-5fbf-473d-b2f0-1843860cb4f5` for VND 5,000,000.
4. Exact retry returned the same sale with `replay: true`.
5. A different request attempted to resell the serial and received HTTP 409.
6. After backend restart, the receipt remained readable and the SKU had zero
   sellable units.

Student-verified Chrome Windows scenario supplied on 2026-10-29:

1. Goods receipt: `GR-7e86369d-5658-4dcd-84af-fed3e0318efb`.
2. SKU / Serial: `TV-55-DEMO` / `000020261029POS02`.
3. POS sale: `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c`.
4. Total and payment: VND 15,000,000, `DEMO_CASH`,
   `DEMO_CONFIRMED`.
5. The student verified that `GET /api/pos/sales/{saleNumber}` returned the
   corresponding backend receipt and that
   `GET /api/pos/products/TV-55-DEMO/units` no longer returned the sold serial.

Independent follow-up in this update:

- The running backend returned sale
  `POS-1c4b42f3-d75d-4fe9-9a28-1bc3d9907a2c` with Serial
  `000020261029POS02`, total `15000000`, `DEMO_CASH` and
  `DEMO_CONFIRMED`; the units endpoint independently confirmed
  `SerialStillSellable: false`.
- A second checkout for `000020261029POS02` using idempotency key
  `pos-w5-resale-verify-20261029-01` returned HTTP 409 with the message that the
  unit was no longer available.
- The repository integration test uses this exact leading-zero serial and
  verifies `InventoryStatus.SOLD` plus its `soldSaleNumber` link after checkout.
- A direct SQL read of the live file database was **NOT RUN** because the
  already-running demo backend held the H2 file lock. The process and database
  were deliberately not stopped, copied, reset or deleted.

The first Maven rerun after replacing the integration-test serial failed one
list-order assertion: the repository correctly sorted `000000000002` before
`000020261029POS02`, while the test expected the reverse. Only the test
expectation was corrected; production code and business rules were unchanged.
The subsequent clean verification passed all 20 tests.

See `W5_TEST_MATRIX.csv` for scenario-level status.

## Planned versus actual

| Planned W5 item | Actual status | Evidence / gap |
|---|---|---|
| Select product and available serial | Implemented and API-tested | Real ProductUnit query; frontend build/tests |
| Cart and total | Implemented and unit-tested | Server-side price and overflow-safe total |
| Cash payment | Demo only | `DEMO_CASH` / `DEMO_CONFIRMED`; no financial integration |
| Sale and receipt | Implemented and persisted | POST/GET sale API and restart check |
| Mark unit SOLD atomically | Implemented and tested | Transaction + row lock + rollback tests |
| Prevent repeat/concurrent sale | Implemented and tested | Unique constraints, idempotency and concurrency test |
| Preserve W1-W4 | Automated regression passed | Full Maven and frontend suites |
| Interactive browser demo | Student-verified PASS | Chrome Windows identifiers recorded; screenshot files not supplied |
| FR-11 15-minute hold | Deferred | Explicitly outside this demo |
| FR-12 real VietQR/printing | Deferred | Explicitly outside this demo |

## Approvals and risks

BA/PM/Architect confirmation is required for:

1. Authoritative product prices and tax/discount/rounding rules. Current values
   are clearly isolated demo assumptions.
2. Whether `SOLD` and `sold_sale_number` are the accepted lifecycle and
   relationship for ProductUnit.
3. Production schema migration tooling and foreign-key ownership between sale
   and inventory.
4. Customer identity requirements; the demo stores only an optional display
   name and does not create a customer module.
5. Payment state machine, cancellation/returns and the 15-minute reservation.
6. Receipt numbering policy, fiscal fields, VietQR and physical printing.

Remaining technical risks:

- File H2 and `ddl-auto=update` are suitable only for this student demo.
- The demo price map fails closed for an unconfigured SKU, but it is not a
  product pricing source.
- No authentication/authorization exists for checkout endpoints.
- Browser automation remains unavailable; future UI regressions still require
  repeatable manual screenshots or an approved browser test runner.
- No authoritative FRS was available locally for traceability approval.

## Release decision

**Demo candidate; not accepted/released.** Automated backend/frontend, live
API/H2 integration and the student-reported Chrome scenario pass. Stakeholder
rule approval, screenshot artifacts and production migration design remain
open.
