# Smart Electronic Supermarket — TV4 Week 2

## Assignment

**Role:** TV4 — Fullstack Developer  
**Week 2 task:** Initialize the Git repository and build the React/Spring Boot project skeleton for **Module 1 — POS**.  
**Deliverable:** Source Code Skeleton Module 1.

This repository intentionally implements only the technical skeleton required for Week 2. It does **not** claim that the POS business workflow is complete.

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
