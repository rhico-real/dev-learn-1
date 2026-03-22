# RunHop Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RunHop Phase 1 MVP — auth, users, organizations, events, races, registration, and follows as a NestJS modular monolith.

**Architecture:** Domain-Driven Modules with Shared Kernel. Four bounded contexts (Identity, Organization, Event, Social) with one-way dependencies. Cross-context communication via exported services only. Infrastructure layer (Prisma, Redis, config) shared globally.

**Tech Stack:** NestJS 10, TypeScript (strict), Prisma, PostgreSQL 16, Redis 7 (ioredis), Docker Compose, Jest, class-validator, @nestjs/passport (JWT)

**Spec:** `docs/superpowers/specs/2026-03-18-runhop-system-architecture-design.md`

**Audience:** Flutter/Dart developer learning TypeScript and NestJS for the first time. Each task includes concept explanations with Dart analogies where helpful.

**Learning approach:** Tasks 1-3 followed TDD. Starting from Task 4, we switched to **implementation-first**: build the code first (so you understand what it does), then write tests. This is because TDD requires understanding the framework patterns — testing something you can't picture yet is counterproductive. Once you've built one full service + test cycle, future tasks can use TDD.

---

## Key Concepts (Read Before Starting)

This section maps NestJS/TypeScript concepts to things you already know from Flutter/Dart.

### TypeScript vs Dart — Quick Translation

| Dart | TypeScript | Notes |
|------|-----------|-------|
| `String`, `int`, `double` | `string`, `number` | TS primitives are lowercase |
| `dynamic` | `any` | Both disable type checking — avoid in strict mode |
| `late` | `!` (non-null assertion) | Both say "trust me, this exists" — use sparingly |
| `required` params | No equivalent — all params required by default | Optional params use `?` in TS |
| `class Foo extends Bar` | `class Foo extends Bar` | Same |
| `abstract class` | `abstract class` or `interface` | TS interfaces are like Dart abstract classes with no implementation |
| `enum Color { red, blue }` | `enum Color { RED = 'RED', BLUE = 'BLUE' }` | TS enums need explicit string values |
| Dart annotations (`@override`) | TS decorators (`@Injectable()`) | Same syntax, but TS decorators are much more powerful — they modify class behavior at runtime |
| `pubspec.yaml` | `package.json` | Dependency management |
| `analysis_options.yaml` | `tsconfig.json` | Compiler/linter strictness |
| `dart test` | `npx jest` | Test runner |

### NestJS vs Flutter — Architecture Mapping

| Flutter Concept | NestJS Equivalent | Explanation |
|----------------|-------------------|-------------|
| Widget tree | Module tree | NestJS organizes code into **Modules** that import each other, like Flutter's widget tree |
| `Provider` / `Riverpod` | Dependency Injection (DI) | NestJS has built-in DI. You mark a class with `@Injectable()`, register it in a module, and NestJS creates + passes instances automatically. Like `Provider` but framework-level. |
| `StatelessWidget` | `Controller` | Controllers handle HTTP requests (like a widget handles user interaction). They're thin — delegate logic to services. |
| Business logic class | `Service` | Services contain business logic. They're `@Injectable()` and get injected into controllers. |
| `Navigator` guards / `GoRouter` redirect | `Guard` | Guards decide if a request can proceed (authentication, authorization). Like route guards in GoRouter. |
| `Middleware` in Dio | `Interceptor` | Interceptors wrap request/response — add headers, transform data, log. Like Dio interceptors. |
| Data class / `freezed` model | `DTO` (Data Transfer Object) | DTOs define the shape of incoming data + validation rules. Like a Dart data class with validation. |
| `build_runner` code generation | Prisma code generation | Prisma generates TypeScript types from your schema, like `build_runner` generates code from annotations. |

### NestJS Module System — The Core Concept

In Flutter, you organize code by features/folders. In NestJS, you organize into **Modules**:

```typescript
@Module({
  imports: [OtherModule],     // modules this module depends on
  controllers: [MyController], // HTTP endpoints
  providers: [MyService],      // business logic (injectable services)
  exports: [MyService],        // what other modules can use from this module
})
export class MyModule {}
```

Every module is a self-contained unit. If module A needs module B's service, A must `import` B, and B must `export` that service. This enforces boundaries — just like our spec's "boundary rule."

### Decorators — NestJS's Superpower

In Dart, annotations are metadata (`@override`, `@deprecated`). In NestJS, **decorators** actively change behavior:

```typescript
@Controller('users')     // This class handles routes starting with /users
export class UserController {
  @Get('me')             // This method handles GET /users/me
  @UseGuards(AuthGuard)  // This endpoint requires authentication
  getProfile(@CurrentUser() user) {  // Extract user from the JWT token
    return user;
  }
}
```

You'll use decorators constantly. They're not scary — think of them as "annotations that do things."

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

