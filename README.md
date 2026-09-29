# Smart Electronic Supermarket — TV4 Week 2

## Assignment

**Role:** TV4 — Fullstack Developer  
**Week 2 task:** Initialize the Git repository and build the React/Spring Boot project skeleton for **Module 1 — POS**.  
**Deliverable:** Source Code Skeleton Module 1.

This repository intentionally implements only the technical skeleton required for Week 2. It does **not** claim that the POS business workflow is complete.

## Scope implemented

- Git repository initialized on branch `main` (no fabricated commit).
- Spring Boot backend skeleton.
- React + Vite frontend skeleton.
- POS feature boundary.
- Serial/IMEI feature boundary because it belongs to the described Module 1 domain.
- Minimal REST status endpoints proving FE/BE integration boundaries.
- Axios API layer.
- Documentation and evidence checklist.

## Explicitly not implemented

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
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/smartelectronicsupermarket/
│       │   ├── common/
│       │   ├── pos/
│       │   └── serialimei/
│       └── resources/application.properties
├── frontend/
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
- Java 21+
- Maven 3.9+

Run:

```bash
cd backend
mvn spring-boot:run
```

Endpoints:
- `GET http://localhost:8080/api/health`
- `GET http://localhost:8080/api/pos/status`
- `GET http://localhost:8080/api/serial-imei/status`

## Frontend

Prerequisites:
- Node.js 20+
- npm

Run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```bash
npm run build
```

## Git workflow for the student

Review first:

```bash
git status
git diff
```

Then create the real commit using your own Git identity:

```bash
git add .
git commit -m "chore: initialize POS fullstack skeleton"
```

Do not use a fabricated commit hash in the PM evidence.

## Evidence

See `docs/TV4_WEEK2_REPORT.md` and `docs/EVIDENCE_CHECKLIST.md`.
