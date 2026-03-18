# RunHop Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RunHop Phase 1 MVP — auth, users, organizations, events, races, registration, and follows as a NestJS modular monolith.

**Architecture:** Domain-Driven Modules with Shared Kernel. Four bounded contexts (Identity, Organization, Event, Social) with one-way dependencies. Cross-context communication via exported services only. Infrastructure layer (Prisma, Redis, config) shared globally.

**Tech Stack:** NestJS 10, TypeScript (strict), Prisma, PostgreSQL 16, Redis 7 (ioredis), Docker Compose, Jest, class-validator, @nestjs/passport (JWT)

**Spec:** `docs/superpowers/specs/2026-03-18-runhop-system-architecture-design.md`

---

## File Map

### Root Config Files
- Create: `package.json` — NestJS dependencies
- Create: `tsconfig.json` — strict TypeScript config
- Create: `tsconfig.build.json` — build-specific config
- Create: `nest-cli.json` — NestJS CLI config
- Create: `.env.example` — env template
- Create: `.env` — local env (gitignored)
- Create: `.gitignore`
- Create: `.eslintrc.js` — ESLint config
- Create: `.prettierrc` — Prettier config
- Create: `docker/docker-compose.yml` — Postgres + Redis (dev)
- Create: `docker/docker-compose.test.yml` — Postgres + Redis (test, isolated ports/db)

### Infrastructure Layer
- Create: `src/infrastructure/database/prisma.service.ts`
- Create: `src/infrastructure/database/database.module.ts`
- Create: `src/infrastructure/redis/redis.service.ts`
- Create: `src/infrastructure/redis/redis.module.ts`
- Create: `src/infrastructure/config/config.module.ts`
- Create: `src/infrastructure/config/env.validation.ts`

### Prisma Schema
- Create: `prisma/schema.prisma` — all Phase 1 models
- Create: `prisma/seed.ts` — seed SUPER_ADMIN user

### Shared Kernel
- Create: `src/shared/types/enums.ts`
- Create: `src/shared/types/interfaces.ts`
- Create: `src/shared/guards/jwt-auth.guard.ts`
- Create: `src/shared/guards/roles.guard.ts`
- Create: `src/shared/decorators/current-user.decorator.ts`
- Create: `src/shared/decorators/roles.decorator.ts`
- Create: `src/shared/decorators/public.decorator.ts`
- Create: `src/shared/filters/http-exception.filter.ts`
- Create: `src/shared/interceptors/transform.interceptor.ts`
- Create: `src/shared/interceptors/logging.interceptor.ts`
- Create: `src/shared/dto/pagination-query.dto.ts`
- Create: `src/shared/shared.module.ts`
- Test: `src/shared/guards/jwt-auth.guard.spec.ts`
- Test: `src/shared/guards/roles.guard.spec.ts`
- Test: `src/shared/interceptors/transform.interceptor.spec.ts`

### Identity Context
- Create: `src/domain/identity/auth/auth.module.ts`
- Create: `src/domain/identity/auth/auth.controller.ts`
- Create: `src/domain/identity/auth/auth.service.ts`
- Create: `src/domain/identity/auth/strategies/jwt.strategy.ts`
- Create: `src/domain/identity/auth/dto/register.dto.ts`
- Create: `src/domain/identity/auth/dto/login.dto.ts`
- Create: `src/domain/identity/auth/dto/refresh-token.dto.ts`
- Create: `src/domain/identity/user/user.module.ts`
- Create: `src/domain/identity/user/user.controller.ts`
- Create: `src/domain/identity/user/user.service.ts`
- Create: `src/domain/identity/user/dto/update-user.dto.ts`
- Create: `src/domain/identity/identity.module.ts`

### Organization Context
- Create: `src/domain/organization/organization/organization.module.ts`
- Create: `src/domain/organization/organization/organization.controller.ts`
- Create: `src/domain/organization/organization/organization.service.ts`
- Create: `src/domain/organization/organization/dto/create-organization.dto.ts`
- Create: `src/domain/organization/organization/dto/update-organization.dto.ts`
- Create: `src/domain/organization/org-membership/org-membership.module.ts`
- Create: `src/domain/organization/org-membership/org-membership.controller.ts`
- Create: `src/domain/organization/org-membership/org-membership.service.ts`
- Create: `src/domain/organization/org-membership/dto/add-member.dto.ts`
- Create: `src/domain/organization/org-membership/dto/update-role.dto.ts`
- Create: `src/domain/organization/organization-context.module.ts`

### Event Context
- Create: `src/domain/event/event/event.module.ts`
- Create: `src/domain/event/event/event.controller.ts`
- Create: `src/domain/event/event/event.service.ts`
- Create: `src/domain/event/event/dto/create-event.dto.ts`
- Create: `src/domain/event/event/dto/update-event.dto.ts`
- Create: `src/domain/event/event/dto/update-event-status.dto.ts`
- Create: `src/domain/event/race/race.module.ts`
- Create: `src/domain/event/race/race.controller.ts`
- Create: `src/domain/event/race/race.service.ts`
- Create: `src/domain/event/race/dto/create-race.dto.ts`
- Create: `src/domain/event/race/dto/update-race.dto.ts`
- Create: `src/domain/event/registration/registration.module.ts`
- Create: `src/domain/event/registration/registration.controller.ts`
- Create: `src/domain/event/registration/registration.service.ts`
- Create: `src/domain/event/registration/dto/create-registration.dto.ts`
- Create: `src/domain/event/event-context.module.ts`

### Social Context
- Create: `src/domain/social/follow/follow.module.ts`
- Create: `src/domain/social/follow/follow.controller.ts`
- Create: `src/domain/social/follow/follow.service.ts`
- Create: `src/domain/social/follow/dto/create-follow.dto.ts`
- Create: `src/domain/social/social-context.module.ts`

### App Root
- Create: `src/app.module.ts`
- Create: `src/main.ts`

### E2E Tests
- Create: `test/e2e/auth.e2e-spec.ts`
- Create: `test/e2e/user.e2e-spec.ts`
- Create: `test/e2e/organization.e2e-spec.ts`
- Create: `test/e2e/org-membership.e2e-spec.ts`
- Create: `test/e2e/event.e2e-spec.ts`
- Create: `test/e2e/race.e2e-spec.ts`
- Create: `test/e2e/registration.e2e-spec.ts`
- Create: `test/e2e/follow.e2e-spec.ts`

---

## Task 1: Project Scaffolding & Docker

