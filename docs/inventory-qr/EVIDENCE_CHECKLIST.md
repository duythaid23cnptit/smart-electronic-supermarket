# Week 3 Inventory QR Evidence Checklist

Only mark mobile/browser rows PASS after executing them on the target device.

| Evidence | Expected | Current status |
|---|---|---|
| Backend test suite | Success, duplicate, leading zero, unapproved, over-limit, repeat, concurrent | PASS - 8 total Spring tests, 0 failures |
| Frontend unit tests | W1 scan utilities plus inventory exact-string/duplicate utilities | PASS - 5/5 |
| Frontend production build | Includes `inventory.html` | PASS |
| Demo profile startup | H2 file DB and seed data | PASS after correcting unsupported H2 URL option |
| GET approved PO | HTTP 200 with `PO-DEMO-APPROVED` | PASS |
| POST Goods Receipt | HTTP 201; GOOD available and DEFECTIVE unavailable | PASS |
| HTTP idempotent replay | HTTP 200, same receipt, `replayed=true` | PASS |
| Vite HTTPS page and API proxy | `/inventory.html` and approved PO API return HTTP 200 | PASS on temporary port 5174 |
| Phone camera permission over trusted HTTPS | Permission outcome recorded | NOT RUN |
| Phone QR leading-zero scan | Exact string retained | NOT RUN |
| Responsive mobile layout | Screenshot on target phone | NOT RUN |
| Draft PO UI/API evidence | Error screenshot/response | NOT RUN |
| Quantity-over-limit UI/API evidence | Error screenshot/response | NOT RUN |

## Screenshots to collect

- Approved purchase order summary.
- Camera permission prompt and active rear camera.
- Scanned leading-zero Serial/IMEI before adding.
- GOOD and DEFECTIVE rows in one pending receipt.
- Successful receipt result.
- Draft PO rejection.
- Over-approved-quantity rejection.
- Duplicate Serial/IMEI rejection.
- Mobile viewport showing loading and error states.

## Final commands

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd verify

cd ..\frontend
npm test
npm run build

cd ..
git diff --check
git status --short --branch
```
