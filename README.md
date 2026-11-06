# Smart Electronic Supermarket — TV4 delivery workspace

## Current demo scope

The final TV4 demo is intentionally limited to two parts:

1. **Module 1 — Kho QR Code & Serial/IMEI** (`/inventory.html`).
2. **Module 2 — POS bán hàng tại quầy** (`/`).

The Week 2 naming below is retained as historical assignment evidence; it is
not the current module numbering. See `docs/w6-demo-finalization/` for the W6
audit, test evidence, risks, demo guide and handover package.

## Week 2 baseline (historical)

**Role:** TV4 — Fullstack Developer  
**Week 2 task:** Initialize the Git repository and build the React/Spring Boot project skeleton for **Module 1 — POS**.  
**Deliverable:** Source Code Skeleton Module 1.

The following section records the original Week 2 baseline. Later sections
describe the additive QR, inventory and W5 POS demo work. The repository still
does **not** claim that the full supermarket or approved POS business workflow
is complete.

## Scope implemented

- Git repository initialized on branch `main`.
- Java 26 and Spring Boot 4.1.1 backend skeleton.
- Maven Wrapper pinned to Maven 3.9.16.
- React + Vite frontend skeleton.
- POS feature boundary.
- Serial/IMEI feature boundary because it belongs to the described Module 1 domain.
- Minimal REST status endpoints proving FE/BE integration boundaries.
- Axios API layer.
- Documentation and evidence checklist.

## Explicitly not implemented in the Week 2 baseline

- Final POS sales workflow.
- Payment processing.
- Inventory deduction.
- Product/customer database models.
- Serial/IMEI validation rules or lifecycle.
- Authentication/authorization.
- Database persistence.
- AI/QR features.

These require approved requirements and are outside the Week 2 skeleton task.

## Repository structure

```text
.
├── backend/
│   ├── .mvn/wrapper/maven-wrapper.properties
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/smartelectronicsupermarket/
│       │   │   ├── common/
│       │   │   ├── pos/
│       │   │   └── serialimei/
│       │   └── resources/application.properties
│       └── test/java/com/smartelectronicsupermarket/
├── frontend/
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── app/
│       ├── features/
│       │   ├── pos/
│       │   └── serialImei/
│       └── shared/
└── docs/
```

## Backend

Prerequisites:
- Java 26

Validate and run on Windows:

```powershell
cd backend
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
```

On macOS/Linux, use `./mvnw` instead of `.\mvnw.cmd`.

The wrapper downloads and uses Maven 3.9.16, so a system Maven installation is not required.

Endpoints:

- `GET http://localhost:8080/api/health`
- `GET http://localhost:8080/api/pos/status`
- `GET http://localhost:8080/api/serial-imei/status`

## Frontend

Prerequisites:

- Node.js 20+
- npm

Run:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```powershell
npm run build
```

## Validated environment

Validation performed on 2026-09-29:

- Oracle JDK 26.0.2.1: PASS
- Maven Wrapper 3.3.4 using Maven 3.9.16: PASS
- Backend `clean test`: PASS (1 test, 0 failures, 0 errors)
- Backend startup on port 8080: PASS
- All three documented endpoints: PASS (HTTP 200)
- Frontend production build with Node.js 22.23.1 and npm 10.9.8: PASS

See `docs/VALIDATION_REPORT.md` for the recorded responses and remaining checks.

## Git state

The repository already contains the original student commit:

```text
8026553 chore: initialize POS fullstack skeleton
```

The Java 26/Spring Boot 4.1.1 migration, Maven Wrapper, test, documentation updates,
and `frontend/package-lock.json` remain working-tree changes for the student to review.

Review first:

```powershell
git status
git diff --check
git diff
```

## Evidence

See `docs/TV4_WEEK2_REPORT.md` and `docs/EVIDENCE_CHECKLIST.md`.

## QR Scanner PoC (TV4 - W1)

The isolated mobile QR scanner experiment is available at `/qr-poc.html` and does not
change the existing POS or backend APIs.

```powershell
cd frontend
npm run generate:qr-samples
npm run test:qr
npm run dev:qr:https
```

See `docs/qr-poc/README.md` for mobile HTTPS setup, test cases and the rule for recording
only measurements observed on a real phone.

## Inventory QR Receiving Demo (TV4 - Week 3)

Week 3 adds an isolated inventory receiving page and Spring Boot REST API without changing
the existing POS endpoints. Run the backend with the file-based H2 demo profile:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

In another terminal:

```powershell
cd frontend
npm run dev:inventory
```

Open `http://localhost:5173/inventory.html`. For a phone camera test, use
`npm run dev:inventory:https` or a trusted HTTPS tunnel. Demo purchase orders are
`PO-DEMO-APPROVED` and `PO-DEMO-DRAFT`.

See `docs/inventory-qr/README.md` for API, test and handoff details.

## POS checkout demo (TV4 - Week 5)

Week 5 connects the POS page to the real W3/W4 `Product` and `ProductUnit`
records. Only `GOOD` + `AVAILABLE` units can be selected. A successful
`DEMO_CASH` checkout stores the sale and receipt and changes the same unit to
`SOLD` in one database transaction.

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"

# In another terminal
cd frontend
npm run dev
```

Open `http://localhost:5173`. Demo prices live only in
`application-demo.properties`; BA/PM approval is still required before these
values or this simulated payment flow can be used outside the demo.

See `docs/pos-w5/README.md` and `docs/pos-w5/W5_RELEASE_REPORT.md` for the API,
PC demo procedure, actual test evidence and outstanding approvals.