**Goal:** Get a NestJS app running with `npm run start:dev` that returns "hello" on `GET /api/v1/health`. Postgres and Redis running in Docker.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`
- Create: `.env.example`, `.env`, `.gitignore`, `.eslintrc.js`, `.prettierrc`
- Create: `docker/docker-compose.yml`
- Create: `src/main.ts`, `src/app.module.ts`

**Steps:**

- [ ] **Step 1: Scaffold NestJS project**

Run: `npx @nestjs/cli new runhop --strict --skip-git --package-manager npm`

This generates the base NestJS project. We use `--strict` for strict TypeScript and `--skip-git` since we already have a git repo.

- [ ] **Step 2: Move scaffolded files into project root**

The CLI creates a `runhop/` subdirectory. Move everything from `runhop/` into the project root. Delete the empty `runhop/` directory.

- [ ] **Step 3: Install Phase 1 dependencies**

```bash
npm install @nestjs/config @nestjs/passport passport passport-jwt @nestjs/throttler
npm install @prisma/client ioredis class-validator class-transformer helmet uuid
npm install -D prisma @types/passport-jwt @types/uuid
```

- [ ] **Step 4: Create Docker Compose file**

Create `docker/docker-compose.yml` with:
- `postgres:16-alpine` on port 5432 (user: `runhop`, password: `runhop`, db: `runhop`)
- `redis:7-alpine` on port 6379
- Named volume `pgdata` for Postgres persistence

- [ ] **Step 5: Create `.env.example` and `.env`**

```env
# Database
DATABASE_URL=postgresql://runhop:runhop@localhost:5432/runhop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# App
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# CORS
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 6: Update `.gitignore`**

Add `.env` (but NOT `.env.example`) and `node_modules/` and `dist/`.

- [ ] **Step 7: Update `main.ts` with global prefix**

Set global prefix to `api/v1`. Add `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true`. Add `helmet()`. Enable CORS with origin from env.

- [ ] **Step 8: Start Docker and verify the app boots**

```bash
cd docker && docker compose up -d && cd ..
npm run start:dev
```

Visit `http://localhost:3000/api/v1` — should see NestJS default response.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold NestJS project with Docker (Postgres + Redis)"
```

---

## Task 2: Prisma Schema & Infrastructure Layer

**Goal:** Define all Phase 1 database models, run migrations, set up PrismaService and RedisService as global modules, and validate env config at boot.

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/infrastructure/database/prisma.service.ts`
- Create: `src/infrastructure/database/database.module.ts`
- Create: `src/infrastructure/redis/redis.service.ts`
- Create: `src/infrastructure/redis/redis.module.ts`
- Create: `src/infrastructure/config/config.module.ts`
- Create: `src/infrastructure/config/env.validation.ts`

**Steps:**

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with `DATABASE_URL`.

- [ ] **Step 2: Write the full Prisma schema**

Define all Phase 1 models in `prisma/schema.prisma`:

**Models to create:**
- `User` — with fields from spec (id as UUID, email unique, password, displayName, avatar, bio, role enum `USER`/`SUPER_ADMIN`, deletedAt nullable, timestamps). Use `@default(uuid())` for id.
- `Organization` — UUID id, name, slug unique, description, logo, banner, deletedAt nullable, timestamps.
- `OrgMembership` — UUID id, userId/orgId FKs with `onDelete: Cascade`, role enum `OWNER`/`ADMIN`/`MEMBER`, joinedAt. Unique constraint on `@@unique([userId, orgId])`.
- `Event` — UUID id, orgId FK, name, slug unique, description, location, bannerImage, startDate/endDate as DateTime, status enum `DRAFT`/`PUBLISHED`/`CLOSED`/`COMPLETED` default `DRAFT`, timestamps.
- `Race` — UUID id, eventId FK, name, distance as Float, unit (String), maxParticipants Int, price Int (cents), currency String default `PHP`, timestamps.
- `Registration` — UUID id, userId FK, raceId FK, status enum `PENDING`/`CONFIRMED`/`CANCELLED` default `PENDING`, registeredAt. Unique `@@unique([userId, raceId])`.
- `Follow` — UUID id, followerId FK to User, targetId String, targetType enum `USER`/`ORGANIZATION`/`EVENT`, createdAt. Unique `@@unique([followerId, targetId, targetType])`.

**Indexes to add** (per spec Database Indexes section):
- `OrgMembership`: `@@index([userId])`, `@@index([orgId, role])`
- `Event`: `@@index([orgId, status])`, `@@index([status, startDate])`
- `Race`: `@@index([eventId])`
- `Registration`: `@@index([raceId, status])`, `@@index([userId])`
- `Follow`: `@@index([followerId])`, `@@index([targetType, targetId])`

Reference: spec lines 469-483 for the full index table.

- [ ] **Step 3: Run the first migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration succeeds, tables created in Postgres.

- [ ] **Step 4: Create `PrismaService`**

Create `src/infrastructure/database/prisma.service.ts`:
- Extend `PrismaClient`
- Implement `OnModuleInit` (call `this.$connect()`)
- Implement `OnModuleDestroy` (call `this.$disconnect()`)

Create `src/infrastructure/database/database.module.ts`:
- Global module (`@Global()`)
- Provides and exports `PrismaService`

- [ ] **Step 5: Create `RedisService`**

Create `src/infrastructure/redis/redis.service.ts`:
- Injectable service wrapping `ioredis`
- Constructor takes host/port from config
- Expose methods: `get`, `set`, `del`, `setex` (set with expiry)
- Implement `OnModuleDestroy` to disconnect

Create `src/infrastructure/redis/redis.module.ts`:
- Global module
- Provides and exports `RedisService`

- [ ] **Step 6: Create config module with env validation**

Create `src/infrastructure/config/env.validation.ts`:
- Use `class-validator` + `class-transformer` to define an `EnvironmentVariables` class
- Validate: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- Export a `validate` function that `@nestjs/config` calls at startup

Create `src/infrastructure/config/config.module.ts`:
- Wraps `ConfigModule.forRoot()` with `validate` function and `isGlobal: true`

- [ ] **Step 7: Create `prisma/seed.ts`**

Create a seed script that:
- Creates a SUPER_ADMIN user with a hashed bcrypt password
- Uses `prisma.user.upsert()` (idempotent — safe to run multiple times)
- Email: `admin@runhop.com`, password: `admin123456` (dev only)
- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `package.json`

Run: `npx prisma db seed`
Expected: SUPER_ADMIN user created.

- [ ] **Step 8: Wire infrastructure into AppModule**

Update `src/app.module.ts` to import `AppConfigModule`, `DatabaseModule`, `RedisModule`.

