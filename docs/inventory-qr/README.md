# Module Inventory QR Code Source - TV4 Week 3

## Scope

This source adds inventory receiving to the existing React/Vite and Spring Boot application.
It does not implement or modify POS, payment, VietQR, receipt printing or microservices.

The repository had uncommitted W1 QR PoC changes, so `feat/tv4-w3-inventory-qr` was created
as a dependent branch while preserving the complete W1 working tree. No commit, push or merge
was performed automatically.

## Implemented domain

- Product identified by unique SKU.
- Warehouse identified by unique code.
- PurchaseOrder with DRAFT or APPROVED status and approved quantities per SKU.
- ProductUnit identified by globally unique Serial/IMEI.
- GoodsReceipt with globally unique idempotency key and request fingerprint.
- GoodsReceiptItem linking a receipt to each created ProductUnit.

## Enforced requirements

- Serial/IMEI remains an exact string; leading zeroes are preserved.
- Serial/IMEI has a database unique constraint across all ProductUnit records.
- A DRAFT purchase order cannot be received.
- Total received quantity cannot exceed approved quantity.
- GOOD units use inventory status AVAILABLE.
- DEFECTIVE units use inventory status DEFECTIVE and are not counted as available.
- Receiving executes in a transaction.
- PurchaseOrder is pessimistically locked during receipt creation.
- Reusing the same idempotency key and payload returns the existing receipt.
- Reusing an idempotency key for a different payload is rejected.

No additional Serial/IMEI lifecycle state has been invented.

## Run the demo

### Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

The demo database is stored under `backend/data/` and is ignored by Git. The demo profile
uses `ddl-auto=update`; test profile uses an isolated in-memory database with `create-drop`.

Seeded data:

| Type | Code | State / quantity |
|---|---|---|
| Warehouse | `WH-HCM-01` | Demo warehouse |
| Product | `TV-55-DEMO` | Smart TV demo |
| Product | `PHONE-DEMO` | Phone demo |
| PurchaseOrder | `PO-DEMO-APPROVED` | APPROVED; 3 units per SKU |
| PurchaseOrder | `PO-DEMO-DRAFT` | DRAFT; 1 TV unit |

### Frontend

```powershell
cd frontend
npm install
npm run dev:inventory
```

Open `http://localhost:5173/inventory.html` for desktop/manual entry.

For mobile camera use:

```powershell
npm run dev:inventory:https
```

Open `https://<PC-LAN-IP>:5173/inventory.html`. A self-signed certificate may still prevent
camera access on some phones. For evidence, prefer an approved trusted HTTPS tunnel forwarding
the regular `npm run dev:inventory` server.

## Mobile flow

1. Load `PO-DEMO-APPROVED`.
2. Select a SKU.
3. Start the camera or enter the Serial/IMEI manually.
4. Verify the displayed string character-for-character, especially leading zeroes.
5. Select GOOD or DEFECTIVE and add the item.
6. Review all rows and create the Goods Receipt.
7. Capture the response and refresh the PO to verify remaining quantity.

The scanner fills the text field only. It never opens scanned URLs and does not submit a
receipt without operator action.

## Handoff to An

Review these files first:

- `docs/inventory-qr/API_EXAMPLES.md`
- `docs/inventory-qr/EVIDENCE_CHECKLIST.md`
- `backend/src/main/java/com/smartelectronicsupermarket/inventory/`
- `frontend/src/features/inventory/`

Do not delete `backend/data/` while the demo server is running. Stop backend and frontend
after collecting evidence.
