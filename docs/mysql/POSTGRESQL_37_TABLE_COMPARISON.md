# Comparison with the PostgreSQL 37-table system design

## Evidence boundary

The referenced file `Thiết kế cơ sở dữ liệu SASMS.docx` is not present in the repository. The repository contains FRS, survey and use-case DOCX files, but none is the PostgreSQL database design. Consequently, a table-by-table or column-by-column comparison against all 37 tables is **NOT VERIFIED**.

## Scope comparison

| Area | PostgreSQL design described by project context | Implemented MySQL TV4 scope |
|---|---|---|
| System coverage | Whole SASMS, reported as 37 tables | Two demo modules, 9 tables |
| Inventory receiving | Part of whole-system design | Implemented: PO, receipt, product unit and warehouse tables |
| POS checkout | Part of whole-system design | Implemented: sale and sale-item tables integrated with ProductUnit |
| Customer, payment gateway, warranty, delivery, ecommerce, AI, QR metadata | Expected in broader system design | Not implemented and not claimed |
| Historical migration | Not established from available source | H2 history not migrated; fresh `sasms_tv4_test` fixture/E2E data only |

## Verified platform differences

| Concern | PostgreSQL-oriented design | Implemented MySQL 8.0 DDL |
|---|---|---|
| Generated identifiers | Commonly `GENERATED ... AS IDENTITY` or sequence | `BIGINT AUTO_INCREMENT` |
| Enum persistence | PostgreSQL enum or constrained text, depending on design | MySQL `ENUM`, matching Java `EnumType.STRING` values |
| Timestamp | Often `TIMESTAMP WITH TIME ZONE` | `DATETIME(6)`; application persists Java `Instant` |
| Storage engine | PostgreSQL native transactional storage | InnoDB |
| Character comparison | Database/column collation dependent | `utf8mb4_0900_as_cs` for case-sensitive business identifiers |
| Money in implemented demo | Source design unavailable | Integer VND using `BIGINT`; no floating-point rounding |
| Identity locking | PostgreSQL row locks | InnoDB row locks used by JPA pessimistic locking |
| Upsert/seed syntax | PostgreSQL commonly uses `ON CONFLICT` | MySQL fixture uses `INSERT IGNORE` on dedicated demo keys |

## What Kiên may safely document

- The MySQL implementation has exactly nine tables for the TV4 Inventory/POS demo.
- It is an implementation subset, not a conversion of all 37 PostgreSQL tables.
- The implemented entity/table mapping, constraints and flows are documented in `SASMS_TV4_MYSQL_SCHEMA.md` and `ERD_9_TABLES.md`.
- No absent module or table may be marked as implemented.

## Required follow-up for a full comparison

Attach the actual PostgreSQL design DOCX or an exported table/column catalog. Only then can the remaining comparison include exact table names, column types, constraints, relationships and migration mappings.