- [ ] **Step 9: Verify everything boots**

```bash
npm run start:dev
```

Expected: App starts, connects to Postgres and Redis, no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema, infrastructure layer (database, redis, config)"
```

---

## Task 3: Shared Kernel (Guards, Decorators, Filters, Interceptors)

**Goal:** Build the shared toolbox that every domain module uses — JWT auth guard, roles guard, decorators, exception filter, response transform interceptor, shared enums, and pagination DTO.

**Files:**
- Create: `src/shared/types/enums.ts`
- Create: `src/shared/types/interfaces.ts`
- Create: `src/shared/guards/jwt-auth.guard.ts`
- Create: `src/shared/guards/roles.guard.ts`
- Create: `src/shared/decorators/current-user.decorator.ts`
- Create: `src/shared/decorators/roles.decorator.ts`
- Create: `src/shared/decorators/public.decorator.ts`
- Create: `src/shared/filters/http-exception.filter.ts`
- Create: `src/shared/interceptors/transform.interceptor.ts`
- Create: `src/shared/dto/pagination-query.dto.ts`
- Create: `src/shared/shared.module.ts`

**Steps:**

- [ ] **Step 1: Create shared enums**

Create `src/shared/types/enums.ts` with all enums used across contexts:
- `SystemRole` — `USER`, `SUPER_ADMIN` (mirrors Prisma's `Role` enum)
- `OrgRole` — `OWNER`, `ADMIN`, `MEMBER`
- `EventStatus` — `DRAFT`, `PUBLISHED`, `CLOSED`, `COMPLETED`
- `RegistrationStatus` — `PENDING`, `CONFIRMED`, `CANCELLED`
- `FollowTargetType` — `USER`, `ORGANIZATION`, `EVENT`

Note: These are TypeScript enums that mirror the Prisma enums. They're used in DTOs and guards where you don't want to import from `@prisma/client` directly.

- [ ] **Step 2: Create shared interfaces**

Create `src/shared/types/interfaces.ts`:
- `JwtPayload` — `{ sub: string; role: SystemRole; jti: string }`
- `AuthenticatedUser` — `{ userId: string; role: SystemRole }`
- `PaginatedResponse<T>` — `{ data: T[]; meta: { cursor: string | null; hasMore: boolean; limit: number } }`

- [ ] **Step 3: Create `@Public()` decorator**

Create `src/shared/decorators/public.decorator.ts`:
- Uses `SetMetadata('isPublic', true)`
- Marks endpoints that don't require JWT auth

- [ ] **Step 4: Create `@Roles()` decorator**

Create `src/shared/decorators/roles.decorator.ts`:
- Uses `SetMetadata('roles', roles)`
- Accepts array of `SystemRole` values

- [ ] **Step 5: Create `@CurrentUser()` decorator**

Create `src/shared/decorators/current-user.decorator.ts`:
- Custom param decorator using `createParamDecorator`
- Extracts `user` from the request object (set by Passport JWT strategy)
- Returns `AuthenticatedUser` — `{ userId: request.user.sub, role: request.user.role }`

- [ ] **Step 6: Create `JwtAuthGuard`**

Create `src/shared/guards/jwt-auth.guard.ts`:
- Extends `AuthGuard('jwt')`
- Override `canActivate`: check for `@Public()` metadata first — if public, return true without checking JWT
- This will be applied globally so every route requires auth unless marked `@Public()`

- [ ] **Step 7: Create `RolesGuard`**

Create `src/shared/guards/roles.guard.ts`:
- Implements `CanActivate`
- Reads `roles` metadata from `@Roles()` decorator
- If no roles set, allow (guard is only active when `@Roles()` is present)
- Compares `request.user.role` against required roles
- If user is `SUPER_ADMIN`, always allow

Note: This guard handles system-level roles only. Org-level permission checks happen in the service layer via `OrgMembershipService.verifyRole()`.

- [ ] **Step 8: Create `HttpExceptionFilter`**

Create `src/shared/filters/http-exception.filter.ts`:
- Catches all `HttpException` instances
- Returns consistent shape: `{ statusCode, message, error, timestamp, path }`
- In production (`NODE_ENV=production`), strip stack traces

- [ ] **Step 9: Create `TransformInterceptor`**

Create `src/shared/interceptors/transform.interceptor.ts`:
- Wraps all successful responses in `{ data: <response> }`
- If the response already has `data` and `meta` properties (pagination), pass through as-is
- This gives every endpoint a consistent response envelope

- [ ] **Step 10: Create `PaginationQueryDto`**

Create `src/shared/dto/pagination-query.dto.ts`:
- `cursor` — optional string
- `limit` — optional number, `@Min(1)`, `@Max(100)`, default 20
- This DTO is reused by every list endpoint

- [ ] **Step 11: Create `LoggingInterceptor`**

Create `src/shared/interceptors/logging.interceptor.ts`:
- Logs every request: method, path, status code, response time (ms), userId (if authenticated)
- Uses NestJS `Logger`
- No sensitive data in logs (no request bodies, no tokens)

- [ ] **Step 12: Configure rate limiting**

Configure `ThrottlerModule` in `app.module.ts`:
- Import `ThrottlerModule.forRoot()` with default limit: 100 requests/minute
- Use `ThrottlerGuard` as a global `APP_GUARD`
- For login/register endpoints, override with stricter limits using `@Throttle()` decorator:
  - Login: `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 per minute)
  - Register: `@Throttle({ default: { limit: 3, ttl: 3600000 } })` (3 per hour)

Note: Redis-backed throttler store (`@nestjs/throttler` supports custom storage) — configure with `ThrottlerStorageRedisService` or use the default in-memory store for Phase 1 and swap to Redis in Phase 4 when BullMQ arrives.

- [ ] **Step 13: Create `SharedModule`**

Create `src/shared/shared.module.ts`:
- Global module
- Provides `JwtAuthGuard` as `APP_GUARD` (applied globally)
- Provides `RolesGuard` as `APP_GUARD`
- Provides `HttpExceptionFilter` as `APP_FILTER`
- Provides `TransformInterceptor` as `APP_INTERCEPTOR`
- Provides `LoggingInterceptor` as `APP_INTERCEPTOR`

- [ ] **Step 14: Write unit tests for shared kernel**

Create `src/shared/guards/jwt-auth.guard.spec.ts`:
- Test: returns `true` for routes marked `@Public()`
- Test: calls parent `canActivate` for non-public routes

