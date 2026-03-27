# Update Logs

> Reverse-chronological log of significant changes to the project setup, tooling, and infrastructure.

---

## 2026-03-28

### Migrated from Docker Desktop to Colima

Replaced Docker Desktop with Colima for lighter resource usage. Same Docker engine, significantly less memory and CPU overhead.

**New commands:**
```bash
# Start Colima (run before docker-compose)
colima start

# Stop Colima
colima stop
```

**Note:** All `docker-compose` commands remain the same:
```bash
docker-compose up -d      # start services
docker-compose down       # stop services
```

**Setup fix:** Removed `docker-credential-desktop` reference from `~/.docker/config.json` (set `"credsStore": ""`). This is required after uninstalling Docker Desktop.

---

### Added separate test database (`runhop_test`)

E2e tests now run against an isolated `runhop_test` database instead of the dev database. The test database is automatically wiped and re-migrated before every test run.

**New files:**
- `.env.test` — environment config pointing to `runhop_test`
- `test/e2e-setup.ts` — Jest global setup that loads `.env.test` and runs `prisma migrate reset --force`

**Updated files:**
- `test/jest-e2e.json` — added `globalSetup` pointing to `e2e-setup.ts`, fixed `testRegex` to match test files in subdirectories (`test/e2e/`)

**One-time setup** (create the test database):
```bash
psql -U runhop -d postgres -c "CREATE DATABASE runhop_test;"
```

**Running e2e tests:**
```bash
npm run test:e2e
```

This automatically:
1. Loads `.env.test` (uses `runhop_test` database)
2. Runs `prisma migrate reset --force` (clean slate)
3. Runs all `*.e2e-spec.ts` files

---

### Fixed absolute imports to relative paths

Changed all `src/` absolute imports to relative `../` paths across 11 source files. VS Code setting `"typescript.preferences.importModuleSpecifier": "relative"` added to prevent this from recurring.

**Files updated:**
- `src/domain/identity/user/user.controller.ts`
- `src/domain/identity/auth/auth.controller.ts`
- `src/domain/identity/auth/auth.service.ts`
- `src/domain/identity/auth/strategies/jwt.strategy.ts`
- `src/domain/organization/organization/organization.service.ts`
- `src/domain/organization/organization/organization.controller.ts`
- `src/domain/organization/organization/organization.service.spec.ts`
- `src/domain/organization/org-membership/org-membership.service.ts`
- `src/domain/organization/org-membership/org-membership.controller.ts`
- `src/domain/organization/org-membership/org-membership.module.ts`
- `src/domain/organization/org-membership/org-membership.service.spec.ts`
