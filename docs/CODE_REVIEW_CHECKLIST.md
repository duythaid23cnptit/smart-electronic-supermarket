# TV4 Week 2 — Code Review Checklist

| Review item | Status |
|---|---|
| Repository opens without missing source files | PASS |
| `git status` reviewed and generated folders are not tracked | PASS |
| Frontend production build succeeds | PASS |
| Spring Boot dependencies resolve through the Maven Wrapper | PASS |
| `.\mvnw.cmd clean test` succeeds | PASS |
| Backend starts on port 8080 | PASS |
| `/api/health` responds successfully | PASS |
| `/api/pos/status` responds successfully | PASS |
| `/api/serial-imei/status` responds successfully | PASS |
| Frontend dev server starts on port 5173 | NOT RUN |
| Frontend UI calls POS and Serial/IMEI endpoints | NOT RUN |
| No out-of-scope business rules or modules were introduced | PASS |
| README matches the validated repository state | PASS |
| Existing commit hash is recorded | PASS |
| Reviewer/PR evidence is attached | NOT RUN |

Only `PASS`, `FAIL`, `NOT RUN`, and `BLOCKED` are valid status values.