Create `src/shared/guards/roles.guard.spec.ts`:
- Test: allows when no `@Roles()` decorator is present (no role required)
- Test: allows when user role matches required role
- Test: denies when user role doesn't match
- Test: SUPER_ADMIN always passes regardless of required role

Create `src/shared/interceptors/transform.interceptor.spec.ts`:
- Test: wraps plain response in `{ data: response }`
- Test: passes through responses that already have `data` and `meta` (pagination)

Run: `npx jest src/shared/`
Expected: PASS

- [ ] **Step 15: Wire SharedModule into AppModule**

Import `SharedModule` in `app.module.ts`.

- [ ] **Step 16: Verify app still boots** (JWT guard will reject requests — that's expected since the JWT strategy is not registered until Task 5. The app boots but all non-public routes return 401. This is correct intermediate state.)

```bash
npm run start:dev
```

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat: add shared kernel (guards, decorators, filters, interceptors, rate limiting, types)"
```

---

## Task 4: Identity Context — User Module

**Goal:** Create the User module with `UserService` (CRUD + exists check) and `UserController` (GET/PATCH profile endpoints). No auth yet — we build the user layer first so auth can depend on it.

**Files:**
- Create: `src/domain/identity/user/user.service.ts`
- Create: `src/domain/identity/user/user.module.ts`
- Create: `src/domain/identity/user/user.controller.ts`
- Create: `src/domain/identity/user/dto/update-user.dto.ts`
- Test: `src/domain/identity/user/user.service.spec.ts`

**Steps:**

- [ ] **Step 1: Write `UserService` unit test (failing)**

Create `src/domain/identity/user/user.service.spec.ts`:
- Mock `PrismaService`
- Test: `create()` — creates a user with hashed password, returns user without password
- Test: `findByEmail()` — returns user or null
- Test: `findById()` — returns user without password, throws `NotFoundException` if not found
- Test: `exists()` — returns boolean
- Test: `update()` — updates user fields, returns updated user without password
- Test: soft-deleted users are excluded from `findById` (where `deletedAt: null`)

Run: `npx jest src/domain/identity/user/user.service.spec.ts`
Expected: FAIL (service doesn't exist yet)

- [ ] **Step 2: Implement `UserService`**

Create `src/domain/identity/user/user.service.ts`:
- Inject `PrismaService`
- `create(data: { email, password, displayName })` — hash password with bcrypt (cost 12), create user, return without password field
- `findByEmail(email: string)` — find user where deletedAt is null (includes password — used by auth only)
- `findById(id: string)` — find user where deletedAt is null, exclude password. Throw `NotFoundException` if not found.
- `exists(id: string)` — returns boolean, used by social context for follow validation
- `update(id: string, data: UpdateUserDto)` — partial update, return without password
- Private helper `excludePassword(user)` to strip password from return values

Install bcrypt: `npm install bcrypt && npm install -D @types/bcrypt`

Run: `npx jest src/domain/identity/user/user.service.spec.ts`
Expected: PASS

- [ ] **Step 3: Create `UpdateUserDto`**

Create `src/domain/identity/user/dto/update-user.dto.ts`:
- `displayName` — optional, `@IsString()`, `@MinLength(2)`, `@MaxLength(50)`
- `bio` — optional, `@IsString()`, `@MaxLength(500)`
- `avatar` — optional, `@IsUrl()`

- [ ] **Step 4: Create `UserController`**

Create `src/domain/identity/user/user.controller.ts`:
- `GET /users/me` — `@CurrentUser()` to get userId, call `userService.findById()`
- `PATCH /users/me` — `@CurrentUser()` + `@Body() UpdateUserDto`, call `userService.update()`
- `GET /users/:id` — call `userService.findById(id)`
- All endpoints require auth (default, since JwtAuthGuard is global)

- [ ] **Step 5: Create `UserModule`**

Create `src/domain/identity/user/user.module.ts`:
- Provides `UserService`
- Exports `UserService` (other contexts need it)
- Registers `UserController`

- [ ] **Step 6: Run tests**

```bash
npx jest src/domain/identity/user/
```

Expected: All unit tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add User module (service, controller, DTO, tests)"
```

---

## Task 5: Identity Context — Auth Module

**Goal:** Full auth flow: register, login (returns JWT + refresh token), refresh, logout (token blacklisting). JWT strategy wired up. This unblocks every other module.

**Files:**
- Create: `src/domain/identity/auth/auth.service.ts`
- Create: `src/domain/identity/auth/auth.module.ts`
- Create: `src/domain/identity/auth/auth.controller.ts`
- Create: `src/domain/identity/auth/strategies/jwt.strategy.ts`
- Create: `src/domain/identity/auth/dto/register.dto.ts`
- Create: `src/domain/identity/auth/dto/login.dto.ts`
- Create: `src/domain/identity/auth/dto/refresh-token.dto.ts`
- Create: `src/domain/identity/identity.module.ts`
- Test: `src/domain/identity/auth/auth.service.spec.ts`
- Test: `test/e2e/auth.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `AuthService` unit test (failing)**

Create `src/domain/identity/auth/auth.service.spec.ts`:
- Mock `UserService`, `JwtService`, `RedisService`, `ConfigService`
- Test: `register()` — calls `userService.create()`, generates tokens, stores refresh token in Redis
- Test: `register()` — throws `ConflictException` if email already exists
- Test: `login()` — validates password with bcrypt, returns tokens
- Test: `login()` — throws `UnauthorizedException` for wrong password
- Test: `login()` — throws `UnauthorizedException` for non-existent email
- Test: `refresh()` — validates refresh token from Redis, issues new token pair, rotates refresh token
- Test: `refresh()` — throws `UnauthorizedException` for invalid/expired refresh token
- Test: `logout()` — blacklists access token jti in Redis, deletes refresh token

Run: `npx jest src/domain/identity/auth/auth.service.spec.ts`
Expected: FAIL

- [ ] **Step 2: Create auth DTOs**

`register.dto.ts`:
- `email` — `@IsEmail()`
- `password` — `@IsString()`, `@MinLength(8)`, `@MaxLength(72)` (bcrypt limit)
- `displayName` — `@IsString()`, `@MinLength(2)`, `@MaxLength(50)`

`login.dto.ts`:
- `email` — `@IsEmail()`
- `password` — `@IsString()`

`refresh-token.dto.ts`:
- `refreshToken` — `@IsString()`, `@IsUUID()`

- [ ] **Step 3: Implement `AuthService`**

Create `src/domain/identity/auth/auth.service.ts`:
- Inject `UserService`, `JwtService`, `RedisService`, `ConfigService`
- `register(dto)`:
  - Check if email exists via `userService.findByEmail()`. If yes, throw `ConflictException`.
  - Create user via `userService.create()`
  - Generate access token (JWT with `{ sub: userId, role, jti: uuid() }`) and refresh token (uuid)
  - Store refresh token in Redis: key `auth:refresh:<userId>:<tokenId>`, TTL 7 days
  - Return `{ accessToken, refreshToken, user }`
- `login(dto)`:
  - Find user by email. If not found, throw `UnauthorizedException`.
  - Compare password with bcrypt. If wrong, throw `UnauthorizedException`.
  - Generate tokens (same as register)
  - Return `{ accessToken, refreshToken, user }`
- `refresh(dto)`:
  - The refresh token encodes the lookup info: store refresh tokens at key `auth:refresh:<userId>:<tokenId>` and return `<userId>:<tokenId>` as the refresh token to the client (or base64 encode it). On refresh, decode the token to get userId + tokenId, look up the exact Redis key. **Never use KEYS or SCAN** — this is an O(N) operation that doesn't scale.
  - Validate the stored token matches
  - Delete old refresh token, generate new token pair (rotation)
  - Store new refresh token in Redis
  - Return `{ accessToken, refreshToken }`
- `logout(jti, userId)`:
  - Set `auth:blacklist:<jti>` in Redis with TTL = remaining access token life
  - Delete all refresh tokens for this user (or just the current session)

Run: `npx jest src/domain/identity/auth/auth.service.spec.ts`
Expected: PASS

- [ ] **Step 4: Create JWT Strategy**

Create `src/domain/identity/auth/strategies/jwt.strategy.ts`:
- Extends `PassportStrategy(Strategy)`
- Extract JWT from `Authorization: Bearer <token>` header
- `validate(payload)`:
  - Check if `payload.jti` is blacklisted in Redis. If yes, throw `UnauthorizedException`.
  - Return `{ sub: payload.sub, role: payload.role, jti: payload.jti }`

- [ ] **Step 5: Create `AuthController`**

Create `src/domain/identity/auth/auth.controller.ts`:
- `POST /auth/register` — `@Public()`, call `authService.register(dto)`
- `POST /auth/login` — `@Public()`, call `authService.login(dto)`
- `POST /auth/refresh` — `@Public()`, call `authService.refresh(dto)`
- `POST /auth/logout` — requires auth, extract `jti` from `@CurrentUser()`, call `authService.logout()`

- [ ] **Step 6: Create `AuthModule`**

Create `src/domain/identity/auth/auth.module.ts`:
- Imports: `JwtModule.registerAsync()` (get secret and expiry from config), `PassportModule`, `UserModule`
- Providers: `AuthService`, `JwtStrategy`
- Controllers: `AuthController`

- [ ] **Step 7: Create `IdentityModule` (barrel)**

Create `src/domain/identity/identity.module.ts`:
- Imports: `AuthModule`, `UserModule`
- Exports: `UserModule` (AuthModule stays internal)

- [ ] **Step 8: Wire IdentityModule into AppModule**

Import `IdentityModule` in `app.module.ts`.

- [ ] **Step 9: Manual smoke test**

```bash
npm run start:dev

# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Use the returned accessToken to hit a protected route
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"
```

Expected: Register returns user + tokens. Login returns tokens. /users/me returns user profile.

- [ ] **Step 10: Write E2E test for auth flow**

Create `test/e2e/auth.e2e-spec.ts`:
- Test full register → login → refresh → access protected route → logout → verify token rejected flow
- Use `@nestjs/testing` to create the app, `supertest` for HTTP calls
- Tests run against real Postgres + Redis (Docker must be running)

Run: `npx jest test/e2e/auth.e2e-spec.ts`
Expected: PASS

- [ ] **Step 11: Write E2E test for user endpoints**

Create `test/e2e/user.e2e-spec.ts`:
- Register a user, login, get access token
- `GET /users/me` — returns current user profile
- `PATCH /users/me` — update displayName and bio, verify changes
- `PATCH /users/me` — reject invalid data (empty displayName, too-long bio)
- `GET /users/:id` — view another user's public profile
- `GET /users/:id` — 404 for non-existent user
- All endpoints return 401 without auth token

Run: `npx jest test/e2e/user.e2e-spec.ts`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add Auth module (register, login, refresh, logout, JWT strategy, e2e tests)"
```

---

## Task 6: Organization Context — Organization Module

**Goal:** CRUD for organizations. Only authenticated users can create orgs (creator auto-becomes OWNER). Update/delete requires org-level permissions (checked in service layer via OrgMembershipService, which we build in the next task — for now, stub the permission check or build org + membership together).

**Note:** Organization and OrgMembership are tightly coupled (creating an org also creates the OWNER membership). Build both in this task.

**Files:**
- Create: `src/domain/organization/organization/organization.service.ts`
- Create: `src/domain/organization/organization/organization.module.ts`
- Create: `src/domain/organization/organization/organization.controller.ts`
- Create: `src/domain/organization/organization/dto/create-organization.dto.ts`
- Create: `src/domain/organization/organization/dto/update-organization.dto.ts`
- Create: `src/domain/organization/org-membership/org-membership.service.ts`
- Create: `src/domain/organization/org-membership/org-membership.module.ts`
- Create: `src/domain/organization/org-membership/org-membership.controller.ts`
- Create: `src/domain/organization/org-membership/dto/add-member.dto.ts`
- Create: `src/domain/organization/org-membership/dto/update-role.dto.ts`
- Create: `src/domain/organization/organization-context.module.ts`
- Test: `src/domain/organization/organization/organization.service.spec.ts`
- Test: `src/domain/organization/org-membership/org-membership.service.spec.ts`
- Test: `test/e2e/organization.e2e-spec.ts`
- Test: `test/e2e/org-membership.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `OrgMembershipService` unit test (failing)**

Tests:
- `verifyRole(userId, orgId, minRole)` — returns membership if role >= minRole, throws `ForbiddenException` if not
- `verifyRole` — role hierarchy: OWNER > ADMIN > MEMBER
- `addMember(orgId, userId, role)` — creates membership, throws `ConflictException` if already a member
- `removeMember(orgId, userId)` — deletes membership, throws `ForbiddenException` if trying to remove OWNER
- `updateRole(orgId, userId, newRole)` — updates role, only OWNER can do this
- `listMembers(orgId)` — returns all members with user info
- `findByUserAndOrg(userId, orgId)` — returns membership or null

- [ ] **Step 2: Implement `OrgMembershipService`**

Key logic:
- `verifyRole()` is the critical method — used by every org-scoped action across all contexts
- Role hierarchy check: define `ROLE_HIERARCHY = { OWNER: 3, ADMIN: 2, MEMBER: 1 }` and compare numerically
- `addMember()` uses Prisma's `create` with unique constraint handling
- All queries filter for non-deleted orgs

Run unit tests. Expected: PASS.

- [ ] **Step 3: Create membership DTOs**

`add-member.dto.ts`:
- `userId` — `@IsUUID()`
- `role` — `@IsEnum(OrgRole)`, default `MEMBER`

`update-role.dto.ts`:
- `role` — `@IsEnum(OrgRole)`

- [ ] **Step 4: Create `OrgMembershipModule`**

Provides and exports `OrgMembershipService`. Registers `OrgMembershipController`.

- [ ] **Step 5: Write `OrganizationService` unit test (failing)**

Tests:
- `create(userId, dto)` — creates org + OWNER membership in a Prisma transaction
- `create()` — generates slug from name (lowercase, hyphenated)
- `create()` — throws `ConflictException` if slug already exists
- `findBySlug(slug)` — returns org or throws `NotFoundException`
- `findById(id)` — returns org, filters soft-deleted
- `exists(id)` — returns boolean (used by social context)
- `update(id, dto)` — updates org fields
- `delete(id)` — sets `deletedAt` (soft delete)
- `list(pagination)` — cursor-based pagination

- [ ] **Step 6: Implement `OrganizationService`**

Key logic:
- `create()` uses `prisma.$transaction()` to atomically create the org AND the OWNER membership
- Slug generation: `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`
- `delete()` soft deletes: sets `deletedAt = new Date()`
- All find queries include `where: { deletedAt: null }`
- `list()` implements cursor-based pagination per spec

Run unit tests. Expected: PASS.

- [ ] **Step 7: Create organization DTOs**

`create-organization.dto.ts`:
- `name` — `@IsString()`, `@MinLength(2)`, `@MaxLength(100)`
- `description` — optional, `@IsString()`, `@MaxLength(1000)`

`update-organization.dto.ts`:
- All fields optional: name, description, logo, banner

- [ ] **Step 8: Create `OrganizationController`**

- `POST /organizations` — `@CurrentUser()` gets userId, call `orgService.create(userId, dto)`
- `GET /organizations` — requires auth (consistent with spec: all browse actions require `USER` role), paginated list
- `GET /organizations/:slug` — requires auth, find by slug
- `PATCH /organizations/:id` — check org admin permission via `membershipService.verifyRole(userId, orgId, 'ADMIN')`, then update
- `DELETE /organizations/:id` — check OWNER role, then soft delete

- [ ] **Step 9: Create `OrgMembershipController`**

- `POST /organizations/:id/members` — check ADMIN role, add member
- `GET /organizations/:id/members` — list members (any authenticated user can view)
- `PATCH /organizations/:id/members/:userId` — check OWNER role, update member role
- `DELETE /organizations/:id/members/:userId` — check ADMIN role, remove member (not OWNER)

- [ ] **Step 10: Create `OrganizationModule` and `OrganizationContextModule` (barrel)**

`OrganizationModule` provides `OrganizationService`, exports it.
`OrganizationContextModule` imports + exports `OrganizationModule` and `OrgMembershipModule`.

- [ ] **Step 11: Wire into AppModule**

Import `OrganizationContextModule`.

- [ ] **Step 12: Write E2E tests**

`test/e2e/organization.e2e-spec.ts`:
- Register a user, create an org, verify OWNER membership was auto-created
- Get org by slug
- Update org (as OWNER)
- Try to update org as non-member (should 403)
- Delete org (soft delete)
- List orgs with pagination

`test/e2e/org-membership.e2e-spec.ts`:
- Add a member
- Try adding duplicate member (should 409)
- Update member role (as OWNER)
- Try updating role as ADMIN (should 403)
- Remove a member
- Try removing OWNER (should 403)

Run: `npx jest test/e2e/organization.e2e-spec.ts test/e2e/org-membership.e2e-spec.ts`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add Organization context (org CRUD, membership, permissions, e2e tests)"
```

---

## Task 7: Event Context — Event Module

**Goal:** Event CRUD with status state machine. Events belong to organizations. Only org admins can create/manage events. Status transitions enforced in the service layer.

**Files:**
- Create: `src/domain/event/event/event.service.ts`
- Create: `src/domain/event/event/event.module.ts`
- Create: `src/domain/event/event/event.controller.ts`
- Create: `src/domain/event/event/dto/create-event.dto.ts`
- Create: `src/domain/event/event/dto/update-event.dto.ts`
- Create: `src/domain/event/event/dto/update-event-status.dto.ts`
- Test: `src/domain/event/event/event.service.spec.ts`
- Test: `test/e2e/event.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `EventService` unit test (failing)**

Tests:
- `create(orgId, dto)` — creates event with status DRAFT
- `findBySlug(slug)` — returns event or throws NotFoundException
- `findById(id)` — returns event or throws
- `exists(id)` — returns boolean (for social context)
- `update(id, dto)` — updates fields
- `updateStatus(id, newStatus)` — state machine tests:
  - DRAFT → PUBLISHED: allowed
  - PUBLISHED → DRAFT: allowed only if zero registrations
  - PUBLISHED → CLOSED: allowed
  - CLOSED → COMPLETED: allowed
  - DRAFT → CLOSED: throws `BadRequestException` (invalid transition)
  - COMPLETED → anything: throws (irreversible)
- `delete(id)` — only allowed if status is DRAFT, throws otherwise
- `listPublished(pagination)` — returns only PUBLISHED events, cursor-paginated

- [ ] **Step 2: Implement `EventService`**

Key logic:
- Status transition validation: define `VALID_TRANSITIONS` map
  ```
  DRAFT -> [PUBLISHED]
  PUBLISHED -> [DRAFT, CLOSED]
  CLOSED -> [COMPLETED]
  COMPLETED -> [] (terminal)
  ```
- PUBLISHED → DRAFT: additionally check `registrationCount === 0`
- `delete()`: check `status === DRAFT`, hard delete
- Slug generation: same pattern as org (from event name)
- `listPublished()`: cursor-based, filter `status: PUBLISHED`, order by `startDate ASC`

Run unit tests. Expected: PASS.

- [ ] **Step 3: Create event DTOs**

`create-event.dto.ts`:
- `name` — `@IsString()`, required
- `description` — optional, `@IsString()`
- `location` — optional, `@IsString()`
- `startDate` — `@IsDateString()`
- `endDate` — `@IsDateString()`
- Custom validation: endDate must be after startDate

`update-event.dto.ts`:
- All fields optional (PartialType of create, minus dates that need special handling)

`update-event-status.dto.ts`:
- `status` — `@IsEnum(EventStatus)`

- [ ] **Step 4: Create `EventController`**

- `POST /organizations/:orgId/events` — verify ADMIN role via `orgMembershipService.verifyRole()`, create event
- `GET /events` — `@Public()` or auth required, list published events (paginated)
- `GET /events/:slug` — get by slug
- `PATCH /events/:id` — verify ADMIN role (look up orgId from event), update
- `PATCH /events/:id/status` — verify ADMIN role, transition status
- `DELETE /events/:id` — verify ADMIN role, delete (draft only)

- [ ] **Step 5: Create `EventModule`**

Imports `OrganizationContextModule` (needs `OrgMembershipService`).
Provides and exports `EventService`.

- [ ] **Step 6: Write E2E tests**

`test/e2e/event.e2e-spec.ts`:
- Create user → create org → create event (as OWNER)
- Try creating event as non-member (should 403)
- Get event by slug
- Update event
- Status transitions: DRAFT → PUBLISHED → CLOSED → COMPLETED
- Try invalid transition (DRAFT → CLOSED, should 400)
- Try PUBLISHED → DRAFT with registrations (should 400, tested after registration module exists — skip for now or mock)
- Delete draft event
- Try deleting published event (should 400)
- List published events with pagination

Run: `npx jest test/e2e/event.e2e-spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Event module (CRUD, status state machine, permissions, e2e tests)"
```

---

## Task 8: Event Context — Race Module

**Goal:** Race CRUD within events. Races can only be created/modified on DRAFT events. Price stored as integer cents.

**Files:**
- Create: `src/domain/event/race/race.service.ts`
- Create: `src/domain/event/race/race.module.ts`
- Create: `src/domain/event/race/race.controller.ts`
- Create: `src/domain/event/race/dto/create-race.dto.ts`
- Create: `src/domain/event/race/dto/update-race.dto.ts`
- Test: `src/domain/event/race/race.service.spec.ts`
- Test: `test/e2e/race.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `RaceService` unit test (failing)**

Tests:
- `create(eventId, dto)` — creates race, only if event is DRAFT
- `create()` — throws `BadRequestException` if event is not DRAFT
- `findById(id)` — returns race or throws
- `listByEvent(eventId)` — returns all races for an event
- `update(id, dto)` — updates race, only if parent event is DRAFT
- `delete(id)` — deletes race, only if parent event is DRAFT
- `checkCapacity(raceId)` — returns `{ available: boolean, remaining: number }` by counting confirmed registrations vs maxParticipants

- [ ] **Step 2: Implement `RaceService`**

Key logic:
- Every mutation checks the parent event's status: `if (event.status !== 'DRAFT') throw BadRequestException`
- `checkCapacity()`: count registrations where `raceId = id AND status = 'CONFIRMED'`, compare to `maxParticipants`
- Price is integer (cents). Validation happens in DTO.

Run unit tests. Expected: PASS.

- [ ] **Step 3: Create race DTOs**

`create-race.dto.ts`:
- `name` — `@IsString()` (e.g., "5K Fun Run")
- `distance` — `@IsNumber()`, `@Min(0)`
- `unit` — `@IsString()` (e.g., "km", "mi")
- `maxParticipants` — `@IsInt()`, `@Min(1)`
- `price` — `@IsInt()`, `@Min(0)` (in cents, 0 = free)
- `currency` — optional, `@IsString()`, default `PHP`

`update-race.dto.ts`:
- PartialType of create

- [ ] **Step 4: Create `RaceController`**

- `POST /events/:eventId/races` — verify ADMIN role on the event's org, create race
- `GET /events/:eventId/races` — list races for event (public for published events)
- `PATCH /races/:id` — verify ADMIN role, update
- `DELETE /races/:id` — verify ADMIN role, delete

- [ ] **Step 5: Create `RaceModule`**

Part of event context. Provides and exports `RaceService`.

- [ ] **Step 6: Write E2E tests**

Test flow: user → org → event (draft) → add races → try modifying races on published event (should fail).

Run: `npx jest test/e2e/race.e2e-spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Race module (CRUD, draft-only mutations, capacity check, e2e tests)"
```

---

## Task 9: Event Context — Registration Module

**Goal:** Users register for races. Enforces: event must be PUBLISHED, race must have capacity, user can't double-register. Registration status: PENDING → CONFIRMED → CANCELLED.

**Files:**
- Create: `src/domain/event/registration/registration.service.ts`
- Create: `src/domain/event/registration/registration.module.ts`
- Create: `src/domain/event/registration/registration.controller.ts`
- Create: `src/domain/event/registration/dto/create-registration.dto.ts`
- Test: `src/domain/event/registration/registration.service.spec.ts`
- Test: `test/e2e/registration.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `RegistrationService` unit test (failing)**

Tests:
- `register(userId, raceId)`:
  - Creates registration with status PENDING
  - Throws `BadRequestException` if event is not PUBLISHED
  - Throws `BadRequestException` if race is at capacity
  - Throws `ConflictException` if user already registered for this race
- `cancel(registrationId, userId)`:
  - Sets status to CANCELLED
  - Throws `ForbiddenException` if userId doesn't match registration owner
  - Throws `BadRequestException` if already CANCELLED
- `confirm(registrationId)` — sets status to CONFIRMED (admin action for Phase 1, payment-linked in Phase 3)
- `listByRace(raceId, pagination)` — paginated list (for org admins)
- `listByUser(userId, pagination)` — paginated list (for the user)

- [ ] **Step 2: Implement `RegistrationService`**

Key logic:
- `register()`:
  1. Get race + parent event in one query (include event)
  2. Check `event.status === 'PUBLISHED'`
  3. Check capacity via `raceService.checkCapacity(raceId)`
  4. Create registration (unique constraint on userId+raceId catches duplicates)
- `cancel()`: verify ownership, update status
- `confirm()`: update status to CONFIRMED (for now, manually by org admin)

Run unit tests. Expected: PASS.

- [ ] **Step 3: Create `RegistrationController`**

Note: No `CreateRegistrationDto` needed — the `raceId` comes from the URL param (`@Param('raceId')`), and `userId` comes from the JWT via `@CurrentUser()`. The body is empty.

- `POST /races/:raceId/registrations` — register current user (raceId from URL param, userId from JWT)
- `GET /races/:raceId/registrations` — list registrations (org member permission check via `OrgMembershipService`)
- `GET /users/me/registrations` — list current user's registrations
- `PATCH /registrations/:id/confirm` — confirm a registration (requires ADMIN role on the event's org). This is a manual admin action in Phase 1; Phase 3 links it to payment approval.
- `DELETE /registrations/:id` — cancel own registration

- [ ] **Step 5: Create `RegistrationModule`**

Part of event context.

- [ ] **Step 6: Create `EventContextModule` (barrel)**

Wire up `EventModule`, `RaceModule`, `RegistrationModule`. Export all three. Import `OrganizationContextModule` and `IdentityModule`.

- [ ] **Step 7: Wire into AppModule**

Import `EventContextModule`.

- [ ] **Step 8: Write E2E tests**

Full flow: user → org → event → publish → races → register → try duplicate (409) → try on unpublished (400) → cancel → list user's registrations.

Run: `npx jest test/e2e/registration.e2e-spec.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Registration module (register, cancel, capacity check, e2e tests)"
```

---

## Task 10: Social Context — Follow Module

**Goal:** Polymorphic follow system. Users follow users, orgs, or events. Validates target existence via cross-context service calls.

**Files:**
- Create: `src/domain/social/follow/follow.service.ts`
- Create: `src/domain/social/follow/follow.module.ts`
- Create: `src/domain/social/follow/follow.controller.ts`
- Create: `src/domain/social/follow/dto/create-follow.dto.ts`
- Create: `src/domain/social/social-context.module.ts`
- Test: `src/domain/social/follow/follow.service.spec.ts`
- Test: `test/e2e/follow.e2e-spec.ts`

**Steps:**

- [ ] **Step 1: Write `FollowService` unit test (failing)**

Tests:
- `follow(followerId, targetId, targetType)`:
  - Creates follow record
  - Validates target exists (calls appropriate service based on targetType)
  - Throws `NotFoundException` if target doesn't exist
  - Throws `ConflictException` if already following
  - Throws `BadRequestException` if trying to follow yourself
- `unfollow(followId, userId)`:
  - Deletes follow record
  - Throws `ForbiddenException` if userId doesn't match followerId
- `listFollowing(userId, pagination)` — what userId follows
- `listFollowers(targetId, targetType, pagination)` — who follows the target
- `isFollowing(followerId, targetId, targetType)` — returns boolean

- [ ] **Step 2: Implement `FollowService`**

Key logic:
- Target validation dispatch:
  ```
  switch(targetType):
    USER -> userService.exists(targetId)
    ORGANIZATION -> organizationService.exists(targetId)
    EVENT -> eventService.exists(targetId)
  ```
- Self-follow prevention: `if (targetType === 'USER' && targetId === followerId) throw BadRequest`
- Unique constraint on (followerId, targetId, targetType) catches duplicates

Run unit tests. Expected: PASS.

- [ ] **Step 3: Create `CreateFollowDto`**

- `targetId` — `@IsUUID()`
- `targetType` — `@IsEnum(FollowTargetType)`

- [ ] **Step 4: Create `FollowController`**

- `POST /follows` — follow target
- `DELETE /follows/:id` — unfollow
- `GET /users/:id/following` — list who user follows
- `GET /users/:id/followers` — list user's followers (targetType=USER)
- `GET /organizations/:id/followers` — list org's followers
- `GET /events/:id/followers` — list event's followers

- [ ] **Step 5: Create `FollowModule` and `SocialContextModule` (barrel)**

`FollowModule` imports `IdentityModule`, `OrganizationContextModule`, `EventContextModule`.
`SocialContextModule` imports and exports `FollowModule`.

- [ ] **Step 6: Wire into AppModule**

Import `SocialContextModule`.

- [ ] **Step 7: Write E2E tests**

- Follow a user, follow an org, follow an event
- Try following yourself (should 400)
- Try duplicate follow (should 409)
- Unfollow
- Try unfollowing someone else's follow (should 403)
- List following/followers with pagination
- Follow non-existent target (should 404)

Run: `npx jest test/e2e/follow.e2e-spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Follow module (polymorphic follows, target validation, e2e tests)"
```

---

## Task 11: Health Check & Final Integration

**Goal:** Add health check endpoint, run full E2E suite, verify everything works together.

**Files:**
- Modify: `src/app.module.ts` — add TerminusModule for health checks
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`

**Steps:**

- [ ] **Step 1: Install Terminus**

```bash
npm install @nestjs/terminus
```

- [ ] **Step 2: Create health check controller**

- `GET /health` — `@Public()`, checks Prisma (DB) and Redis connectivity
- Returns `{ status: 'ok', info: { database, redis }, uptime, version }`
- **Important:** Exclude health from the global `/api/v1` prefix. Use `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` in `main.ts` so the health endpoint lives at `/health` (not `/api/v1/health`). This is standard for K8s probes.

- [ ] **Step 3: Create `HealthModule` and wire into AppModule**

- [ ] **Step 4: Create `docker/docker-compose.test.yml`**

Separate compose file for E2E tests with isolated database:
- `postgres-test` on port 5433, db name `runhop_test`
- `redis-test` on port 6380
- This prevents test runs from corrupting development data

Update E2E test setup to use `DATABASE_URL=postgresql://runhop:runhop@localhost:5433/runhop_test` and `REDIS_PORT=6380`.

- [ ] **Step 5: Run the full E2E suite**

```bash
npx jest test/e2e/ --runInBand
```

`--runInBand` runs tests serially (needed since they share a database).
Expected: ALL tests pass.

- [ ] **Step 6: Run linter**

```bash
npm run lint
```

Fix any issues.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: add health check, pass full e2e suite — Phase 1 MVP complete"
```

---

## Summary

| Task | What You Build | Key Concepts You Learn |
|------|---------------|----------------------|
| 1 | Project scaffolding, Docker | NestJS bootstrap, Docker Compose, global config |
| 2 | Prisma schema, infrastructure | ORM modeling, enums, indexes, global modules |
| 3 | Shared kernel | Guards, decorators, interceptors, exception filters |
| 4 | User module | Service pattern, TDD, password handling |
| 5 | Auth module | JWT, refresh tokens, Redis, Passport strategy |
| 6 | Organization context | Transactions, permission model, soft delete, pagination |
| 7 | Event module | State machines, status transitions, validation |
| 8 | Race module | Nested resources, capacity management, price-as-cents |
| 9 | Registration module | Cross-entity validation, ownership checks, unique constraints |
| 10 | Follow module | Polymorphic relations, cross-context dependencies |
| 11 | Health check + integration | Terminus, full system verification |
