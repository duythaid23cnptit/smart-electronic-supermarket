# Week 2 Skeleton — Validation Report

## Environment observed during preparation

- Java: OpenJDK 21.0.11
- Node.js: v22.16.0
- npm: 10.9.2
- Git: 2.47.3
- Maven: **NOT AVAILABLE** in the preparation environment

## Checks actually performed

| Check | Result | Evidence / Note |
|---|---|---|
| Git repository initialized | PASS | Repository initialized with branch `main` |
| Git commit created | NOT DONE | Intentionally left for the student to create with real identity |
| Frontend `package.json` syntax | PASS | Parsed successfully with Node.js |
| Frontend dependency install | NOT VERIFIED | `npm install` timed out in the restricted preparation environment |
| Frontend production build | NOT RUN | Dependencies could not be verified after install timeout |
| Backend Maven build | NOT RUN | Maven executable is not installed in the preparation environment |
| Backend runtime | NOT RUN | Requires Maven/dependencies |
| API responses | NOT RUN | Requires backend runtime |

## Required validation on the developer machine

Run these commands and keep the real terminal output as evidence:

```bash
# 1. Frontend
cd frontend
npm install
npm run build
npm run dev

# 2. Backend
cd ../backend
mvn test
mvn spring-boot:run

# 3. API checks after backend starts
curl http://localhost:8080/api/health
curl http://localhost:8080/api/pos/status
curl http://localhost:8080/api/serial-imei/status

# 4. Git evidence
cd ..
git status
git branch --show-current
git add .
git commit -m "chore: initialize POS fullstack skeleton"
git log -1 --oneline
```

Do not change any `NOT RUN`/`NOT VERIFIED` result to PASS until the corresponding command has actually succeeded.