> **New concepts in this task:**
> - **`package.json`** = your `pubspec.yaml`. Lists dependencies and scripts.
> - **`tsconfig.json`** = your `analysis_options.yaml`. Controls TypeScript compiler strictness. Always use `"strict": true` — it's like enabling all the strict lints in Dart.
> - **Docker Compose** = a file that defines services (databases, caches) your app needs. Like running `postgres` and `redis` locally without installing them on your machine. You define the config once, then `docker compose up -d` starts everything.
> - **`main.ts`** = the entry point, like `main()` in Dart. It creates the NestJS app instance and configures global middleware.
> - **`ValidationPipe`** = NestJS's way of validating incoming request data. Like form validation in Flutter, but server-side and automatic. `whitelist: true` strips unknown fields (security), `forbidNonWhitelisted: true` rejects them with an error.
> - **`helmet()`** = adds security HTTP headers automatically. No config needed — just `app.use(helmet())`.
> - **CORS** = browsers block requests to different domains by default. `enableCors()` tells the browser "this frontend origin is allowed to call my API." In Flutter/mobile, this doesn't exist — it's a web-only security feature.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`
- Create: `.env.example`, `.env`, `.gitignore`, `.eslintrc.js`, `.prettierrc`
- Create: `docker/docker-compose.yml`
- Create: `src/main.ts`, `src/app.module.ts`

**Important:** Only create files listed here. The File Map above shows ALL files across ALL tasks — do NOT create future task files now.

**Steps:**

### Step 1: Scaffold NestJS project

Run: `npx @nestjs/cli new runhop --strict --skip-git --package-manager npm`

This generates the base NestJS project. We use `--strict` for strict TypeScript and `--skip-git` since we already have a git repo.

### Step 2: Move scaffolded files into project root

The CLI creates a `runhop/` subdirectory. Move everything from `runhop/` into the project root. Delete the empty `runhop/` directory.

### Step 3: Verify `tsconfig.json` has strict mode

Open `tsconfig.json` and check for `"strict": true`. NestJS v11 may not generate this — if you see `"noImplicitAny": false` or `"strictBindCallApply": false`, replace them with `"strict": true`. This is critical — it catches type errors at compile time instead of runtime.

### Step 4: Install Phase 1 dependencies

```bash
npm install @nestjs/config @nestjs/passport passport passport-jwt @nestjs/throttler
npm install @prisma/client ioredis class-validator class-transformer helmet uuid
npm install -D prisma @types/passport-jwt @types/uuid
```

What each package does:
- `@nestjs/config` — loads `.env` files (like `flutter_dotenv`)
- `@nestjs/passport` + `passport` + `passport-jwt` — JWT authentication
- `@nestjs/throttler` — rate limiting (prevents brute-force attacks)
- `@prisma/client` + `prisma` — ORM for database access (like Dart's `drift` or `sqflite` but much more powerful)
- `ioredis` — Redis client (Redis = super-fast in-memory database, used for caching + token storage)
- `class-validator` + `class-transformer` — DTO validation decorators
- `helmet` — security headers
- `uuid` — generates unique IDs
- `@types/*` — TypeScript type definitions (dev only, like Dart's dev_dependencies)

### Step 5: Clean up scaffold files

Delete the NestJS demo files — you won't need them:
- Delete `src/app.controller.ts`
- Delete `src/app.service.ts`
- Delete `src/app.controller.spec.ts`

Update `src/app.module.ts` to be an empty root module:
```typescript
import { Module } from '@nestjs/common';

@Module({
  imports: [],
})
export class AppModule {}
```

### Step 6: Create Docker Compose file

Create `docker/docker-compose.yml` with:
- `postgres:16-alpine` on port 5432 (user: `runhop`, password: `runhop`, db: `runhop`)
- `redis:7-alpine` on port 6379
- Named volume for Postgres data persistence

**Important volume paths** (these are where the containers store data internally — get them wrong and your data won't persist):
- Postgres: `pgdata:/var/lib/postgresql/data`
- Redis: `redis_data:/data`

### Step 7: Create `.env.example` and `.env`

`.env.example` (committed to git — template for other developers):
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

`.env` (gitignored — your local secrets):
- Copy from `.env.example`
- Generate a real JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Paste the random output as `JWT_SECRET=<random_hex>`

### Step 8: Update `.gitignore`

Ensure `.env` is listed (but NOT `.env.example`), plus `node_modules/`, `dist/`, `.DS_Store`.

### Step 9: Update `main.ts`

Your `main.ts` should do these things (in order):
1. Create the NestJS app: `NestFactory.create(AppModule)`
2. Set global API prefix: `app.setGlobalPrefix('api/v1')`
3. Add security headers: `app.use(helmet())`
4. Add validation pipe: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`
5. Enable CORS: `app.enableCors({ origin: process.env.CORS_ORIGIN })`
6. Start listening: `app.listen(process.env.PORT ?? 3000)`

### Step 10: Start Docker and verify the app boots

```bash
cd docker && docker compose up -d && cd ..
npm run start:dev
```

Check Docker is running: `docker ps` — should show `postgres_db` and `redis_cache`.
Check app is running: visit `http://localhost:3000/api/v1` in browser or `curl http://localhost:3000/api/v1`.
Expected: 404 (no routes defined yet — that's correct, we removed the demo controller).

### Step 11: Commit

```bash
git add -A
git commit -m "chore: scaffold NestJS project with Docker (Postgres + Redis)"
```

---

## Task 2: Prisma Schema & Infrastructure Layer

> **New concepts in this task:**
> - **Prisma** = an ORM (Object-Relational Mapper). You define your database tables in a `schema.prisma` file using a simple syntax, and Prisma generates TypeScript types + a client to query the database. Like `drift` in Dart, but the schema is its own DSL (not Dart code).
> - **Migrations** = versioned database changes. When you modify `schema.prisma`, you run `prisma migrate dev` and it generates SQL to update your database. Like `sqflite` migrations but automatic.
> - **`@Global()` module** = a NestJS module available everywhere without importing it. Like a top-level `Provider` in Flutter that every widget can access. Use sparingly — only for truly global services like database and cache.
> - **`OnModuleInit` / `OnModuleDestroy`** = lifecycle hooks. Like `initState()` and `dispose()` in Flutter StatefulWidget. Used to connect/disconnect from databases.
> - **Env validation** = checking that all required environment variables exist when the app starts. If `JWT_SECRET` is missing, the app crashes immediately with a clear error instead of failing mysteriously later.

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

### Step 1: Initialize Prisma

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with `DATABASE_URL`.

### Step 2: Write the full Prisma schema

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

### Step 3: Run the first migration

```bash
npx prisma migrate dev --name init
```

Expected: Migration succeeds, tables created in Postgres.

### Step 4: Create `PrismaService`

Create `src/infrastructure/database/prisma.service.ts`:
- Extend `PrismaClient`
- Implement `OnModuleInit` (call `this.$connect()`)
- Implement `OnModuleDestroy` (call `this.$disconnect()`)

Create `src/infrastructure/database/database.module.ts`:
- Global module (`@Global()`)
- Provides and exports `PrismaService`

### Step 5: Create `RedisService`

Create `src/infrastructure/redis/redis.service.ts`:
- Injectable service wrapping `ioredis`
- Constructor takes host/port from config
- Expose methods: `get`, `set`, `del`, `setex` (set with expiry)
- Implement `OnModuleDestroy` to disconnect

Create `src/infrastructure/redis/redis.module.ts`:
- Global module
- Provides and exports `RedisService`

### Step 6: Create config module with env validation

Create `src/infrastructure/config/env.validation.ts`:
- Use `class-validator` + `class-transformer` to define an `EnvironmentVariables` class
- Validate: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- Export a `validate` function that `@nestjs/config` calls at startup

Create `src/infrastructure/config/config.module.ts`:
- Wraps `ConfigModule.forRoot()` with `validate` function and `isGlobal: true`

### Step 7: Create `prisma/seed.ts`

Create a seed script that:
- Creates a SUPER_ADMIN user with a hashed bcrypt password
- Uses `prisma.user.upsert()` (idempotent — safe to run multiple times)
- Email: `admin@runhop.com`, password: `admin123456` (dev only)
- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to `package.json`

Run: `npx prisma db seed`
Expected: SUPER_ADMIN user created.

### Step 8: Wire infrastructure into AppModule

Update `src/app.module.ts` to import `AppConfigModule`, `DatabaseModule`, `RedisModule`.

### Step 9: Verify everything boots

```bash
npm run start:dev
```

Expected: App starts, connects to Postgres and Redis, no errors.

### Step 10: Commit

```bash
git add -A
git commit -m "feat: add Prisma schema, infrastructure layer (database, redis, config)"
```

---

## Task 3: Shared Kernel (Guards, Decorators, Filters, Interceptors)

> **New concepts in this task:**
> - **Guard** = decides if a request can proceed. Like `GoRouter`'s `redirect` — if the user isn't authenticated, the guard blocks the request and returns 401. NestJS runs guards BEFORE the controller method executes.
> - **Interceptor** = wraps around the request/response. Like `Dio` interceptors in Flutter. Runs BEFORE the controller (can modify request) and AFTER (can modify response). We use it to wrap all responses in `{ data: ... }`.
> - **Exception Filter** = catches errors and formats them consistently. Like a global `try/catch` that ensures every error response has the same shape (`{ statusCode, message, error }`). In Flutter, this is like a global error handler.
> - **Custom Decorator** = a reusable annotation you create. `@CurrentUser()` extracts the logged-in user from the request — so instead of writing `request.user.sub` in every controller method, you just add `@CurrentUser() user` as a parameter.
> - **`SetMetadata()`** = attaches data to a route that guards/interceptors can read. `@Public()` sets `isPublic: true` on a route, and the `JwtAuthGuard` reads it to skip authentication.
> - **DTO (Data Transfer Object)** = a class that defines what data a request should contain + validation rules. Like a Dart data class with `@JsonSerializable()`, but with validation decorators (`@IsEmail()`, `@MinLength(8)`). NestJS automatically validates incoming requests against the DTO.
> - **`APP_GUARD`** = a guard applied to EVERY route globally. Instead of adding `@UseGuards(AuthGuard)` to every controller, you register it once as a global guard. Routes marked `@Public()` opt out.

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

### Step 1: Create shared enums

Create `src/shared/types/enums.ts` with all enums used across contexts:
- `SystemRole` — `USER`, `SUPER_ADMIN` (mirrors Prisma's `Role` enum)
- `OrgRole` — `OWNER`, `ADMIN`, `MEMBER`
- `EventStatus` — `DRAFT`, `PUBLISHED`, `CLOSED`, `COMPLETED`
- `RegistrationStatus` — `PENDING`, `CONFIRMED`, `CANCELLED`
- `FollowTargetType` — `USER`, `ORGANIZATION`, `EVENT`

Note: These are TypeScript enums that mirror the Prisma enums. They're used in DTOs and guards where you don't want to import from `@prisma/client` directly.

### Step 2: Create shared interfaces

Create `src/shared/types/interfaces.ts`:
- `JwtPayload` — `{ sub: string; role: SystemRole; jti: string }`
- `AuthenticatedUser` — `{ userId: string; role: SystemRole; jti: string }`
- `PaginatedResponse<T>` — `{ data: T[]; meta: { cursor: string | null; hasMore: boolean; limit: number } }`

### Step 3: Create `@Public()` decorator

Create `src/shared/decorators/public.decorator.ts`:
- Uses `SetMetadata('isPublic', true)`
- Marks endpoints that don't require JWT auth

### Step 4: Create `@Roles()` decorator

Create `src/shared/decorators/roles.decorator.ts`:
- Uses `SetMetadata('roles', roles)`
- Accepts array of `SystemRole` values

### Step 5: Create `@CurrentUser()` decorator

Create `src/shared/decorators/current-user.decorator.ts`:
- Custom param decorator using `createParamDecorator`
- Extracts `user` from the request object (set by Passport JWT strategy)
- Returns `AuthenticatedUser` — `{ userId: request.user.userId, role: request.user.role, jti: request.user.jti }`

### Step 6: Create `JwtAuthGuard`

Create `src/shared/guards/jwt-auth.guard.ts`:
- Extends `AuthGuard('jwt')`
- Override `canActivate`: check for `@Public()` metadata first — if public, return true without checking JWT
- This will be applied globally so every route requires auth unless marked `@Public()`

### Step 7: Create `RolesGuard`

Create `src/shared/guards/roles.guard.ts`:
- Implements `CanActivate`
- Reads `roles` metadata from `@Roles()` decorator
- If no roles set, allow (guard is only active when `@Roles()` is present)
- Compares `request.user.role` against required roles
- If user is `SUPER_ADMIN`, always allow

Note: This guard handles system-level roles only. Org-level permission checks happen in the service layer via `OrgMembershipService.verifyRole()`.

### Step 8: Create `HttpExceptionFilter`

Create `src/shared/filters/http-exception.filter.ts`:
- Catches all `HttpException` instances
- Returns consistent shape: `{ statusCode, message, error, timestamp, path }`
- In production (`NODE_ENV=production`), strip stack traces

### Step 9: Create `TransformInterceptor`

Create `src/shared/interceptors/transform.interceptor.ts`:
- Wraps all successful responses in `{ data: <response> }`
- If the response already has `data` and `meta` properties (pagination), pass through as-is
- This gives every endpoint a consistent response envelope

### Step 10: Create `PaginationQueryDto`

Create `src/shared/dto/pagination-query.dto.ts`:
- `cursor` — optional string
- `limit` — optional number, `@Min(1)`, `@Max(100)`, default 20
- This DTO is reused by every list endpoint

### Step 11: Create `LoggingInterceptor`

Create `src/shared/interceptors/logging.interceptor.ts`:
- Logs every request: method, path, status code, response time (ms), userId (if authenticated)
- Uses NestJS `Logger`
- No sensitive data in logs (no request bodies, no tokens)

### Step 12: Configure rate limiting

Configure `ThrottlerModule` in `app.module.ts`:
- Import `ThrottlerModule.forRoot()` with default limit: 100 requests/minute
- Use `ThrottlerGuard` as a global `APP_GUARD`
- For login/register endpoints, override with stricter limits using `@Throttle()` decorator:
  - Login: `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 per minute)
  - Register: `@Throttle({ default: { limit: 3, ttl: 3600000 } })` (3 per hour)

Note: Redis-backed throttler store (`@nestjs/throttler` supports custom storage) — configure with `ThrottlerStorageRedisService` or use the default in-memory store for Phase 1 and swap to Redis in Phase 4 when BullMQ arrives.

### Step 13: Create `SharedModule`

Create `src/shared/shared.module.ts`:
- Global module
- Provides `JwtAuthGuard` as `APP_GUARD` (applied globally)
- Provides `RolesGuard` as `APP_GUARD`
- Provides `HttpExceptionFilter` as `APP_FILTER`
- Provides `TransformInterceptor` as `APP_INTERCEPTOR`
- Provides `LoggingInterceptor` as `APP_INTERCEPTOR`

### Step 14: Write unit tests for shared kernel

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

### Step 15: Wire SharedModule into AppModule

Import `SharedModule` in `app.module.ts`.

### Step 16: Verify app still boots (JWT guard will reject requests — that's expected since the JWT strategy is not registered until Task 5. The app boots but all non-public routes return 401. This is correct intermediate state.)

```bash
npm run start:dev
```

### Step 17: Commit

```bash
git add -A
git commit -m "feat: add shared kernel (guards, decorators, filters, interceptors, rate limiting, types)"
```

---

## Task 4: Identity Context — User Module

> **Approach change:** For your first NestJS service, we build the implementation first so you understand what it does, THEN write tests. Once you've built one service + test, future tasks will follow TDD.

> **New concepts in this task:**
> - **`@Injectable()`** = marks a class for NestJS's dependency injection. Like registering a class with `Provider` in Flutter — NestJS creates the instance and passes it wherever it's needed.
> - **bcrypt** = a password hashing algorithm. NEVER store passwords as plain text. `bcrypt.hash(password, 12)` creates a one-way hash. `bcrypt.compare(input, hash)` checks if a password matches without knowing the original.
> - **Destructuring** = TypeScript syntax to pull apart objects: `const { password, ...rest } = user` puts `password` in one variable and everything else in `rest`. Used to strip the password field before returning.
> - **Jest** = the test framework (like `flutter_test`). `describe()` = `group()`, `it()` = `test()`, `expect()` = `expect()`. Same concepts, different names.
> - **Mocking** = creating fake versions of dependencies. `jest.fn()` creates a fake function you control. `mockResolvedValue(x)` = "when called, return a Promise that resolves to x."

**Goal:** Create the User module with `UserService` (CRUD + exists check) and `UserController` (GET/PATCH profile endpoints). No auth yet — we build the user layer first so auth can depend on it.

**Files:**
- Create: `src/domain/identity/user/user.service.ts`
- Create: `src/domain/identity/user/user.module.ts`
- Create: `src/domain/identity/user/user.controller.ts`
- Create: `src/domain/identity/user/dto/update-user.dto.ts`
- Test: `src/domain/identity/user/user.service.spec.ts`

**Steps:**

### Step 1: Install bcrypt

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### Step 2: Create `UserService`

Create `src/domain/identity/user/user.service.ts`.

This is the **Flutter equivalent of a Repository class** — it talks to the database and contains business logic. Here's the pattern with Dart comparison:

```
Flutter:                              NestJS:
class UserRepo {                      @Injectable()
  final Database db;                  export class UserService {
  UserRepo(this.db);                    constructor(private prisma: PrismaService) {}
  Future<User?> getById(id) {...}       async findById(id: string) {...}
}                                     }
```

Your service needs these methods:

**`create(data)`** — Creates a user with hashed password
- Hash the password: `await bcrypt.hash(data.password, 12)`
- Insert into database: `this.prisma.user.create({ data: { ... } })`
- Strip password before returning (use `excludePassword` helper)

**`findByEmail(email)`** — Find user by email (includes password — only auth uses this for login)
- `this.prisma.user.findUnique({ where: { email, deletedAt: null } })`
- Returns null if not found (no exception)

**`findById(id)`** — Find user by ID (WITHOUT password)
- `this.prisma.user.findUnique({ where: { id, deletedAt: null } })`
- If null, `throw new NotFoundException('User not found')`
- Strip password before returning

**`exists(id)`** — Returns boolean (used by Social context for follow validation)
- `this.prisma.user.findUnique({ where: { id, deletedAt: null }, select: { id: true } })`
- `select: { id: true }` = only fetch the id column, not the whole row (faster)
- Return `!!user` (double negation converts null→false, object→true)

**`update(id, data)`** — Update user profile
- `this.prisma.user.update({ where: { id }, data })`
- Strip password before returning

**`excludePassword(user)` (private helper)** — Strips password from any user object
```typescript
private excludePassword(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

Import these at the top:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
```

### Step 3: Create `UpdateUserDto`

Create `src/domain/identity/user/dto/update-user.dto.ts`.

A DTO is like a Dart data class with validation. This one defines what fields can be updated on a user profile:

```typescript
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;    // ? means optional

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}
```

NestJS will automatically validate incoming requests against this class. If someone sends `{ displayName: "" }` (too short), they get a 400 error. You don't write any validation logic — the decorators do it.

### Step 4: Create `UserController`

Create `src/domain/identity/user/user.controller.ts`.

A controller is a **thin layer** — it receives HTTP requests and delegates to the service. Like a Flutter screen that delegates to a BLoC:

```
Flutter:                                   NestJS:
class UserScreen extends StatelessWidget { @Controller('users')
  Widget build(context) {                  export class UserController {
    final user = ref.read(userProvider);     constructor(private userService: UserService) {}
    return Text(user.name);
  }                                          @Get('me')
}                                            getMe(@CurrentUser() user) {
                                               return this.userService.findById(user.userId);
                                             }
                                           }
```

Your controller needs these endpoints:

**`GET /users/me`** — Get current user's profile
- Use `@CurrentUser()` decorator to get `{ userId, role }` from JWT
- Call `this.userService.findById(user.userId)`

**`PATCH /users/me`** — Update current user's profile
- Use `@CurrentUser()` for userId
- Use `@Body()` with `UpdateUserDto` for validated input
- Call `this.userService.update(user.userId, dto)`

**`GET /users/:id`** — View any user's public profile
- Use `@Param('id')` to get the ID from the URL
- Call `this.userService.findById(id)`

Decorators you'll use:
```typescript
import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/types/interfaces';
```

### Step 5: Create `UserModule`

Create `src/domain/identity/user/user.module.ts`.

This wires the service and controller together:

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],  // other contexts (Auth, Social) need UserService
})
export class UserModule {}
```

`exports: [UserService]` is important — without it, other modules can't use `UserService`. It's like making a provider accessible outside its scope.

### Step 6: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors. Endpoints won't work yet (JWT guard blocks everything, auth isn't built yet) but the module should initialize.

### Step 7: Write `UserService` unit tests

NOW write the tests — you understand what each method does because you just built it.

Create `src/domain/identity/user/user.service.spec.ts`.

Here's the testing pattern for NestJS (this is the skeleton — fill in each test):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  // Fake user data to reuse in tests
  const mockUser = {
    id: '123',
    email: 'test@test.com',
    password: '$2b$12$fakehash',
    displayName: 'Test User',
    avatar: null,
    bio: null,
    role: 'USER',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Fake PrismaService — fake every Prisma method your service calls
  const mockPrisma = {
    user: {
      create: jest.fn(),       // jest.fn() = fake function you control
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    // NestJS testing module — wires up DI with your fakes instead of real services
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();  // reset fakes between tests
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      // 1. ARRANGE: tell the fake what to return
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // 2. ACT: call the real service method
      const result = await service.findById('123');

      // 3. ASSERT: check the result
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  // NOW YOU WRITE THESE:

  describe('findByEmail', () => {
    // Test: returns user (WITH password) when found
    // Test: returns null when not found
  });

  describe('exists', () => {
    // Test: returns true when user exists
    // Test: returns false when user doesn't exist
  });

  describe('create', () => {
    // Test: calls prisma.user.create, returns user WITHOUT password
    // Hint: mockPrisma.user.create.mockResolvedValue(mockUser)
    // Hint: check that result doesn't have 'password' property
  });

  describe('update', () => {
    // Test: calls prisma.user.update with correct args, returns user WITHOUT password
  });
});
```

Key testing concepts:
- **`jest.fn()`** = creates a fake function (like Dart's `MockFunction`)
- **`.mockResolvedValue(x)`** = "when called, return Promise that resolves to x"
- **`expect(x).rejects.toThrow(Y)`** = "this async function should throw error Y"
- **`expect(x).not.toHaveProperty('password')`** = "result should NOT have password field"
- **`jest.clearAllMocks()`** = reset all fakes between tests (prevent test pollution)

Run: `npx jest src/domain/identity/user/`
Expected: ALL PASS

### Step 8: Commit

```bash
git add -A
git commit -m "feat: add User module (service, controller, DTO, tests)"
```

---

## Task 5: Identity Context — Auth Module

> **New concepts in this task:**
> - **JWT (JSON Web Token)** = a signed string that proves who you are. When you login, the server creates a JWT containing your userId and role, signs it with a secret key, and gives it to the client. On every subsequent request, the client sends the JWT in the `Authorization` header. The server verifies the signature — if valid, it trusts the token's contents without hitting the database. Like Firebase Auth tokens in Flutter.
> - **Access Token vs Refresh Token** = Access tokens are short-lived (15 minutes) for security. When they expire, instead of making the user login again, the client sends a refresh token (long-lived, 7 days) to get a new access token. Like how Firebase auto-refreshes tokens.
> - **Passport Strategy** = NestJS uses "strategies" to handle authentication. A JWT strategy extracts the token from the `Authorization: Bearer <token>` header, verifies it, and attaches the user data to the request. You define the strategy once, and guards use it automatically.
> - **Token Blacklisting** = when a user logs out, their access token is still technically valid until it expires. To invalidate it immediately, we store the token's ID (`jti`) in Redis with a short TTL. The JWT strategy checks Redis before accepting any token. Like revoking a Firebase token.
> - **`ConflictException` / `UnauthorizedException`** = NestJS has built-in HTTP exception classes. `throw new ConflictException('Email already exists')` automatically returns a 409 HTTP response. Like throwing custom exceptions in Dart, but mapped to HTTP status codes.

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

### Step 1: Install dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt uuid
npm install -D @types/passport-jwt @types/uuid
```

`@nestjs/jwt` gives you `JwtService` for signing/verifying tokens. `@nestjs/passport` integrates the Passport authentication library. `uuid` generates unique IDs for token tracking. You already have `bcrypt` from Task 4.

### Step 2: Create auth DTOs

Same DTO pattern as Task 4's `UpdateUserDto` — classes with validation decorators.

Create `src/domain/identity/auth/dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)   // bcrypt has a 72-byte input limit
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;
}
```

Create `src/domain/identity/auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

Create `src/domain/identity/auth/dto/refresh-token.dto.ts`:
```typescript
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
```

### Step 3: Implement `AuthService`

Create `src/domain/identity/auth/auth.service.ts`.

This service has **four dependencies** injected through the constructor. Here's what each one does and the Dart comparison:

```
Flutter:                                    NestJS:
class AuthRepo {                            @Injectable()
  final UserRepo userRepo;                  export class AuthService {
  final FirebaseAuth auth;                    constructor(
  final SharedPrefs prefs;                      private userService: UserService,
  final RemoteConfig config;                    private jwtService: JwtService,
                                                private redisService: RedisService,
  AuthRepo(this.userRepo, this.auth,            private configService: ConfigService,
           this.prefs, this.config);          ) {}
}                                           }
```

- **`UserService`** — the service you built in Task 4. Used to create users and look them up by email.
- **`JwtService`** — from `@nestjs/jwt`. Signs and verifies JWT tokens. You call `this.jwtService.sign(payload)` to create a token.
- **`RedisService`** — from Task 2. Stores refresh tokens and blacklisted access tokens. You call `this.redisService.setex(key, seconds, value)` (set with TTL) and `this.redisService.get(key)`.
- **`ConfigService`** — from `@nestjs/config`. Reads environment variables. You call `this.configService.get<string>('JWT_SECRET')!` to get a required string value, or `this.configService.get<number>('SOME_KEY', defaultValue)` with a fallback. The `!` (non-null assertion) tells TypeScript the value definitely exists — safe here because `env.validation.ts` validates all required env vars at startup.

Here's how token generation works. This is the most important new pattern — **creating a JWT with `JwtService`**:

```typescript
import { v4 as uuid } from 'uuid';

// Inside AuthService:
private async generateTokens(userId: string, role: string) {
  // jti = "JWT ID" — a unique identifier for this specific token.
  // We store this in Redis when the user logs out so we can reject it.
  const jti = uuid();

  // JwtService.sign() creates a signed JWT string.
  // { sub, role, jti } is the "payload" — the data baked into the token.
  // "sub" is a JWT standard claim meaning "subject" (the user).
  const accessToken = this.jwtService.sign(
    { sub: userId, role, jti },
    // expiresIn comes from your .env (e.g., '15m')
  );

  // Refresh token is just a random UUID — not a JWT.
  // We store it in Redis and the client sends it back to get new access tokens.
  const refreshTokenId = uuid();

  // Store in Redis with a composite key so we can look it up directly.
  // Key format: auth:refresh:<userId>:<tokenId>
  // This avoids KEYS/SCAN operations (which are O(N) and don't scale).
  const refreshKey = `auth:refresh:${userId}:${refreshTokenId}`;
  // Redis setex() needs seconds. JWT_REFRESH_EXPIRY in .env is '7d' (string for human readability),
  // so we use a separate numeric default here. 604800 = 7 days in seconds.
  const refreshTtl = 604800;
  await this.redisService.setex(refreshKey, refreshTtl, 'valid');

  // Return the refresh token as "userId:tokenId" so the client can send it back
  // and we can reconstruct the exact Redis key to look it up.
  const refreshToken = `${userId}:${refreshTokenId}`;

  return { accessToken, refreshToken };
}
```

Now implement the four public methods:

**`register(dto)`** — Create a new user and return tokens
1. Check if email already exists: `const existing = await this.userService.findByEmail(dto.email)`
2. If exists, `throw new ConflictException('Email already exists')`
3. Create the user: `const user = await this.userService.create(dto)`
4. Strip password from response: `const { password, ...userResult } = user`
5. Generate tokens: `const tokens = await this.generateTokens(user.id, user.role)`
6. Return `{ ...tokens, user: userResult }`

**`login(dto)`** — Verify credentials and return tokens
1. Find user by email (use `findByEmail` which includes the password hash)
2. If not found, `throw new UnauthorizedException('Invalid credentials')`
3. Compare passwords using bcrypt:
   ```typescript
   import * as bcrypt from 'bcrypt';
   const isMatch = await bcrypt.compare(dto.password, user.password);
   ```
   `bcrypt.compare()` takes the plain-text password the user just typed and the hashed password from the database. It hashes the input the same way and checks if they match — you never decrypt the stored password.
4. If no match, `throw new UnauthorizedException('Invalid credentials')`
5. Generate tokens and return them with the user (strip password first)

**`refresh(dto)`** — Exchange a refresh token for new tokens
1. Parse the refresh token to get userId and tokenId: `const [userId, tokenId] = dto.refreshToken.split(':')`
2. Build the Redis key: `auth:refresh:${userId}:${tokenId}`
3. Look it up: `const stored = await this.redisService.get(key)`
4. If not found (expired or already used), `throw new UnauthorizedException('Invalid refresh token')`
5. Delete the old refresh token (rotation — each refresh token is single-use)
6. Generate new token pair and return them

**`logout(jti, userId)`** — Blacklist the current access token
1. Store the access token's jti in Redis: `auth:blacklist:${jti}` with TTL = 900 seconds (15 minutes, matching access token lifetime). Use `this.redisService.setex()`.
2. Delete the user's refresh tokens using `this.redisService.delByPattern('auth:refresh:${userId}:*')` so they can't get new access tokens

Imports you'll need at the top:
```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
```

### Step 4: Create JWT Strategy

Create `src/domain/identity/auth/strategies/jwt.strategy.ts`.

This is a completely new pattern — **Passport Strategies**. Here's the Dart comparison:

```
Flutter (Dio interceptor):                  NestJS (Passport Strategy):
class AuthInterceptor extends Interceptor { @Injectable()
  void onRequest(options, handler) {        export class JwtStrategy extends PassportStrategy(Strategy) {
    final token = getToken();                 constructor(config: ConfigService, private redis: RedisService) {
    if (isValid(token)) {                       super({
      options.headers['auth'] = token;            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      handler.next(options);                      secretOrKey: config.get<string>('JWT_SECRET')!,
    } else {                                    });
      handler.reject('unauthorized');           }
    }
  }                                             async validate(payload: any) {
}                                                 // This runs AFTER the JWT signature is verified.
                                                  // Check if the token has been blacklisted (user logged out).
                                                  const blacklisted = await this.redis.get(`auth:blacklist:${payload.jti}`);
                                                  if (blacklisted) {
                                                    throw new UnauthorizedException('Token revoked');
                                                  }
                                                  // Whatever you return here gets attached to the request
                                                  // and is available via @CurrentUser() in controllers.
                                                  return { userId: payload.sub, role: payload.role, jti: payload.jti };
                                                }
                                              }
```

The key thing to understand: `PassportStrategy(Strategy)` is a **mixin** (like Dart mixins). It takes the `passport-jwt` Strategy class and wraps it so NestJS can use it. The `super()` call configures WHERE to find the token (the `Authorization: Bearer <token>` header) and WHAT secret to verify it with. The `validate()` method runs AFTER the signature check passes — you add your own logic (like checking the blacklist).

Full file:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../../infrastructure/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const blacklisted = await this.redisService.get(`auth:blacklist:${payload.jti}`);
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return { userId: payload.sub, role: payload.role, jti: payload.jti };
  }
}
```

Note: `configService` is NOT marked `private` in the constructor. That's intentional — we only need it in the `super()` call, not as a class property. The `redisService` IS `private` because we use it in `validate()`.

### Step 5: Create `AuthController`

Same controller pattern as Task 4's `UserController`. The `@Public()` decorator (from Task 3's shared kernel) tells the JWT guard to skip authentication for that endpoint.

Create `src/domain/identity/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/types/interfaces';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()           // No JWT required — anyone can register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)  // POST defaults to 201, but login should return 200
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: AuthenticatedUser) {
    // user.jti is the access token's unique ID — we blacklist it so it can't be reused
    return this.authService.logout(user.jti, user.userId);
  }
}
```

New thing here: `@HttpCode(HttpStatus.OK)`. By default, NestJS returns HTTP 201 for POST requests (meaning "resource created"). But login and refresh don't create anything — they return data. So we override to 200. `HttpStatus.OK` is just the number `200` with a readable name.

### Step 6: Create `AuthModule`

Create `src/domain/identity/auth/auth.module.ts`.

This module introduces a new pattern: **`JwtModule.registerAsync()`**. Here's why it exists and what it does:

```
Flutter (initializing with config):         NestJS (async module registration):
void main() async {                         @Module({
  final config = await loadConfig();          imports: [
  final auth = FirebaseAuth(                    JwtModule.registerAsync({
    apiKey: config.apiKey,                        imports: [ConfigModule],
    timeout: config.timeout,                      inject: [ConfigService],
  );                                              useFactory: (config: ConfigService) => ({
  runApp(MyApp(auth: auth));                        secret: config.get<string>('JWT_SECRET')!,
}                                                   signOptions: {
                                                      expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m') as any,
                                                    },
                                                  }),
                                                }),
                                                PassportModule,
                                                UserModule,
                                              ],
```

Why `registerAsync` instead of just `register`? Because the JWT secret comes from environment variables (via `ConfigService`), and `ConfigService` is loaded asynchronously. `registerAsync` lets you inject `ConfigService` and use it to configure the module. `useFactory` is a function that receives the injected services and returns the configuration object.

Full file:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m') as any,
        },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

`PassportModule` is imported with no configuration — it just makes `@UseGuards(AuthGuard('jwt'))` available (which your global `JwtAuthGuard` from Task 3 already uses).

### Step 7: Create `IdentityModule` (barrel)

Create `src/domain/identity/identity.module.ts`.

Same module pattern as Task 4 — this is a "barrel" that groups related modules. Like a Dart barrel file (`export 'user.dart'; export 'auth.dart';`), but for NestJS modules:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  exports: [UserModule],  // AuthModule stays internal — no one outside Identity needs it
})
export class IdentityModule {}
```

Why export `UserModule` but not `AuthModule`? Because other contexts (Organization, Event, Social) need `UserService` to look up users, but they never call `AuthService` directly. Auth is only accessed through HTTP endpoints.

### Step 8: Wire IdentityModule into AppModule

Import `IdentityModule` in `app.module.ts`. Same pattern as wiring modules in Task 4.

### Step 9: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors. The app should start and the auth endpoints should be available.

### Step 10: Manual smoke test

```bash
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
  -H "Authorization: Bearer <paste-accessToken-here>"
```

Expected: Register returns user + tokens. Login returns tokens. /users/me returns user profile.

### Step 11: Write `AuthService` unit tests

NOW write the tests — you understand what each method does because you just built it.

Create `src/domain/identity/auth/auth.service.spec.ts`.

Same testing pattern as Task 4's `UserService` tests — mock dependencies, test each method. The difference is you have **four** dependencies to mock instead of one:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// You need to mock bcrypt — it's an external library, not an injected service.
// jest.mock() replaces the real module with a fake one for ALL tests in this file.
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

// Same for uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    password: '$2b$12$fakehash',
    displayName: 'Test User',
    role: 'USER',
  };

  // Four mock dependencies — one for each constructor parameter
  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockRedisService = {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(604800), // 7 days in seconds
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      // ARRANGE: email doesn't exist yet, user creation succeeds
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      // ACT
      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        displayName: 'Test User',
      });

      // ASSERT
      expect(result.accessToken).toBe('mock-access-token'); // matches mockJwtService.sign return value
      expect(result.refreshToken).toBeDefined();             // randomUUID() — can't predict exact value
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.displayName).toBe(mockUser.displayName);
      expect(result.user).not.toHaveProperty('password');   // password must be stripped from response
      expect(mockRedisService.setex).toHaveBeenCalled();    // refresh token stored in Redis
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@test.com', password: 'password123', displayName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // password matches

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result.accessToken).toBe('mock-access-token'); // matches mockJwtService.sign return value
      expect(result.refreshToken).toBeDefined();             // randomUUID() — can't predict exact value
      expect(result.user).not.toHaveProperty('password');   // password must be stripped
    });

    // NOW YOU WRITE THESE:

    // Test: throws UnauthorizedException for non-existent email
    //   Hint: mockUserService.findByEmail.mockResolvedValue(null)

    // Test: throws UnauthorizedException for wrong password
    //   Hint: (bcrypt.compare as jest.Mock).mockResolvedValue(false)
  });

  describe('refresh', () => {
    // Test: validates refresh token from Redis, returns new token pair
    //   Hint: mockRedisService.get.mockResolvedValue('valid')
    //   Hint: check that mockRedisService.del was called (old token deleted)
    //   Hint: check that mockRedisService.setex was called (new token stored)

    // Test: throws UnauthorizedException for invalid/expired refresh token
    //   Hint: mockRedisService.get.mockResolvedValue(null)
  });

  describe('logout', () => {
    // Test: blacklists access token jti in Redis, deletes refresh token
    //   Hint: call service.logout('mock-jti', 'user-123')
    //   Hint: check mockRedisService.setex was called with key containing 'blacklist'
  });
});
```

Run: `npx jest src/domain/identity/auth/auth.service.spec.ts`
Expected: ALL PASS

### Step 12: Write E2E tests for auth and user flows

E2E (end-to-end) tests are different from unit tests. Here's the Dart analogy:

```
Flutter:                                    NestJS:
Unit test = test a single class             Unit test = test a single service
  (mock everything else)                      (mock everything else)

Widget test = test a widget tree            (no direct equivalent)
  (mock services, test UI)

Integration test = test the full app        E2E test = test the full API
  (real device, real navigation,              (real database, real Redis,
   tap buttons, verify screens)                send HTTP requests, verify responses)
```

E2E tests spin up your entire NestJS app and send real HTTP requests to it using `supertest`. They use a real database and real Redis (from Docker), so they test the entire stack — controllers, services, database queries, validation, guards, everything.

Create `test/e2e/auth.e2e-spec.ts`. Here's the pattern:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // This creates a REAL NestJS app (not mocked) with all modules wired up
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // supertest sends real HTTP requests to your running app.
  // .expect(201) asserts the HTTP status code.
  // .expect(res => ...) lets you assert on the response body.

  it('POST /auth/register — should register a new user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'e2e-test@test.com',
        password: 'password123',
        displayName: 'E2E User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.user.email).toBe('e2e-test@test.com');
      });
  });

  it('POST /auth/register — should reject duplicate email', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'e2e-test@test.com',  // same email as above
        password: 'password123',
        displayName: 'Another User',
      })
      .expect(409);
  });

  // NOW YOU WRITE THESE:

  // Test: POST /auth/login — should return tokens for valid credentials
  // Test: POST /auth/login — should reject invalid password (401)
  // Test: POST /auth/refresh — should return new tokens
  // Test: POST /auth/logout — should blacklist access token
  // Test: After logout, using the old token should return 401
});
```

Also create `test/e2e/user.e2e-spec.ts`:
- Register a user, login, get access token
- `GET /users/me` — returns current user profile
- `PATCH /users/me` — update displayName and bio, verify changes
- `PATCH /users/me` — reject invalid data (empty displayName, too-long bio)
- `GET /users/:id` — view another user's public profile
- `GET /users/:id` — 404 for non-existent user
- All endpoints return 401 without auth token

Run: `npx jest test/e2e/ --runInBand`
Expected: PASS

### Step 13: Commit

```bash
git add -A
git commit -m "feat: add Auth module (register, login, refresh, logout, JWT strategy, e2e tests)"
```

---

## Task 6: Organization Context — Organization Module

> **New concepts in this task:**
> - **Prisma Transactions** = `prisma.$transaction()` runs multiple database operations atomically — either ALL succeed or ALL rollback. When creating an org, we also create the OWNER membership. If either fails, neither is saved. Like wrapping multiple `await db.insert()` calls in a single database transaction. In Dart/Flutter, if you've used `sqflite`, it's like `db.transaction((txn) async { ... })`.
> - **Slug** = a URL-friendly version of a name. "Manila Runners Club" becomes `manila-runners-club`. Used in URLs instead of IDs: `/organizations/manila-runners-club` is more readable than `/organizations/550e8400-e29b-41d4...`. Like how WordPress or Medium generates URL paths from article titles.
> - **Soft Delete** = instead of actually deleting a record (`DELETE FROM`), you set `deletedAt = now()`. The record still exists but is filtered out of queries. This preserves data integrity — if an org is deleted, the events and memberships that reference it don't break. Like marking an item as "archived" instead of truly deleting it.
> - **Cursor-based pagination** = instead of "page 2 of 10" (offset-based), you say "give me 20 items after this specific item." More efficient for large datasets because the database can use an index to jump directly to the cursor position. The cursor is typically the last item's ID from the previous page.
> - **Role hierarchy** = OWNER > ADMIN > MEMBER. When checking permissions, you compare numerically: assign each role a number and check `userRoleLevel >= requiredRoleLevel`. This way, an OWNER automatically has ADMIN permissions without listing every role explicitly.

**Goal:** CRUD for organizations with membership management. Creator auto-becomes OWNER. Update/delete requires org-level permissions. Build both Organization and OrgMembership together since they're tightly coupled (creating an org also creates the OWNER membership).

**Files:**
- Create: `src/domain/organization/org-membership/org-membership.service.ts`
- Create: `src/domain/organization/org-membership/org-membership.module.ts`
- Create: `src/domain/organization/org-membership/org-membership.controller.ts`
- Create: `src/domain/organization/org-membership/dto/add-member.dto.ts`
- Create: `src/domain/organization/org-membership/dto/update-role.dto.ts`
- Create: `src/domain/organization/organization/organization.service.ts`
- Create: `src/domain/organization/organization/organization.module.ts`
- Create: `src/domain/organization/organization/organization.controller.ts`
- Create: `src/domain/organization/organization/dto/create-organization.dto.ts`
- Create: `src/domain/organization/organization/dto/update-organization.dto.ts`
- Create: `src/domain/organization/organization-context.module.ts`
- Test: `src/domain/organization/org-membership/org-membership.service.spec.ts`
- Test: `src/domain/organization/organization/organization.service.spec.ts`
- Test: `test/e2e/organization.e2e-spec.ts`
- Test: `test/e2e/org-membership.e2e-spec.ts`

**Steps:**

### Step 1: Implement `OrgMembershipService`

Create `src/domain/organization/org-membership/org-membership.service.ts`.

This service follows the same pattern as `UserService` from Task 4 — `@Injectable()` class with `PrismaService` injected. The new concept here is the **role hierarchy pattern**:

```typescript
// Role hierarchy — higher number means more permissions.
// This lets you check "does the user have at least ADMIN access?"
// by comparing numbers instead of listing every valid role.
const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};
```

```
Dart comparison:
enum OrgRole { member, admin, owner }       // In Dart, enums have .index (0, 1, 2)
bool hasPermission(OrgRole user, OrgRole required) {
  return user.index >= required.index;       // OWNER(2) >= ADMIN(1) → true
}

TypeScript equivalent:
function hasPermission(userRole: string, requiredRole: string): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

Your service needs these methods:

**`verifyRole(userId, orgId, minRole)`** — This is the most important method. Every org-scoped action across ALL contexts calls this to check permissions.
1. Look up the membership: `prisma.orgMembership.findUnique({ where: { userId_orgId: { userId, orgId } } })`
   > **Why `userId_orgId`?** Prisma auto-generates the compound unique field name by joining the field names with `_`. Your schema has `@@unique([userId, orgId])`, so the key is `userId_orgId`. If it were `@@unique([userId, organizationId])`, the key would be `userId_organizationId`.
2. If not found, `throw new ForbiddenException('Not a member of this organization')`
3. Compare roles: `if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) throw new ForbiddenException('Insufficient role')`
4. Return the membership (useful for callers that need it)

**`addMember(orgId, userId, role)`** — Creates a membership.
1. Verify the user exists first: `const userExists = await this.userService.exists(userId)` — this follows the bounded context rule (always go through the exported service, never assume an ID is valid)
2. If not exists, `throw new NotFoundException('User not found')`
3. Create the membership. Wrap in try/catch to handle the Prisma unique constraint error (P2002) if already a member — `throw new ConflictException('User is already a member')`

**`removeMember(orgId, userId)`** — Deletes a membership.
1. Look up the membership first to check the role
2. If role is OWNER, `throw new ForbiddenException('Cannot remove the organization owner')`
3. Delete the membership: `prisma.orgMembership.delete({ where: { userId_orgId: { userId, orgId } } })`

**`updateRole(orgId, userId, newRole)`** — Updates the member's role. Only an OWNER should be able to call this (the controller checks that before calling this method).
1. Update: `prisma.orgMembership.update({ where: { userId_orgId: { userId, orgId } }, data: { role: newRole } })`

**`listMembers(orgId)`** — Returns all memberships for an org, with user info included:
```typescript
this.prisma.orgMembership.findMany({
  where: { orgId },
  include: { user: { select: { id: true, email: true, displayName: true, avatar: true } } },
});
```

**`findByUserAndOrg(userId, orgId)`** — Returns a membership or null. Used for checking if someone is a member without throwing.
1. `prisma.orgMembership.findUnique({ where: { userId_orgId: { userId, orgId } } })`

### Step 2: Create membership DTOs

Same DTO pattern as Task 4.

Create `src/domain/organization/org-membership/dto/add-member.dto.ts`:
```typescript
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsIn(['MEMBER', 'ADMIN'])   // Can't add someone as OWNER — there's only one
  role?: string = 'MEMBER';
}
```

> **`@IsIn` vs `@IsEnum`**: Use `@IsIn(['MEMBER', 'ADMIN'])` when you want to allow only specific values from a set. Use `@IsEnum(SomeEnum)` when you want to allow ALL values of a TypeScript/Prisma enum. Here we use `@IsIn` because we want MEMBER and ADMIN only — not OWNER.

Create `src/domain/organization/org-membership/dto/update-role.dto.ts`:
```typescript
import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['MEMBER', 'ADMIN'])   // Can't transfer OWNER via this endpoint
  role: string;
}
```

### Step 3: Create `OrgMembershipModule`

Same module pattern as Task 4's `UserModule`. The new thing here is the **cross-context import** — `OrgMembershipService` needs `UserService` (from Identity context) to verify users exist before adding them as members. This is the bounded context rule in action: never assume an ID is valid, always verify through the owning context's exported service.

```typescript
import { Module } from '@nestjs/common';
import { UserModule } from '../../identity/user/user.module';  // ← cross-context import
import { OrgMembershipController } from './org-membership.controller';
import { OrgMembershipService } from './org-membership.service';

@Module({
  imports: [UserModule],             // ← Identity context dependency
  controllers: [OrgMembershipController],
  providers: [OrgMembershipService],
  exports: [OrgMembershipService],   // Other contexts need this for permission checks
})
export class OrgMembershipModule {}
```

### Step 4: Implement `OrganizationService`

Create `src/domain/organization/organization/organization.service.ts`.

Same service pattern as Task 4. The new patterns here are **Prisma transactions** and **slug generation**:

**Prisma transactions** — When creating an org, you also need to create the OWNER membership. These two operations MUST succeed or fail together. Here's how:

```typescript
// prisma.$transaction() takes an async function.
// The "tx" parameter is a Prisma client scoped to this transaction.
// If ANY operation inside throws, ALL operations are rolled back.
async create(userId: string, dto: CreateOrganizationDto) {
  const slug = this.generateSlug(dto.name);

  return this.prisma.$transaction(async (tx) => {
    // Operation 1: Create the organization
    const org = await tx.organization.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
    });

    // Operation 2: Make the creator the OWNER
    await tx.orgMembership.create({
      data: {
        userId,
        orgId: org.id,       // ← must match schema field name (orgId, not organizationId)
        role: 'OWNER',
      },
    });

    return org;
  });
}
```

```
Dart comparison (sqflite):
await db.transaction((txn) async {
  final orgId = await txn.insert('organizations', {...});
  await txn.insert('org_memberships', { orgId: orgId, userId: userId, role: 'OWNER' });
});
// If the second insert fails, the first is rolled back automatically.
```

**Slug generation** — Converting a name to a URL-friendly string:
```typescript
private generateSlug(name: string): string {
  return name
    .toLowerCase()                    // "Manila Runners Club" → "manila runners club"
    .replace(/\s+/g, '-')            // "manila runners club" → "manila-runners-club"
    .replace(/[^a-z0-9-]/g, '');     // Remove anything that's not a letter, number, or hyphen
}
```

**Cursor-based pagination** — Instead of `OFFSET 20 LIMIT 10`, you use the last item's ID as a cursor:
```typescript
import { Prisma } from '@prisma/client';

async list(cursor?: string, take: number = 20) {
  const args: Prisma.OrganizationFindManyArgs = {
    take,
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  };

  if (cursor) {
    args.skip = 1;                   // Skip the cursor item itself
    args.cursor = { id: cursor };    // Start from this ID
  }

  return this.prisma.organization.findMany(args);
}
```
> **Why `Prisma.OrganizationFindManyArgs` instead of `any`?** Using `any` disables TypeScript's type checking — you could accidentally pass wrong field names and TS wouldn't catch it. The Prisma-generated type ensures `take`, `skip`, `cursor`, `where`, and `orderBy` are all correctly typed. Prisma generates these types automatically from your schema.
```

```
Dart comparison (Firestore):
// Firestore uses the same concept — .startAfterDocument() is cursor-based pagination.
final query = firestore.collection('orgs')
  .orderBy('createdAt', descending: true)
  .startAfterDocument(lastDoc)   // ← this is the "cursor"
  .limit(20);
```

The rest of the methods follow the Task 4 pattern:

**`findBySlug(slug)`** — Find the org, then check soft delete:
```typescript
async findBySlug(slug: string) {
  const org = await this.prisma.organization.findUnique({ where: { slug } });
  if (!org || org.deletedAt) throw new NotFoundException('Organization not found');
  return org;
}
```
> **Why not `findUnique({ where: { slug, deletedAt: null } })`?** Because `findUnique` only accepts fields that form a unique constraint in the `where` clause. `slug` is unique, but `deletedAt` is not part of that constraint. Prisma would throw a TypeScript error. You must fetch first, then check `deletedAt` manually. Alternative: use `findFirst({ where: { slug, deletedAt: null } })` which accepts any combination of fields — but `findFirst` doesn't use the unique index as efficiently.

**`findById(id)`** — Same pattern as `findBySlug` but by ID. Fetch with `findUnique({ where: { id } })`, then check `deletedAt`.

**`exists(id)`** — Same pattern as `UserService.exists()` from Task 4.

**`update(id, dto)`** — `prisma.organization.update({ where: { id }, data: dto })`.

**`delete(id)`** — **Soft delete pattern:** instead of `prisma.organization.delete()`, use:
```typescript
async delete(id: string) {
  await this.prisma.organization.update({
    where: { id },
    data: { deletedAt: new Date() },   // Mark as deleted, don't actually remove
  });
}
```

### Step 5: Create organization DTOs

Create `src/domain/organization/organization/dto/create-organization.dto.ts`:
```typescript
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
```

Create `src/domain/organization/organization/dto/update-organization.dto.ts`:
```typescript
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;
}
```

### Step 6: Create `OrganizationController`

Same controller pattern as Task 4 and 5. The new thing here is **calling `OrgMembershipService` from the controller for permission checks**:

Create `src/domain/organization/organization/organization.controller.ts`:

```typescript
@Controller('organizations')
export class OrganizationController {
  constructor(
    private orgService: OrganizationService,
    private membershipService: OrgMembershipService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.orgService.create(user.userId, dto);
  }

  @Get()
  list(@Query('cursor') cursor?: string) {
    return this.orgService.list(cursor);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.orgService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    // Permission check: only ADMIN or higher can update
    await this.membershipService.verifyRole(user.userId, id, 'ADMIN');
    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    // Permission check: only OWNER can delete
    await this.membershipService.verifyRole(user.userId, id, 'OWNER');
    return this.orgService.delete(id);
  }
}
```

Notice the pattern: the controller calls `membershipService.verifyRole()` BEFORE the actual operation. If the user doesn't have permission, `verifyRole` throws `ForbiddenException` and the update/delete never runs. This is how all org-scoped permissions work across the entire app.

### Step 7: Create `OrgMembershipController`

Same controller pattern. Endpoints:

- `POST /organizations/:id/members` — check ADMIN role, add member
- `GET /organizations/:id/members` — list members (any authenticated user can view)
- `PATCH /organizations/:id/members/:userId` — check OWNER role, update member role
- `DELETE /organizations/:id/members/:userId` — check ADMIN role, remove member (not OWNER)

### Step 8: Create `OrganizationModule` and `OrganizationContextModule` (barrel)

`OrganizationModule`:
```typescript
@Module({
  imports: [OrgMembershipModule],        // Need membership for permission checks
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
```

`OrganizationContextModule` — the barrel that groups everything:
```typescript
@Module({
  imports: [OrganizationModule, OrgMembershipModule],
  exports: [OrganizationModule, OrgMembershipModule],  // Other contexts need both
})
export class OrganizationContextModule {}
```

### Step 9: Wire into AppModule

Import `OrganizationContextModule` in `app.module.ts`.

### Step 10: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors.

### Step 11: Write `OrgMembershipService` unit tests

Create `src/domain/organization/org-membership/org-membership.service.spec.ts`.

Same testing pattern as Task 4. Mock `PrismaService`, test each method:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { OrgMembershipService } from './org-membership.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserService } from '../../identity/user/user.service';

describe('OrgMembershipService', () => {
  let service: OrgMembershipService;

  const mockMembership = {
    id: 'membership-123',
    userId: 'user-123',
    orgId: 'org-123',       // ← matches schema field name
    role: 'ADMIN',
    joinedAt: new Date(),
  };

  const mockPrisma = {
    orgMembership: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserService = {
    exists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgMembershipService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<OrgMembershipService>(OrgMembershipService);
    jest.clearAllMocks();
  });

  describe('verifyRole', () => {
    it('should return membership when role is sufficient', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValue(mockMembership); // role is ADMIN

      const result = await service.verifyRole('user-123', 'org-123', 'MEMBER');

      // Strong assertions: verify exact return value AND correct Prisma query
      expect(result).toEqual(mockMembership);
      expect(mockPrisma.orgMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_orgId: { userId: 'user-123', orgId: 'org-123' } },
      });
    });

    it('should throw ForbiddenException when role is insufficient', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValue({ ...mockMembership, role: 'MEMBER' });

      await expect(
        service.verifyRole('user-123', 'org-123', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });

    // NOW YOU WRITE THIS:
    // Test: throws ForbiddenException when user is not a member at all
    //   Hint: mockPrisma.orgMembership.findUnique.mockResolvedValue(null)
  });

  describe('addMember', () => {
    // Test: creates membership successfully
    //   Hint: mockUserService.exists.mockResolvedValue(true)
    //   Hint: mockPrisma.orgMembership.create.mockResolvedValue(mockMembership)
    //   Assert: verify userService.exists was called with the userId
    //   Assert: verify prisma.orgMembership.create was called with correct data

    // Test: throws NotFoundException if user doesn't exist
    //   Hint: mockUserService.exists.mockResolvedValue(false)

    // Test: throws ConflictException if already a member
    //   Hint: mockUserService.exists.mockResolvedValue(true)
    //   Hint: mockPrisma.orgMembership.create.mockRejectedValue({ code: 'P2002' })
  });

  describe('removeMember', () => {
    // Test: removes member successfully
    //   Hint: mock findUnique to return a MEMBER role, then verify delete was called

    // Test: throws ForbiddenException when trying to remove OWNER
    //   Hint: mock findUnique to return an OWNER role
  });

  describe('updateRole', () => {
    // Test: updates role successfully
    //   Assert: verify prisma.orgMembership.update was called with { where: { userId_orgId: ... }, data: { role: newRole } }
  });

  describe('listMembers', () => {
    // Test: returns all members for an org
    //   Hint: mockPrisma.orgMembership.findMany.mockResolvedValue([mockMembership])
    //   Assert: verify findMany was called with { where: { orgId: 'org-123' }, include: { user: ... } }
  });
});
```

### Step 12: Write `OrganizationService` unit tests

Create `src/domain/organization/organization/organization.service.spec.ts`.

Same pattern. The special thing here is **mocking a Prisma transaction**:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const mockOrg = {
    id: 'org-123',
    name: 'Manila Runners Club',
    slug: 'manila-runners-club',
    description: 'A running club',
    logo: null,
    banner: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    orgMembership: {
      create: jest.fn(),
    },
    // Mock $transaction — it receives a callback, so call the callback
    // with the mockPrisma itself (so tx.organization.create uses your fakes)
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create org and OWNER membership in transaction', async () => {
      mockPrisma.organization.create.mockResolvedValue(mockOrg);
      mockPrisma.orgMembership.create.mockResolvedValue({});

      const result = await service.create('user-123', { name: 'Manila Runners Club' });

      // Verify transaction was used
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      // Verify org was created with generated slug
      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Manila Runners Club',
          slug: 'manila-runners-club',  // verify slug generation
        }),
      });
      // Verify OWNER membership was created
      expect(mockPrisma.orgMembership.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          orgId: mockOrg.id,
          role: 'OWNER',
        },
      });
      expect(result).toEqual(mockOrg);
    });
  });

  describe('findBySlug', () => {
    it('should return org when found and not soft-deleted', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findBySlug('manila-runners-club');

      expect(result).toEqual(mockOrg);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'manila-runners-club' },
      });
    });

    it('should throw NotFoundException when org not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when org is soft-deleted', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        deletedAt: new Date(),  // soft-deleted
      });

      await expect(service.findBySlug('manila-runners-club')).rejects.toThrow(NotFoundException);
    });
  });

  // NOW YOU WRITE THESE:

  describe('findById', () => {
    // Test: returns org when found and not soft-deleted
    // Test: throws NotFoundException when not found
    // Test: throws NotFoundException when soft-deleted
  });

  describe('exists', () => {
    // Test: returns true when org exists and not soft-deleted
    // Test: returns false when org doesn't exist
  });

  describe('update', () => {
    // Test: updates org fields
    //   Hint: mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'New Name' })
    //   Assert: verify update called with correct where and data
  });

  describe('delete', () => {
    // Test: soft deletes by setting deletedAt
    //   Assert: verify update called with { data: { deletedAt: expect.any(Date) } }
    //   (NOT prisma.organization.delete — we don't hard delete)
  });

  describe('list', () => {
    // Test: returns orgs without cursor
    // Test: returns orgs with cursor (verify skip: 1 and cursor are set)
  });
});
```

Run: `npx jest src/domain/organization/`
Expected: ALL PASS

### Step 13: Write E2E tests

Same E2E pattern as Task 5 — use `supertest` to send real HTTP requests.

Create `test/e2e/organization.e2e-spec.ts`:
- Register a user, create an org, verify OWNER membership was auto-created
- Get org by slug
- Update org (as OWNER)
- Try to update org as non-member (should 403)
- Delete org (soft delete)
- List orgs with pagination

Create `test/e2e/org-membership.e2e-spec.ts`:
- Add a member
- Try adding duplicate member (should 409)
- Update member role (as OWNER)
- Try updating role as ADMIN (should 403)
- Remove a member
- Try removing OWNER (should 403)

Run: `npx jest test/e2e/organization.e2e-spec.ts test/e2e/org-membership.e2e-spec.ts`
Expected: PASS

### Step 14: Commit

```bash
git add -A
git commit -m "feat: add Organization context (org CRUD, membership, permissions, e2e tests)"
```

---

## Task 7: Event Context — Event Module

> **New concepts in this task:**
> - **State Machine** = a pattern where an entity can only be in certain states and can only transition between specific states. Like a Flutter `AnimationStatus` that goes `dismissed → forward → completed → reverse → dismissed` — you can't jump from `dismissed` to `completed` directly. Event status (`DRAFT -> PUBLISHED -> CLOSED -> COMPLETED`) follows strict rules. Invalid transitions throw errors.
> - **`BadRequestException`** = NestJS's 400 error. Thrown when the client sends a valid request but the business logic rejects it (e.g., trying to publish a COMPLETED event). Different from `UnauthorizedException` (401, not logged in) or `ForbiddenException` (403, logged in but not allowed).
> - **`@IsDateString()`** = a `class-validator` decorator that validates ISO 8601 date strings like `"2026-05-15T09:00:00.000Z"`. Like validating `DateTime.parse()` in Dart — if the string isn't a valid date, the request is rejected with a 400 error before your code even runs.

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

### Step 1: Implement `EventService`

Create `src/domain/event/event/event.service.ts`.

Same service pattern as Task 4 and 6 — `@Injectable()` with `PrismaService` injected. The new pattern here is the **state machine** using a `VALID_TRANSITIONS` map:

```typescript
// Define which status transitions are allowed.
// This is a state machine — the event can only move between specific states.
// The key is the CURRENT status, the value is an array of statuses it can move TO.
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT', 'CLOSED'],
  CLOSED: ['COMPLETED'],
  COMPLETED: [],              // Terminal state — can never leave COMPLETED
};
```

```
Dart comparison:
// In Flutter, you might model this as:
final validTransitions = <EventStatus, List<EventStatus>>{
  EventStatus.draft: [EventStatus.published],
  EventStatus.published: [EventStatus.draft, EventStatus.closed],
  EventStatus.closed: [EventStatus.completed],
  EventStatus.completed: [],
};

bool canTransition(EventStatus from, EventStatus to) {
  return validTransitions[from]?.contains(to) ?? false;
}
```

Here's how the status transition method works:

```typescript
async updateStatus(id: string, newStatus: string) {
  // 1. Get the current event
  const event = await this.findById(id);

  // 2. Check if this transition is allowed
  const allowedTransitions = VALID_TRANSITIONS[event.status];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition from ${event.status} to ${newStatus}`,
    );
  }

  // 3. Special case: PUBLISHED → DRAFT only allowed if nobody registered yet
  if (event.status === 'PUBLISHED' && newStatus === 'DRAFT') {
    const registrationCount = await this.prisma.registration.count({
      where: { race: { eventId: id }, status: 'CONFIRMED' },
    });
    if (registrationCount > 0) {
      throw new BadRequestException(
        'Cannot revert to DRAFT — event has confirmed registrations',
      );
    }
  }

  // 4. Update the status
  return this.prisma.event.update({
    where: { id },
    data: { status: newStatus },
  });
}
```

The rest of the methods:

**`create(orgId, dto)`** — Creates an event with status `DRAFT`. Generate a slug from the event name (same slug pattern as Task 6):
```typescript
async create(orgId: string, dto: CreateEventDto) {
  const slug = this.generateSlug(dto.name);
  return this.prisma.event.create({
    data: {
      orgId,              // ← must match schema field name (orgId, not organizationId)
      name: dto.name,
      slug,
      description: dto.description,
      location: dto.location,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      // status defaults to DRAFT via Prisma schema (@default(DRAFT))
    },
  });
}
```

**`findBySlug(slug)`**, **`findById(id)`**, **`exists(id)`** — Similar to Task 6, but **simpler** — Events don't have `deletedAt`, so no soft delete check needed. Just `findUnique` and throw `NotFoundException` if null:
```typescript
async findById(id: string) {
  const event = await this.prisma.event.findUnique({ where: { id } });
  if (!event) throw new NotFoundException('Event not found');
  return event;
}
```

**`update(id, dto)`** — Same as Task 6.

**`delete(id)`** — Different from Task 6 (which soft deletes). Events can only be deleted if they're in DRAFT status. If not DRAFT, throw `BadRequestException`. If DRAFT, hard delete (actually remove from database):
```typescript
async delete(id: string) {
  const event = await this.findById(id);
  if (event.status !== 'DRAFT') {
    throw new BadRequestException('Only DRAFT events can be deleted');
  }
  await this.prisma.event.delete({ where: { id } });
}
```

**`listPublished(cursor?, take?)`** — Cursor-based pagination (same pattern as Task 6), but filtered to `status: 'PUBLISHED'` and ordered by `startDate ASC` (upcoming events first).

### Step 2: Create event DTOs

Create `src/domain/event/event/dto/create-event.dto.ts`:

This introduces **`@IsDateString()`** — a decorator that validates ISO 8601 date strings:

```typescript
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  orgId: string;       // Which organization owns this event

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsDateString()    // Validates ISO 8601: "2026-05-15T09:00:00.000Z"
  startDate: string; // In Dart you'd use DateTime, but JSON has no date type
                     // so we accept a string and NestJS validates the format.

  @IsDateString()
  endDate: string;

  // TODO: Add custom validation to ensure endDate > startDate
  // (class-validator has @ValidateIf and custom decorators for this)
}
```

```
Dart comparison:
// In Dart, you'd parse the date and validate in the constructor:
class CreateEventDto {
  final DateTime startDate;
  final DateTime endDate;
  CreateEventDto({required this.startDate, required this.endDate})
    : assert(endDate.isAfter(startDate));
}
// In NestJS, @IsDateString() handles the parsing check.
// For cross-field validation (endDate > startDate), you'd add a custom validator.
```

Create `src/domain/event/event/dto/update-event.dto.ts`:

This introduces **`PartialType`** — a NestJS utility that takes an existing DTO and makes all its fields optional. Instead of copying all the fields from `CreateEventDto` and adding `@IsOptional()` to each one:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

// PartialType(CreateEventDto) creates a new class with ALL the same fields
// and ALL the same validators, but every field is now optional.
// It's like Dart's copyWith() but for class definitions.
export class UpdateEventDto extends PartialType(CreateEventDto) {}
```

```
Dart comparison:
// In Dart with freezed, you'd write:
@freezed class Event with _$Event {
  factory Event({required String name, ...}) = _Event;
}
// And use event.copyWith(name: 'New Name') for partial updates.
// PartialType does the same thing for DTOs — makes a "partial copy" of the class.
```

Create `src/domain/event/event/dto/update-event-status.dto.ts`:
```typescript
import { IsEnum } from 'class-validator';
import { EventStatus } from '@prisma/client';

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)     // Allows all values: DRAFT, PUBLISHED, CLOSED, COMPLETED
  status: EventStatus;     // Use the Prisma-generated enum type, not plain string
}
```
> **`@IsEnum(EventStatus)` vs `@IsIn([...])`**: Here we use `@IsEnum` with the Prisma-generated `EventStatus` enum because we want to allow ALL possible statuses. The service's state machine handles whether the *transition* is valid — the DTO just validates that the value is a real status. Compare with Task 6's `@IsIn(['MEMBER', 'ADMIN'])` where we deliberately excluded OWNER.

### Step 3: Create `EventController`

Same controller pattern as Task 6. Permission checks use `OrgMembershipService.verifyRole()` — same pattern as the Organization controller.

Create `src/domain/event/event/event.controller.ts`:

Use `@Controller('events')` for all routes. For creating an event, pass `orgId` in the request body (via `CreateEventDto`) rather than as a URL parameter — this keeps all routes cleanly under `/events`:

- `POST /events` — verify ADMIN role via `membershipService.verifyRole(user.userId, dto.orgId, 'ADMIN')`, then create event
- `GET /events` — list published events (paginated). Auth required (consistent with spec).
- `GET /events/:slug` — get event by slug
- `PATCH /events/:id` — verify ADMIN role (look up `orgId` from the event first, then check role), update event
- `PATCH /events/:id/status` — verify ADMIN role, call `eventService.updateStatus(id, dto.status)`
- `DELETE /events/:id` — verify ADMIN role, delete (draft only)

For the PATCH and DELETE endpoints, you need to look up the event first to get its `orgId`, then verify the user's role in that org:

```typescript
@Patch(':id')
async update(
  @CurrentUser() user: AuthenticatedUser,
  @Param('id') id: string,
  @Body() dto: UpdateEventDto,
) {
  const event = await this.eventService.findById(id);
  await this.membershipService.verifyRole(user.userId, event.orgId, 'ADMIN');  // ← orgId, not organizationId
  return this.eventService.update(id, dto);
}
```

### Step 4: Create `EventModule`

```typescript
@Module({
  imports: [OrganizationContextModule],   // Needs OrgMembershipService for permission checks
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
```

### Step 5: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors.

### Step 6: Write `EventService` unit tests

Create `src/domain/event/event/event.service.spec.ts`.

Same testing pattern as Tasks 4-6. The state machine tests are the most interesting part:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('EventService', () => {
  let service: EventService;

  const mockEvent = {
    id: 'event-123',
    name: 'Manila Marathon',
    slug: 'manila-marathon',
    description: 'A running event',
    location: 'Manila',
    bannerImage: null,
    status: 'DRAFT',
    orgId: 'org-123',           // ← matches schema field name (not organizationId)
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    registration: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should allow DRAFT → PUBLISHED', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: 'DRAFT' });
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, status: 'PUBLISHED' });

      const result = await service.updateStatus('event-123', 'PUBLISHED');

      expect(result.status).toBe('PUBLISHED');
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { status: 'PUBLISHED' },
      });
    });

    it('should throw BadRequestException for DRAFT → CLOSED (invalid transition)', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: 'DRAFT' });

      await expect(
        service.updateStatus('event-123', 'CLOSED'),
      ).rejects.toThrow(BadRequestException);
      // Verify update was NOT called — the transition was blocked
      expect(mockPrisma.event.update).not.toHaveBeenCalled();
    });

    // NOW YOU WRITE THESE:

    // Test: PUBLISHED → CLOSED: allowed
    //   Assert: result.status toBe 'CLOSED', update toHaveBeenCalledWith correct args

    // Test: CLOSED → COMPLETED: allowed

    // Test: COMPLETED → anything: throws (terminal state)
    //   Hint: mockResolvedValue with status: 'COMPLETED', try transitioning to 'DRAFT'
    //   Assert: rejects.toThrow(BadRequestException), update NOT called

    // Test: PUBLISHED → DRAFT with 0 registrations: allowed
    //   Hint: mockPrisma.registration.count.mockResolvedValue(0)
    //   Assert: verify registration.count was called to check for confirmed registrations

    // Test: PUBLISHED → DRAFT with registrations: throws
    //   Hint: mockPrisma.registration.count.mockResolvedValue(5)
    //   Assert: rejects.toThrow(BadRequestException), update NOT called
  });

  describe('delete', () => {
    it('should delete a DRAFT event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: 'DRAFT' });
      mockPrisma.event.delete.mockResolvedValue(mockEvent);

      await service.delete('event-123');

      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
    });

    it('should throw BadRequestException for non-DRAFT event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({ ...mockEvent, status: 'PUBLISHED' });

      await expect(service.delete('event-123')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.event.delete).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create event with DRAFT status and generated slug', async () => {
      mockPrisma.event.create.mockResolvedValue(mockEvent);

      const result = await service.create('org-123', {
        orgId: 'org-123',
        name: 'Manila Marathon',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-01T23:59:59.000Z',
      });

      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId: 'org-123',
          name: 'Manila Marathon',
          slug: 'manila-marathon',   // verify slug generation
        }),
      });
    });
  });

  describe('findById', () => {
    it('should return event when found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findById('event-123');

      expect(result).toEqual(mockEvent);
    });

    // No soft delete check needed — Events don't have deletedAt

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // NOW YOU WRITE THESE:

  describe('findBySlug', () => {
    // Test: returns event when found
    // Test: throws NotFoundException when not found
  });

  describe('exists', () => {
    // Test: returns true when event exists
    // Test: returns false when event doesn't exist
  });

  describe('listPublished', () => {
    // Test: returns published events without cursor
    //   Assert: verify findMany called with { where: { status: 'PUBLISHED' }, orderBy: { startDate: 'asc' }, ... }
    // Test: returns published events with cursor (verify skip: 1 and cursor)
  });
});
```

Run: `npx jest src/domain/event/event/`
Expected: ALL PASS

### Step 7: Write E2E tests

Same E2E pattern as Task 5. Create `test/e2e/event.e2e-spec.ts`:

- Create user, create org, create event (as OWNER)
- Try creating event as non-member (should 403)
- Get event by slug
- Update event
- Status transitions: DRAFT -> PUBLISHED -> CLOSED -> COMPLETED
- Try invalid transition (DRAFT -> CLOSED, should 400)
- Delete draft event
- Try deleting published event (should 400)
- List published events with pagination

Run: `npx jest test/e2e/event.e2e-spec.ts`
Expected: PASS

### Step 8: Commit

```bash
git add -A
git commit -m "feat: add Event module (CRUD, status state machine, permissions, e2e tests)"
```

---

## Task 8: Event Context — Race Module

> **New concepts in this task:**
> - **Price as integer cents** = never store money as `float` or `double` — floating point math causes rounding errors (`0.1 + 0.2 = 0.30000000000000004` in both Dart and TypeScript). Store PHP 500.00 as `50000` (integer cents). The frontend divides by 100 for display. This is how Stripe, PayPal, and every serious payment system works. In Dart, you'd use `int priceInCents` instead of `double price`.
> - **Parent entity status check** = before creating, updating, or deleting a race, you must check that the parent event is in DRAFT status. This is a common pattern — child entities inherit constraints from their parent. Like how in Flutter you might disable editing a form if the parent screen is in "view mode."
> - **Capacity check** = before allowing registration, count confirmed registrations and compare to `maxParticipants`. This is a read-then-write pattern that can have race conditions under high load (two people register at the same time when only 1 slot is left). For Phase 1, a simple count is fine. Phase 4 could use database locks.

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

### Step 1: Implement `RaceService`

Create `src/domain/event/race/race.service.ts`.

Same service pattern as previous tasks. The new pattern here is **checking the parent entity's status before every mutation**:

```typescript
@Injectable()
export class RaceService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  // This private helper is called before every create/update/delete.
  // It ensures the parent event is in DRAFT status.
  private async verifyEventIsDraft(eventId: string) {
    const event = await this.eventService.findById(eventId);
    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Races can only be modified when the event is in DRAFT status',
      );
    }
    return event;
  }

  async create(eventId: string, dto: CreateRaceDto) {
    await this.verifyEventIsDraft(eventId);   // Guard: event must be DRAFT

    return this.prisma.race.create({
      data: {
        ...dto,
        eventId,
      },
    });
  }

  async update(id: string, dto: UpdateRaceDto) {
    const race = await this.findById(id);
    await this.verifyEventIsDraft(race.eventId);   // Guard: event must be DRAFT

    return this.prisma.race.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const race = await this.findById(id);
    await this.verifyEventIsDraft(race.eventId);   // Guard: event must be DRAFT

    await this.prisma.race.delete({ where: { id } });
  }
}
```

```
Dart comparison:
// Like checking if a parent form is editable before allowing child changes:
class RaceBloc {
  final EventRepository eventRepo;

  Future<void> createRace(String eventId, RaceData data) async {
    final event = await eventRepo.getById(eventId);
    if (event.status != EventStatus.draft) {
      throw StateError('Event is not in draft status');
    }
    // ... create the race
  }
}
```

Other methods:

**`findById(id)`** — Same pattern as previous tasks.

**`listByEvent(eventId)`** — `prisma.race.findMany({ where: { eventId } })`. Simple — no pagination needed since an event won't have thousands of races.

**`checkCapacity(raceId)`** — Counts confirmed registrations and compares to max:
```typescript
async checkCapacity(raceId: string): Promise<{ available: boolean; remaining: number }> {
  const race = await this.findById(raceId);

  const confirmedCount = await this.prisma.registration.count({
    where: { raceId, status: 'CONFIRMED' },
  });

  const remaining = race.maxParticipants - confirmedCount;

  return {
    available: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}
```

### Step 2: Create race DTOs

Create `src/domain/event/race/dto/create-race.dto.ts`:
```typescript
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateRaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;                    // e.g., "5K Fun Run"

  @IsNumber()
  @Min(0)
  distance: number;                // e.g., 5.0

  @IsString()
  unit: string;                    // e.g., "km" or "mi"

  @IsInt()
  @Min(1)
  maxParticipants: number;         // e.g., 500

  @IsInt()
  @Min(0)
  price: number;                   // In CENTS. 50000 = PHP 500.00. 0 = free.

  @IsOptional()
  @IsString()
  currency?: string = 'PHP';      // Default to Philippine Peso
}
```

Create `src/domain/event/race/dto/update-race.dto.ts`:

This uses **`PartialType`** — same pattern introduced in Task 7:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateRaceDto } from './create-race.dto';

export class UpdateRaceDto extends PartialType(CreateRaceDto) {}
```

### Step 3: Create `RaceController`

Same controller pattern. Permission checks use the same `OrgMembershipService.verifyRole()` pattern from Tasks 6-7, but you need to look up the event first to get its `orgId`:

Since races use nested routes (`/events/:eventId/races`) for POST/GET but top-level routes (`/races/:id`) for PATCH/DELETE, use `@Controller()` with no prefix and specify full paths:

- `POST /events/:eventId/races` — verify ADMIN role on the event's org, create race
- `GET /events/:eventId/races` — list races for event
- `PATCH /races/:id` — verify ADMIN role (look up event, then org), update
- `DELETE /races/:id` — verify ADMIN role, delete

```typescript
@Controller()   // No prefix — we'll specify full paths for each route
export class RaceController {
  constructor(
    private raceService: RaceService,
    private eventService: EventService,
    private membershipService: OrgMembershipService,
  ) {}

  @Post('events/:eventId/races')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() dto: CreateRaceDto,
  ) {
    // Get the event to find which org it belongs to
    const event = await this.eventService.findById(eventId);
    // Check the user is an admin of that org
    await this.membershipService.verifyRole(user.userId, event.orgId, 'ADMIN');  // ← orgId, not organizationId
    return this.raceService.create(eventId, dto);
  }

  @Get('events/:eventId/races')
  listByEvent(@Param('eventId') eventId: string) {
    return this.raceService.listByEvent(eventId);
  }

  @Patch('races/:id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRaceDto,
  ) {
    const race = await this.raceService.findById(id);
    const event = await this.eventService.findById(race.eventId);
    await this.membershipService.verifyRole(user.userId, event.orgId, 'ADMIN');
    return this.raceService.update(id, dto);
  }

  @Delete('races/:id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const race = await this.raceService.findById(id);
    const event = await this.eventService.findById(race.eventId);
    await this.membershipService.verifyRole(user.userId, event.orgId, 'ADMIN');
    return this.raceService.delete(id);
  }
}
```

### Step 4: Create `RaceModule`

```typescript
@Module({
  imports: [
    EventModule,                    // Same context — needs EventService for draft checks and org lookup
    OrganizationContextModule,      // Cross-context — needs OrgMembershipService for permission checks
  ],
  controllers: [RaceController],
  providers: [RaceService],
  exports: [RaceService],          // Registration module will need this for capacity checks
})
export class RaceModule {}
```

> **Same-context vs cross-context imports:** `EventModule` is in the same Event context, so importing it directly is fine. `OrganizationContextModule` is a different bounded context — we import its barrel module (not individual modules) to keep the boundary clean. If you get a circular dependency error between `EventModule` and `RaceModule`, use `forwardRef(() => EventModule)` instead of `EventModule`.

### Step 5: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors.

### Step 6: Write `RaceService` unit tests

Create `src/domain/event/race/race.service.spec.ts`.

Same testing pattern. Mock `PrismaService` and `EventService`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RaceService } from './race.service';
import { EventService } from '../event/event.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('RaceService', () => {
  let service: RaceService;

  const mockRace = {
    id: 'race-123',
    name: '5K Fun Run',
    distance: 5,
    unit: 'km',
    maxParticipants: 500,
    price: 50000,
    currency: 'PHP',
    eventId: 'event-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDraftEvent = { id: 'event-123', status: 'DRAFT', orgId: 'org-123' };         // ← orgId, not organizationId
  const mockPublishedEvent = { id: 'event-123', status: 'PUBLISHED', orgId: 'org-123' }; // ← orgId, not organizationId

  const mockPrisma = {
    race: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    registration: {
      count: jest.fn(),
    },
  };

  const mockEventService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<RaceService>(RaceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create race when event is DRAFT', async () => {
      mockEventService.findById.mockResolvedValue(mockDraftEvent);
      mockPrisma.race.create.mockResolvedValue(mockRace);

      const dto = { name: '5K Fun Run', distance: 5, unit: 'km', maxParticipants: 500, price: 50000 };
      const result = await service.create('event-123', dto);

      expect(result).toEqual(mockRace);
      expect(mockEventService.findById).toHaveBeenCalledWith('event-123');  // verify draft check happened
      expect(mockPrisma.race.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventId: 'event-123', name: '5K Fun Run' }),
      });
    });

    it('should throw BadRequestException when event is not DRAFT', async () => {
      mockEventService.findById.mockResolvedValue(mockPublishedEvent);

      await expect(
        service.create('event-123', {
          name: '5K Fun Run', distance: 5, unit: 'km',
          maxParticipants: 500, price: 50000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.race.create).not.toHaveBeenCalled();  // verify create was blocked
    });
  });

  // NOW YOU WRITE THESE:

  describe('update', () => {
    // Test: updates race when event is DRAFT
    //   Hint: mock race.findUnique to return mockRace, eventService.findById to return mockDraftEvent
    //   Assert: verify race.update called with correct args, eventService.findById called with race's eventId

    // Test: throws BadRequestException when event is not DRAFT
    //   Assert: verify race.update NOT called
  });

  describe('delete', () => {
    // Test: deletes race when event is DRAFT
    //   Assert: verify race.delete called with { where: { id: 'race-123' } }

    // Test: throws BadRequestException when event is not DRAFT
    //   Assert: verify race.delete NOT called
  });

  describe('checkCapacity', () => {
    // Test: returns { available: true, remaining: 495 } when 5 out of 500 confirmed
    //   Hint: mockPrisma.race.findUnique.mockResolvedValue(mockRace) — maxParticipants is 500
    //   Hint: mockPrisma.registration.count.mockResolvedValue(5)
    //   Assert: expect(result).toEqual({ available: true, remaining: 495 })

    // Test: returns { available: false, remaining: 0 } when at capacity
    //   Hint: mockPrisma.registration.count.mockResolvedValue(500)
    //   Assert: expect(result).toEqual({ available: false, remaining: 0 })
  });

  describe('listByEvent', () => {
    // Test: returns all races for an event
    //   Hint: mockPrisma.race.findMany.mockResolvedValue([mockRace])
    //   Assert: verify findMany called with { where: { eventId: 'event-123' } }
  });
});
```

Run: `npx jest src/domain/event/race/`
Expected: ALL PASS

### Step 7: Write E2E tests

Same E2E pattern. Create `test/e2e/race.e2e-spec.ts`:

Full flow: register user, create org, create event (draft), add races, try modifying races on a published event (should fail).

- Create race on draft event (201)
- List races for event
- Update race on draft event
- Publish the event
- Try creating race on published event (should 400)
- Try updating race on published event (should 400)
- Try deleting race on published event (should 400)

Run: `npx jest test/e2e/race.e2e-spec.ts`
Expected: PASS

### Step 8: Commit

```bash
git add -A
git commit -m "feat: add Race module (CRUD, draft-only mutations, capacity check, e2e tests)"
```

---

## Task 9: Event Context — Registration Module

> **New concepts in this task:**
> - **Unique constraint as business rule** = the database has a unique constraint on `(userId, raceId)`. If a user tries to register twice, Prisma throws a unique constraint error. We catch this and throw a `ConflictException` (409). The database enforces the rule even if our code has a bug — defense in depth.
> - **Empty body endpoint** = in `POST /races/:raceId/registrations`, the `raceId` comes from the URL (`@Param('raceId')`), not the request body. The userId comes from the JWT (`@CurrentUser()`). The request body is empty. This is RESTful design — the URL identifies the resource, the JWT identifies the actor. Like `POST /api/follow/user/123` — you don't send `{ userId: 123 }` in the body because it's already in the URL.
> - **Catching Prisma unique constraint errors** = when Prisma hits a unique constraint violation, it throws a `PrismaClientKnownRequestError` with code `P2002`. You catch this specific error and translate it to a user-friendly HTTP error.

**Goal:** Users register for races. Enforces: event must be PUBLISHED, race must have capacity, user can't double-register. Registration status: PENDING -> CONFIRMED -> CANCELLED.

**Files:**
- Create: `src/domain/event/registration/registration.service.ts`
- Create: `src/domain/event/registration/registration.module.ts`
- Create: `src/domain/event/registration/registration.controller.ts`
- Test: `src/domain/event/registration/registration.service.spec.ts`
- Test: `test/e2e/registration.e2e-spec.ts`

**Steps:**

### Step 1: Implement `RegistrationService`

Create `src/domain/event/registration/registration.service.ts`.

Same service pattern. The new patterns here are **catching Prisma unique constraint errors** and **empty-body endpoints**. Let's start with the error catching:

```typescript
import { Prisma } from '@prisma/client';

async register(userId: string, raceId: string) {
  // 1. Get race + parent event in one query
  const race = await this.prisma.race.findUnique({
    where: { id: raceId },
    include: { event: true },   // Prisma joins: also fetch the parent event
  });
  if (!race) throw new NotFoundException('Race not found');

  // 2. Check event is PUBLISHED
  if (race.event.status !== 'PUBLISHED') {
    throw new BadRequestException('Event is not open for registration');
  }

  // 3. Check capacity
  const capacity = await this.raceService.checkCapacity(raceId);
  if (!capacity.available) {
    throw new BadRequestException('Race is at full capacity');
  }

  // 4. Create registration — unique constraint catches duplicates
  try {
    return await this.prisma.registration.create({
      data: {
        userId,
        raceId,
        status: 'PENDING',
      },
    });
  } catch (error) {
    // Prisma throws PrismaClientKnownRequestError with code 'P2002'
    // when a unique constraint is violated.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('You are already registered for this race');
    }
    throw error;  // Re-throw any other unexpected error
  }
}
```

```
Dart comparison:
// In Dart with sqflite, catching a unique constraint error looks like:
try {
  await db.insert('registrations', { 'user_id': userId, 'race_id': raceId });
} on DatabaseException catch (e) {
  if (e.isUniqueConstraintError()) {
    throw AlreadyRegisteredException();
  }
  rethrow;
}
// Same idea — the database enforces the rule, you translate the error.
```

Other methods:

**`cancel(registrationId, userId)`** — Ownership check + status update:
```typescript
async cancel(registrationId: string, userId: string) {
  const registration = await this.findById(registrationId);

  // Only the person who registered can cancel
  if (registration.userId !== userId) {
    throw new ForbiddenException('You can only cancel your own registration');
  }

  if (registration.status === 'CANCELLED') {
    throw new BadRequestException('Registration is already cancelled');
  }

  return this.prisma.registration.update({
    where: { id: registrationId },
    data: { status: 'CANCELLED' },
  });
}
```

**`confirm(registrationId)`** — Sets status to CONFIRMED. This is an admin action in Phase 1 (manually confirming registrations). In Phase 3, this will be triggered automatically when payment is approved.

**`listByRace(raceId, cursor?, take?)`** — Cursor-based pagination (same pattern as Task 6).

**`listByUser(userId, cursor?, take?)`** — Same pagination, filtered by `userId`.

**`findById(id)`** — Same pattern as previous tasks.

**`findRaceWithEvent(raceId)`** — Fetches a race with its parent event included. Used by the controller to look up org ownership for permission checks:
```typescript
async findRaceWithEvent(raceId: string) {
  const race = await this.prisma.race.findUnique({
    where: { id: raceId },
    include: { event: true },
  });
  if (!race) throw new NotFoundException('Race not found');
  return race;
}
```

### Step 2: Create `RegistrationController`

Create `src/domain/event/registration/registration.controller.ts`.

The new pattern here is an **empty body endpoint** — the POST request has no body at all. Everything comes from the URL and the JWT:

```typescript
@Controller()
export class RegistrationController {
  constructor(
    private registrationService: RegistrationService,
    private eventService: EventService,
    private membershipService: OrgMembershipService,
  ) {}

  // POST /races/:raceId/registrations
  // No @Body() parameter — the body is empty.
  // raceId comes from the URL, userId comes from the JWT.
  @Post('races/:raceId/registrations')
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Param('raceId') raceId: string,
  ) {
    return this.registrationService.register(user.userId, raceId);
  }

  // GET /races/:raceId/registrations — org admin sees all registrations
  @Get('races/:raceId/registrations')
  async listByRace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('raceId') raceId: string,
    @Query('cursor') cursor?: string,
  ) {
    // Look up the race + parent event in one query to find which org it belongs to
    const race = await this.registrationService.findRaceWithEvent(raceId);
    await this.membershipService.verifyRole(user.userId, race.event.orgId, 'MEMBER');  // ← orgId, not organizationId
    return this.registrationService.listByRace(raceId, cursor);
  }

  // GET /users/me/registrations — user sees their own registrations
  @Get('users/me/registrations')
  listMyRegistrations(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
  ) {
    return this.registrationService.listByUser(user.userId, cursor);
  }

  // PATCH /registrations/:id/confirm — admin confirms a registration
  @Patch('registrations/:id/confirm')
  async confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    // Look up registration → race → event → org to verify the user is an admin
    const registration = await this.registrationService.findById(id);
    const race = await this.registrationService.findRaceWithEvent(registration.raceId);
    await this.membershipService.verifyRole(user.userId, race.event.orgId, 'ADMIN');
    return this.registrationService.confirm(id);
  }

  // DELETE /registrations/:id — cancel own registration
  @Delete('registrations/:id')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.registrationService.cancel(id, user.userId);
  }
}
```

```
Dart comparison:
// In Flutter/Dart, an empty-body POST would look like:
final response = await dio.post('/races/$raceId/registrations');
// No body parameter. The server knows WHO is registering from the auth token,
// and WHAT they're registering for from the URL.
```

### Step 3: Create `RegistrationModule`

```typescript
@Module({
  imports: [
    RaceModule,                    // Same context — needs RaceService for capacity checks
    OrganizationContextModule,     // Cross-context — needs OrgMembershipService for permission checks
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
```

> **Why does RegistrationModule import these directly instead of relying on the barrel?** In NestJS, each module must declare its own imports. The `EventContextModule` barrel groups modules together for external consumers, but each module within the context still needs its own dependency declarations. Think of it like this: the barrel is the mall entrance, but each store still needs its own supply chain.

### Step 4: Create `EventContextModule` (barrel)

This barrel module wires up all three modules in the Event context:

```typescript
import { Module } from '@nestjs/common';
import { EventModule } from './event/event.module';
import { RaceModule } from './race/race.module';
import { RegistrationModule } from './registration/registration.module';
import { OrganizationContextModule } from '../organization/organization-context.module';

@Module({
  imports: [
    EventModule,
    RaceModule,
    RegistrationModule,
    OrganizationContextModule,   // All event context modules need org permission checks
  ],
  exports: [EventModule, RaceModule, RegistrationModule],
})
export class EventContextModule {}
```

### Step 5: Wire into AppModule

Import `EventContextModule` in `app.module.ts`. You can now remove the individual `EventModule` if you had imported it directly — the barrel handles it.

### Step 6: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors.

### Step 7: Write `RegistrationService` unit tests

Create `src/domain/event/registration/registration.service.spec.ts`.

Same testing pattern. The unique constraint error test is the interesting new one:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RegistrationService } from './registration.service';
import { RaceService } from '../race/race.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('RegistrationService', () => {
  let service: RegistrationService;

  const mockRaceWithEvent = {
    id: 'race-123',
    maxParticipants: 500,
    eventId: 'event-123',
    event: { id: 'event-123', status: 'PUBLISHED', orgId: 'org-123' },  // ← orgId, not organizationId
  };

  const mockRegistration = {
    id: 'reg-123',
    userId: 'user-123',
    raceId: 'race-123',
    status: 'PENDING',
    registeredAt: new Date(),
  };

  const mockPrisma = {
    race: { findUnique: jest.fn() },
    registration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRaceService = {
    checkCapacity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RaceService, useValue: mockRaceService },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create registration when event is PUBLISHED and has capacity', async () => {
      mockPrisma.race.findUnique.mockResolvedValue(mockRaceWithEvent);
      mockRaceService.checkCapacity.mockResolvedValue({ available: true, remaining: 499 });
      mockPrisma.registration.create.mockResolvedValue(mockRegistration);

      const result = await service.register('user-123', 'race-123');

      expect(result).toEqual(mockRegistration);
      expect(result.status).toBe('PENDING');
      expect(mockPrisma.registration.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', raceId: 'race-123', status: 'PENDING' },
      });
      expect(mockRaceService.checkCapacity).toHaveBeenCalledWith('race-123');
    });

    it('should throw ConflictException on duplicate registration', async () => {
      mockPrisma.race.findUnique.mockResolvedValue(mockRaceWithEvent);
      mockRaceService.checkCapacity.mockResolvedValue({ available: true, remaining: 499 });

      // Simulate Prisma throwing a unique constraint error
      mockPrisma.registration.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(
        service.register('user-123', 'race-123'),
      ).rejects.toThrow(ConflictException);
    });

    // NOW YOU WRITE THESE:

    // Test: throws BadRequestException when event is not PUBLISHED
    //   Hint: mock race.findUnique to return { ...mockRaceWithEvent, event: { ...event, status: 'DRAFT' } }
    //   Assert: rejects.toThrow(BadRequestException), registration.create NOT called

    // Test: throws BadRequestException when race is at capacity
    //   Hint: mockRaceService.checkCapacity.mockResolvedValue({ available: false, remaining: 0 })
    //   Assert: rejects.toThrow(BadRequestException), registration.create NOT called

    // Test: throws NotFoundException when race doesn't exist
    //   Hint: mockPrisma.race.findUnique.mockResolvedValue(null)
  });

  describe('cancel', () => {
    // Test: cancels registration successfully
    //   Hint: mock findUnique to return mockRegistration (status: 'PENDING', userId matches)
    //   Assert: update called with { data: { status: 'CANCELLED' } }

    // Test: throws ForbiddenException when userId doesn't match
    //   Hint: mock findUnique to return { ...mockRegistration, userId: 'different-user' }

    // Test: throws BadRequestException when already CANCELLED
    //   Hint: mock findUnique to return { ...mockRegistration, status: 'CANCELLED' }
  });

  describe('confirm', () => {
    // Test: sets status to CONFIRMED
    //   Assert: update called with { data: { status: 'CONFIRMED' } }
  });
});
```

Run: `npx jest src/domain/event/registration/`
Expected: ALL PASS

### Step 8: Write E2E tests

Same E2E pattern. Create `test/e2e/registration.e2e-spec.ts`:

Full flow: register user, create org, create event, publish event, add races, then:
- Register for a race (201)
- Try registering again (should 409 — duplicate)
- Create a second user, register them too
- Try registering on an unpublished event (should 400)
- Cancel registration
- List user's registrations
- Admin confirms a registration

Run: `npx jest test/e2e/registration.e2e-spec.ts`
Expected: PASS

### Step 9: Commit

```bash
git add -A
git commit -m "feat: add Registration module (register, cancel, capacity check, e2e tests)"
```

---

## Task 10: Social Context — Follow Module

> **New concepts in this task:**
> - **Polymorphic relation** = one table that can point to different entity types. The `Follow` table has `targetId` + `targetType` instead of separate `followedUserId`, `followedOrgId`, `followedEventId` columns. Trade-off: simpler code, but the database can't enforce foreign keys on `targetId` (since it could be a user, org, or event ID). We validate at the application layer instead. Like a Dart class with `dynamic targetId` and an enum for the type.
> - **`switch/case` for polymorphic validation** = when following a target, you need to verify the target exists. But which service you call depends on `targetType`. A `switch` statement dispatches to the right service. This is the TypeScript equivalent of pattern matching in Dart 3.
> - **Importing multiple barrel modules** = the Follow module is the only module in Phase 1 that depends on ALL three other contexts (Identity, Organization, Event). It imports their barrel modules to access `UserService.exists()`, `OrganizationService.exists()`, and `EventService.exists()`.

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

### Step 1: Implement `FollowService`

Create `src/domain/social/follow/follow.service.ts`.

Same service pattern. This service has the most dependencies of any service so far — it needs `PrismaService` plus three cross-context services for target validation:

```typescript
@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private organizationService: OrganizationService,
    private eventService: EventService,
  ) {}
}
```

```
Dart comparison:
// Like a social bloc that needs access to multiple repositories:
class FollowBloc extends Cubit<FollowState> {
  final UserRepository userRepo;
  final OrgRepository orgRepo;
  final EventRepository eventRepo;
  final FollowRepository followRepo;

  FollowBloc(this.userRepo, this.orgRepo, this.eventRepo, this.followRepo)
    : super(FollowInitial());
}
```

The key new pattern is **`switch/case` for polymorphic validation**. When a user wants to follow something, you need to verify that the target actually exists. But which service you call depends on what TYPE of thing they're following:

```typescript
// TypeScript switch/case is like Dart's switch expression,
// but without Dart 3's exhaustive pattern matching.
private async validateTargetExists(targetId: string, targetType: TargetType): Promise<void> {
  let exists: boolean;

  switch (targetType) {
    case 'USER':
      exists = await this.userService.exists(targetId);
      break;
    case 'ORGANIZATION':
      exists = await this.organizationService.exists(targetId);
      break;
    case 'EVENT':
      exists = await this.eventService.exists(targetId);
      break;
    default:
      throw new BadRequestException(`Invalid target type: ${targetType}`);
  }

  if (!exists) {
    throw new NotFoundException(`${targetType} not found`);
  }
}
```

```
Dart 3 comparison:
// In Dart 3, you'd use pattern matching:
Future<bool> validateTarget(String targetId, FollowTargetType type) async {
  return switch (type) {
    FollowTargetType.user => await userRepo.exists(targetId),
    FollowTargetType.organization => await orgRepo.exists(targetId),
    FollowTargetType.event => await eventRepo.exists(targetId),
  };
}
// TypeScript doesn't have exhaustive pattern matching (yet),
// so we use the default case to catch invalid types.
```

Now implement the service methods:

**`follow(followerId, targetId, targetType)`** — Create a follow:
1. Self-follow prevention: `if (targetType === 'USER' && targetId === followerId) throw new BadRequestException(...)`
2. Validate target exists: `await this.validateTargetExists(targetId, targetType)`
3. Create the follow record. Catch unique constraint error (same Prisma `P2002` pattern from Task 9) and throw `ConflictException`.

**`unfollow(followId, userId)`** — Delete a follow:
1. Find the follow record
2. Verify ownership: `if (follow.followerId !== userId) throw new ForbiddenException(...)`
3. Delete it

**`listFollowing(userId, cursor?, take?)`** — What a user follows. Cursor-based pagination (same pattern as Task 6).

**`listFollowers(targetId, targetType, cursor?, take?)`** — Who follows a target. Cursor-based pagination with filter on `targetId` and `targetType`.

**`isFollowing(followerId, targetId, targetType)`** — Returns boolean. Used by frontend to show "Following" vs "Follow" button.
```typescript
async isFollowing(followerId: string, targetId: string, targetType: TargetType): Promise<boolean> {
  const follow = await this.prisma.follow.findUnique({
    where: {
      followerId_targetId_targetType: { followerId, targetId, targetType },
    },
  });
  return !!follow;   // Same !! pattern from Task 4's UserService.exists()
}
```

### Step 2: Create `CreateFollowDto`

Create `src/domain/social/follow/dto/create-follow.dto.ts`:
```typescript
import { IsEnum, IsUUID } from 'class-validator';
import { TargetType } from '@prisma/client';

export class CreateFollowDto {
  @IsUUID()
  targetId: string;

  @IsEnum(TargetType)          // Allows all values: USER, ORGANIZATION, EVENT
  targetType: TargetType;      // Use Prisma-generated enum type, not plain string
}
```
> **Same pattern as Task 7's `@IsEnum(EventStatus)`** — use the Prisma-generated enum when you want ALL values allowed. Use `@IsIn([...])` when you want a subset (like Task 6's MEMBER/ADMIN only).

### Step 3: Create `FollowController`

Same controller pattern. Endpoints:

```typescript
@Controller()
export class FollowController {
  constructor(private followService: FollowService) {}

  @Post('follows')
  follow(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFollowDto) {
    return this.followService.follow(user.userId, dto.targetId, dto.targetType);
  }

  @Delete('follows/:id')
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.followService.unfollow(id, user.userId);
  }

  @Get('users/:id/following')
  listFollowing(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.followService.listFollowing(id, cursor);
  }

  @Get('users/:id/followers')
  listUserFollowers(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.followService.listFollowers(id, 'USER', cursor);
  }

  @Get('organizations/:id/followers')
  listOrgFollowers(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.followService.listFollowers(id, 'ORGANIZATION', cursor);
  }

  @Get('events/:id/followers')
  listEventFollowers(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.followService.listFollowers(id, 'EVENT', cursor);
  }
}
```

### Step 4: Create `FollowModule` and `SocialContextModule` (barrel)

The `FollowModule` imports ALL three context barrel modules — this is the **importing multiple barrel modules** pattern:

```typescript
@Module({
  imports: [
    IdentityModule,                // For UserService.exists()
    OrganizationContextModule,     // For OrganizationService.exists()
    EventContextModule,            // For EventService.exists()
  ],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
```

```
Dart comparison:
// Like a provider that depends on other providers:
final followProvider = Provider((ref) {
  final userRepo = ref.read(userRepoProvider);
  final orgRepo = ref.read(orgRepoProvider);
  final eventRepo = ref.read(eventRepoProvider);
  return FollowService(userRepo, orgRepo, eventRepo);
});
// Each imported module makes its exported services available for injection.
```

`SocialContextModule`:
```typescript
@Module({
  imports: [FollowModule],
  exports: [FollowModule],
})
export class SocialContextModule {}
```

### Step 5: Wire into AppModule

Import `SocialContextModule` in `app.module.ts`.

### Step 6: Verify it compiles

```bash
npm run start:dev
```

Expected: compiles with 0 errors.

### Step 7: Write `FollowService` unit tests

Create `src/domain/social/follow/follow.service.spec.ts`.

Same testing pattern. Mock all four dependencies:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FollowService } from './follow.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserService } from '../../identity/user/user.service';
import { OrganizationService } from '../../organization/organization/organization.service';
import { EventService } from '../../event/event/event.service';

describe('FollowService', () => {
  let service: FollowService;

  const mockFollow = {
    id: 'follow-123',
    followerId: 'user-123',
    targetId: 'user-456',
    targetType: 'USER',
    createdAt: new Date(),
  };

  const mockPrisma = {
    follow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserService = { exists: jest.fn() };
  const mockOrgService = { exists: jest.fn() };
  const mockEventService = { exists: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should create follow for existing user target', async () => {
      mockUserService.exists.mockResolvedValue(true);
      mockPrisma.follow.create.mockResolvedValue(mockFollow);

      const result = await service.follow('user-123', 'user-456', 'USER');

      expect(result).toEqual(mockFollow);
      expect(mockUserService.exists).toHaveBeenCalledWith('user-456');
    });

    it('should throw BadRequestException when following yourself', async () => {
      await expect(
        service.follow('user-123', 'user-123', 'USER'),
      ).rejects.toThrow(BadRequestException);
    });

    // NOW YOU WRITE THESE:

    // Test: creates follow for ORGANIZATION target
    //   Hint: mockOrgService.exists.mockResolvedValue(true)

    // Test: creates follow for EVENT target
    //   Hint: mockEventService.exists.mockResolvedValue(true)

    // Test: throws NotFoundException if target doesn't exist
    //   Hint: mockUserService.exists.mockResolvedValue(false)

    // Test: throws ConflictException on duplicate follow
    //   Hint: same Prisma P2002 pattern from Task 9
  });

  describe('unfollow', () => {
    // Test: deletes follow successfully
    //   Hint: mockPrisma.follow.findUnique.mockResolvedValue(mockFollow)
    //   Assert: verify delete called with { where: { id: 'follow-123' } }

    // Test: throws ForbiddenException if userId doesn't match followerId
    //   Hint: mockPrisma.follow.findUnique.mockResolvedValue({ ...mockFollow, followerId: 'other-user' })

    // Test: throws NotFoundException if follow doesn't exist
    //   Hint: mockPrisma.follow.findUnique.mockResolvedValue(null)
  });

  describe('isFollowing', () => {
    // Test: returns true when follow exists
    //   Hint: mockPrisma.follow.findUnique.mockResolvedValue(mockFollow)
    //   Assert: expect(result).toBe(true)
    //   Assert: verify findUnique called with { where: { followerId_targetId_targetType: { ... } } }

    // Test: returns false when follow doesn't exist
    //   Hint: mockPrisma.follow.findUnique.mockResolvedValue(null)
    //   Assert: expect(result).toBe(false)
  });
});
```

Run: `npx jest src/domain/social/follow/`
Expected: ALL PASS

### Step 8: Write E2E tests

Same E2E pattern. Create `test/e2e/follow.e2e-spec.ts`:

Setup: register two users, create an org, create an event. Then:
- Follow a user (201)
- Follow an org (201)
- Follow an event (201)
- Try following yourself (should 400)
- Try duplicate follow (should 409)
- List following for user
- List followers for user/org/event
- Unfollow
- Try unfollowing someone else's follow (should 403)
- Follow non-existent target (should 404)

Run: `npx jest test/e2e/follow.e2e-spec.ts`
Expected: PASS

### Step 9: Commit

```bash
git add -A
git commit -m "feat: add Follow module (polymorphic follows, target validation, e2e tests)"
```

---

## Task 11: Health Check & Final Integration

> **New concepts in this task:**
> - **`@nestjs/terminus`** = NestJS's health check library. It provides standard health check indicators for databases, memory, disk, and custom services. Like Flutter's `connectivity_plus` package but for server health — it tells load balancers and Kubernetes whether your server is healthy and ready to accept traffic.
> - **`setGlobalPrefix` with `exclude`** = your API lives at `/api/v1/...`, but the health check endpoint should live at `/health` (not `/api/v1/health`). The `exclude` option lets specific routes skip the global prefix. This is standard for infrastructure endpoints that monitoring tools expect at a fixed path.

**Goal:** Add health check endpoint, set up isolated test infrastructure, run full E2E suite, verify everything works together.

**Files:**
- Modify: `src/main.ts` — update `setGlobalPrefix` to exclude health
- Modify: `src/app.module.ts` — import HealthModule
- Create: `src/health/health.controller.ts`
- Create: `src/health/health.module.ts`
- Create: `docker/docker-compose.test.yml`

**Steps:**

### Step 1: Install Terminus

```bash
npm install @nestjs/terminus
```

### Step 2: Create health check controller

Create `src/health/health.controller.ts`.

This introduces the **`@nestjs/terminus` health check pattern**:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { Public } from '../shared/decorators/public.decorator';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Public()     // Health checks must be accessible without auth
  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      // Each function in this array is a "health indicator."
      // It runs a quick check and reports healthy/unhealthy.

      // Database health: run a simple query
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' } };
        } catch {
          return { database: { status: 'down' } };
        }
      },

      // Redis health: ping the server
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.redis.ping();   // You need to add this method — see below
          return { redis: { status: 'up' } };
        } catch {
          return { redis: { status: 'down' } };
        }
      },
    ]);
  }
}
```

```
Dart comparison:
// Like a Flutter health check screen that pings all your backends:
class HealthCheckScreen extends StatefulWidget {
  Future<Map<String, bool>> checkHealth() async {
    return {
      'database': await _tryPing(databaseUrl),
      'redis': await _tryPing(redisUrl),
      'api': await _tryPing(apiUrl),
    };
  }
}
// Terminus does the same thing but returns a standardized JSON response
// that Kubernetes and monitoring tools understand.
```

**Before this works**, add a `ping()` method to `src/infrastructure/redis/redis.service.ts`:
```typescript
async ping(): Promise<string> {
  return this.client.ping();   // ioredis client has built-in ping()
}
```

The response looks like:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Step 3: Create `HealthModule`

Create `src/health/health.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

Wire it into `app.module.ts` by adding `HealthModule` to the imports.

### Step 4: Update `main.ts` to exclude health from global prefix

In `src/main.ts`, update the `setGlobalPrefix` call to exclude the health endpoint:

```typescript
// BEFORE:
app.setGlobalPrefix('api/v1');

// AFTER:
app.setGlobalPrefix('api/v1', {
  exclude: ['health'],    // /health lives at the root, not /api/v1/health
});
```

```
Dart comparison:
// Like configuring GoRouter routes — most routes go through '/app/...'
// but '/health' is at the root:
GoRouter(routes: [
  GoRoute(path: '/health', builder: (_, __) => HealthScreen()),
  ShellRoute(
    path: '/app',
    routes: [ /* all your app routes */ ],
  ),
]);
```

Why exclude health from the prefix? Kubernetes liveness/readiness probes, AWS ALB health checks, and monitoring tools all expect health endpoints at a fixed, short path like `/health` or `/healthz`. They don't know about your API versioning scheme.

### Step 5: Verify health check works

```bash
npm run start:dev

