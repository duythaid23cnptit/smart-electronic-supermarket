# SASMS TV4 MySQL runtime guide

This guide covers only the two implemented TV4 modules:

1. Inventory QR Code and Serial/IMEI receiving.
2. Counter POS checkout with `DEMO_CASH`.

It does not claim that the whole SASMS database design is implemented. The current code maps to nine MySQL tables.

For handover, start with `KIEN_HANDOVER.md`. It links the DDL, Entity–Table mapping, ERD, E2E report, SELECT evidence and PostgreSQL scope comparison.

## Prerequisites

- MySQL Server 8.0 or later.
- JDK 26.
- A dedicated database and account for SASMS.
- The account password supplied at runtime, never committed to Git.

## Create isolated databases

Open the MySQL client as an administrator:

```powershell
mysql.exe -u root -p
```

Then run the scripts with the MySQL client's `source` command (forward slashes avoid Windows path escaping):

```text
source D:/smart-electronic-supermarket/backend/src/main/resources/db/mysql/create-databases.sql;
use sasms_tv4_test;
source D:/smart-electronic-supermarket/backend/src/main/resources/db/mysql/schema.sql;
source D:/smart-electronic-supermarket/backend/src/main/resources/db/mysql/demo-data.sql;
```

Create a least-privilege application account in Workbench or with an administrator-approved statement. Grant it access to only one target database. This repository intentionally does not create users or store passwords.

> **Test-database guard:** `demo-data.sql` currently contains `USE sasms_tv4_test;` and therefore always selects the test database before inserting the fixture. Do not run it when intending to seed `sasms_tv4_demo`. The recorded E2E and Workbench evidence verifies the fixture only in `sasms_tv4_test`; seed state in `sasms_tv4_demo` is **NOT VERIFIED**. Supporting another target would require a separately reviewed script change and a new verification run.

The test fixture is optional, idempotent by business key, and does not overwrite existing rows. It creates fresh test data; it is not an H2 history migration.

## Run the backend on port 8082

Set credentials in the current terminal only:

```powershell
$env:SASMS_MYSQL_URL = 'jdbc:mysql://127.0.0.1:3306/sasms_tv4_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8'
$env:SASMS_MYSQL_USERNAME = '<dedicated-sasms-user>'
$env:SASMS_MYSQL_PASSWORD = '<password>'
$env:SASMS_MYSQL_SERVER_PORT = '8082'
Set-Location backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

The profile uses `ddl-auto=validate`. It does not create or update tables, run SQL initialization, expose the H2 console, or activate the H2-only `demo` initializer/migration.

The profile default URL points to `sasms_tv4_demo`, while this verified procedure explicitly overrides it with `SASMS_MYSQL_URL` for `sasms_tv4_test`. Always confirm the resolved JDBC URL before running the application or any E2E request.

## Run the read-only MySQL schema validation

Use only a dedicated SASMS test database whose schema has already been applied:

```powershell
$env:SASMS_MYSQL_IT = 'true'
$env:SASMS_MYSQL_EXPECTED_DATABASE = 'sasms_tv4_test'
Set-Location backend
.\mvnw.cmd -Dtest=MySqlSchemaValidationTests test
```

This opt-in test verifies the MySQL product, exact database name and nine implemented tables. It performs no inserts, updates, deletes, resets or schema creation.

## Run a frontend against MySQL backend 8082

Use Vite `createServer()` with an inline proxy override, as with the isolated H2 E2E environment. Do not edit `vite.config.js` for a one-off test:

```powershell
Set-Location frontend
node --input-type=module -e "import { createServer } from 'vite'; const server = await createServer({server:{host:'127.0.0.1',port:5175,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:8082',changeOrigin:true}}}}); console.log(server.config.server.proxy); await server.listen(); server.printUrls();"
```

Open `http://127.0.0.1:5175/` for POS and `http://127.0.0.1:5175/inventory.html` for Inventory.

## MySQL Workbench

On this machine Workbench is installed at:

`C:\Program Files\MySQL\MySQL Workbench 8.0\MySQLWorkbench.exe`

Open the existing local server connection or create a dedicated SASMS connection. Select `sasms_tv4_test`, then inspect **Schemas → Tables**. Do not use another project's schema.

## Rollback to H2

Do not activate the `mysql` profile. The existing `demo` and `test` H2 configurations remain unchanged. No H2 database or backup is migrated, overwritten or deleted by these MySQL scripts.
