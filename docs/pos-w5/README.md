# TV4 Week 5 - POS checkout demo

This build integrates POS checkout with the W3/W4 inventory model. It does not
create a second product or stock store.

## Scope

- List products from the existing `products` table.
- List only `GOOD` and `AVAILABLE` `ProductUnit` rows.
- Add one uniquely identified unit to the cart.
- Simulate cash confirmation with `DEMO_CASH`.
- Persist a sale and receipt, then mark the same unit `SOLD` in one transaction.
- Reject unavailable/defective/sold units, duplicate carts and concurrent sales.
- Replay an identical request safely with the same idempotency key.

Not included: real VietQR/payment gateway, physical receipt printer, customer
module, 15-minute stock reservation, AI, logistics or warranty.

## Run on a Windows PC

Prerequisites: Java 26, Node.js 20+ and npm.

Terminal 1:

```powershell
cd D:\smart-electronic-supermarket\backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

Terminal 2:

```powershell
cd D:\smart-electronic-supermarket\frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The demo profile uses the existing file database at
`backend/data/sasms-demo.mv.db`. The startup migration only expands the H2
inventory-status enum so the W4 database can store `SOLD`; it does not drop or
recreate data.

## PC demo procedure

1. Open `http://localhost:5173/inventory.html` and load
   `PO-DEMO-APPROVED`.
2. Receive one unique Serial/IMEI with condition `GOOD`. Include leading zeros
   in the test value.
3. Open `http://localhost:5173`, choose its SKU and exact Serial/IMEI, then add
   it to the cart.
4. Confirm the cart total and select the simulated `DEMO_CASH` checkout.
5. Capture the displayed sale number, Serial/IMEI and receipt total.
6. Reload the product units. The sold Serial/IMEI must no longer be available.
7. Retry the same JSON and idempotency key: the API must return the same sale
   with `replay: true` and must not create a second sale.
8. Try a different idempotency key for the sold Serial/IMEI: expect HTTP 409.
9. Receive a `DEFECTIVE` unit and confirm it never appears in the POS selector.

Do not reuse the sample serials if they are already present in the file DB.

## API

- `GET /api/pos/status` - preserves the W2 status endpoint.
- `GET /api/pos/products` - product, demo price and sellable count.
- `GET /api/pos/products/{sku}/units` - sellable real units only.
- `POST /api/pos/sales` - transactional demo checkout.
- `GET /api/pos/sales/{saleNumber}` - persisted receipt.

Example checkout:

```json
{
  "idempotencyKey": "pos-demo-unique-key",
  "customerName": "Khach le",
  "paymentMethod": "DEMO_CASH",
  "lines": [
    {
      "sku": "PHONE-DEMO",
      "serialImei": "000012345678901"
    }
  ]
}
```

A new sale returns HTTP 201. An exact retry returns HTTP 200 with the same
`saleNumber` and `replay: true`. A conflicting/unavailable unit returns HTTP
409. Price is always resolved on the server; the client does not submit it.

## Verification commands

```powershell
cd backend
.\mvnw.cmd clean verify

cd ..\frontend
npm test
npm run build
npm audit

cd ..
git diff --check
git status --short
```

The latest observed results are recorded in `W5_RELEASE_REPORT.md` and
`W5_TEST_MATRIX.csv`; do not reuse those results as evidence for a later run.