curl http://localhost:3000/health
```

Expected: `{ "status": "ok", "info": { "database": { "status": "up" }, "redis": { "status": "up" } } }`

### Step 6: Create `docker/docker-compose.test.yml`

This creates an isolated database and Redis for running E2E tests, so tests don't corrupt your development data:

```yaml
services:          # No 'version' key — it's deprecated in modern Docker Compose
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: runhop_test
      POSTGRES_USER: runhop
      POSTGRES_PASSWORD: runhop
    ports:
      - '5433:5432'          # Different port from dev (5433 vs 5432)

  redis-test:
    image: redis:7-alpine
    ports:
      - '6380:6379'          # Different port from dev (6380 vs 6379)
```

```
Dart comparison:
// Like having separate Firebase projects for dev vs test:
// - Dev: my-app-dev (port 5432)
// - Test: my-app-test (port 5433)
// They share the same schema but different data.
```

Start the test infrastructure:
```bash
docker compose -f docker/docker-compose.test.yml up -d
```

Update your E2E test setup to use the test database. Create or update a `.env.test` file:
```
DATABASE_URL=postgresql://runhop:runhop@localhost:5433/runhop_test
REDIS_HOST=localhost
REDIS_PORT=6380
```

Run Prisma migrations against the test database:
```bash
DATABASE_URL=postgresql://runhop:runhop@localhost:5433/runhop_test npx prisma migrate deploy
```

### Step 7: Run the full E2E suite

```bash
npx jest test/e2e/ --runInBand
```

`--runInBand` runs tests one at a time instead of in parallel. This is necessary because E2E tests share a database — running them in parallel could cause flaky tests where one test's data interferes with another's.

Expected: ALL tests pass.

### Step 8: Run linter

```bash
npm run lint
```

Fix any issues. Common ones at this stage:
- Unused imports (remove them)
- Missing return types on async functions
- Inconsistent quotes (your `.prettierrc` should handle this)

### Step 9: Final commit

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
