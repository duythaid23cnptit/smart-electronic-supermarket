# TV4 Week 2 — Evidence Checklist

| Evidence | How to capture | Status |
|---|---|---|
| Repository | `git status` | PASS |
| Branch | `git branch --show-current` | PASS |
| File changes | `git status --short` | PASS |
| Java 26 | `java -version` | PASS |
| Maven Wrapper | `.\mvnw.cmd -version` | PASS |
| Backend build/test | `.\mvnw.cmd clean test` | PASS |
| Backend startup | `.\mvnw.cmd spring-boot:run` terminal output | PASS |
| Health API | `GET /api/health` | PASS |
| POS status API | `GET /api/pos/status` | PASS |
| Serial/IMEI status API | `GET /api/serial-imei/status` | PASS |
| Frontend build | `npm run build` | PASS |
| Frontend UI | Browser verification | PASS |
| FE/BE UI integration | POS and Serial/IMEI status responses displayed in the frontend | PASS |
| Existing commit hash | `git log -1 --oneline` | PASS |
| Review/PR | PR URL / reviewer evidence if applicable | NOT RUN |

**Rule:** Use only `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`. Never record `PASS` without real execution evidence.
