# TV4 — Week 2 Development Report

## 1. Assignment

- Role: TV4 — Fullstack Developer
- Task: Initialize Git Repository and build React/Spring Boot Source Code Skeleton for Module 1 (POS).
- Deliverable: Source Code Skeleton Module 1.

## 2. Work completed in the skeleton

### Repository
- Initialized a local Git repository.
- Used `main` as the working branch.
- Added `.gitignore` for backend/frontend generated files.
- Verified the existing student commit `8026553 chore: initialize POS fullstack skeleton`.
- No commit was created, amended or rewritten during this update.

### Backend
- Configured Java 26 and Spring Boot 4.1.1.
- Added the official Maven Wrapper 3.3.4 configured for Maven 3.9.16.
- Created Spring Boot application entry point.
- Created `common`, `pos`, and `serialimei` package boundaries.
- Created Controller -> Service structure for POS and Serial/IMEI status endpoints.
- Added a health endpoint.
- Added one application-context startup test.
- Avoided persistence and business rules that were not specified.

### Frontend
- Created React + Vite project skeleton.
- Created feature-oriented boundaries for POS and Serial/IMEI.
- Added shared Axios HTTP client.
- Added basic POS and Serial/IMEI UI skeletons.
- Added calls to backend status endpoints for integration proof.

## 3. Files created

Use `git status --short` as the authoritative list before submission.

## 4. Commands expected for validation

```bash
# Frontend
cd frontend
npm run build

# Backend on Windows (system Maven is not required)
cd ../backend
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
```

## 5. Week 2 Definition of Done

- [x] Repository structure created.
- [x] Backend source skeleton created.
- [x] Frontend source skeleton created.
- [x] POS feature boundary created.
- [x] Serial/IMEI feature boundary created.
- [x] README created.
- [x] Java 26 and Spring Boot 4.1.1 configured.
- [x] Maven Wrapper configured for Maven 3.9.16.
- [x] Backend build and test evidence captured.
- [x] Frontend build evidence captured.
- [x] Backend startup log captured.
- [x] Frontend browser verification completed.
- [x] API response evidence captured.
- [x] Frontend UI-to-backend interaction verified for POS and Serial/IMEI.
- [x] Existing student commit hash recorded.
- [ ] Reviewer/PR evidence recorded if used by the team.

## 6. Not claimed as complete

- POS end-to-end sales workflow.
- Payment.
- Inventory integration.
- Database persistence.
- Serial/IMEI validation/lifecycle.
- Authentication and authorization.
- AI or QR implementation.

## 7. Evidence rule

Only replace unchecked evidence items after the corresponding command/test/review has actually been performed. Do not mark an item complete from assumption.
