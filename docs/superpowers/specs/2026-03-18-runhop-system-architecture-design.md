# RunHop System Architecture Design

**Date:** 2026-03-18
**Status:** Approved
**Type:** System Architecture & Module Breakdown

---

## Overview

RunHop is a social + event platform for races (running, cycling, etc.) targeting the Philippine market. Web-first, mobile later. This document defines the system architecture, module breakdown, entity relationships, and infrastructure decisions.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Backend framework | NestJS (TypeScript, strict mode) |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Cache / Queues | Redis 7 (ioredis) + BullMQ (Phase 4) |
| File storage | Supabase Storage |
| Auth | JWT (access + refresh) via @nestjs/passport |
| Architecture | Modular Monolith |
| Deployment target | Kubernetes |
| Dev environment | Docker Compose (Postgres + Redis) |

## Architecture: Domain-Driven Modules with Shared Kernel

Features are grouped into **bounded contexts** — clusters of closely related modules that share a clear domain boundary. Cross-context communication goes through well-defined service interfaces (not direct repository access). Infrastructure is separated from business logic.

---

## Bounded Contexts & Module Breakdown

### 1. Identity Context (`src/domain/identity/`)

Owns **who you are** and **how you prove it**.

| Module | Responsibility |
|--------|---------------|
| `auth` | Register, login, logout, token refresh, password reset. Produces JWTs, manages refresh tokens in Redis. |
| `user` | User CRUD, profile management (bio, avatar, location). The core "person" entity that every other context references. |

**Why grouped:** Auth and user are inseparable — you can't authenticate without a user, and user creation always happens through auth (registration). They change together.

### 2. Organization Context (`src/domain/organization/`)

Owns **groups that create events**.

| Module | Responsibility |
|--------|---------------|
| `organization` | Org CRUD (name, description, logo, banner). Only org admins or super admins create orgs. |
| `org-membership` | Join table managing who belongs to which org and with what role (`OWNER`, `ADMIN`, `MEMBER`). Handles invites, role changes, removals. |

**Why its own context:** An org is not a user — it's a separate entity with its own lifecycle. Membership logic (invitations, role hierarchy, permissions) is complex enough to warrant isolation.

### 3. Event Context (`src/domain/event/`)

Owns **what people show up to**.

| Module | Responsibility |
|--------|---------------|
| `event` | Event CRUD (name, description, date, location, banner, status). An event belongs to an org. Manages event lifecycle (see state machine below). |
| `race` | Race CRUD within an event. A race is a specific category (5K, 10K, 21K) with its own distance, capacity, price tiers. |
| `registration` | User registers for a specific race. Tracks registration status: `PENDING` → `CONFIRMED` → `CANCELLED`. Phase 3 adds payment linkage. |

**Why grouped:** Event, race, and registration form a tight transactional cluster. They share validation rules (can't register for an unpublished event, can't exceed race capacity).

**Event Status State Machine:**
```
  DRAFT ──→ PUBLISHED ──→ CLOSED ──→ COMPLETED
    ▲            │
    └────────────┘
     (unpublish)
```
- `DRAFT → PUBLISHED`: Org admin publishes. Event becomes visible and registrations open.
- `PUBLISHED → DRAFT`: Org admin unpublishes (e.g., corrections needed). Only allowed if zero registrations exist.
- `PUBLISHED → CLOSED`: Org admin closes registration manually, OR race capacity is full, OR event start date passes.
- `CLOSED → COMPLETED`: Org admin marks event as done after the race day. Irreversible.
- No other transitions allowed. Enforced at the service layer.

### 4. Social Context (`src/domain/social/`)

Owns **how people connect and interact**.

| Module | Phase | Responsibility |
|--------|-------|---------------|
| `follow` | 1 | Polymorphic follow system. Users can follow users, organizations, or events. |
| `post` | 2 | Posts by orgs/events. Text + images. |
| `reaction` | 2 | Likes and comments on posts. |
| `feed` | 2 | Aggregated home feed from followed entities. |
| `notification` | 2 | Follow notifications, registration approvals, likes, etc. |

**Why separate context for follows:** Follows are cross-cutting — they touch users, orgs, and events. Isolating in social prevents dependency explosion.

---

## Cross-Context Communication Rules

### The Boundary Rule

> A module may only consume another context's exported Service — never its Repository or Prisma model directly.

If `EventService` directly queries the `Organization` table through Prisma, you've created invisible coupling. By going through `OrganizationService`, the org context controls its own contract.

### Dependency Graph

```
                    ┌──────────────┐
                    │   Identity   │
                    │  (auth/user) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            │            ▼
     ┌────────────┐        │       ┌────────┐
     │Organization│        │       │  Event  │
     │            │        │       │         │
     └─────┬──────┘        │       └────┬────┘
           │               │            │
           │  Event ───────┘            │
           │  depends on Org            │
           └────────────────────────────┘
                           │
                    ┌──────┴───────┐
                    │    Social    │
                    │  (follow)    │
                    └──────────────┘
                 depends on Identity,
                 Organization, Event
                 (existence checks only)
```

**Rules:**
- Dependencies flow one way (downward)
- **Identity** is depended on by everyone but depends on nothing
- **Organization** depends on Identity only
- **Event** depends on Identity + Organization
- **Social** depends on Identity, Organization, and Event for target existence validation. It imports their barrel modules to access `UserService.exists()`, `OrganizationService.exists()`, and `EventService.exists()`. This is an honest multi-dependency, not a violation — Social only calls simple existence checks, not complex business methods.
- **No circular dependencies** — Social depends downward on all three contexts but nothing depends on Social in Phase 1.

### Interaction Examples

| Scenario | Who calls who |
|----------|--------------|
| Create an event | `EventService` → `OrgMembershipService.verifyRole(userId, orgId, 'ADMIN')` |
| Register for a race | `RegistrationService` → `RaceService.checkCapacity(raceId)` (same context) |
| Follow an org | `FollowService` → validates targetType + targetId via appropriate service |
| Org admin views registrations | `RegistrationService` → `OrgMembershipService.verifyRole()` → returns registrations |

### Event-Driven Side Effects (Phase 2+)

Cross-context side effects use NestJS `EventEmitter2` — not direct service calls:

```
FollowService.create()
  → emits 'follow.created'
    → NotificationService listens and creates notification
```

This prevents coupling between contexts. When BullMQ arrives in Phase 4, swap the transport without changing business logic.

---

## Roles & Permissions Matrix

### System-Level Roles (`User.role`)

| Role | Description |
|------|-------------|
| `USER` | Default. Can browse events, register for races, follow entities, manage own profile. |
| `SUPER_ADMIN` | Platform operator. Can manage all orgs, events, users. Created via seed or CLI — no self-registration. |

### Org-Level Roles (`OrgMembership.role`)

| Role | Permissions |
|------|------------|
| `OWNER` | Full control: edit org, manage members (add/remove/change roles), create/manage events, delete org. One OWNER per org (transferable). |
| `ADMIN` | Edit org profile, create/manage events, manage event registrations. Cannot delete org or manage OWNER role. |
| `MEMBER` | View org internals, assigned to help manage specific events (Phase 2). No org-level edit permissions in Phase 1. |

### Permission Resolution

For any org-scoped action, the system checks two things:
1. `User.role === 'SUPER_ADMIN'` → allow (overrides everything)
2. `OrgMembership` for (userId, orgId) → check `OrgMembership.role` meets minimum required role

### Endpoint Permission Map (Phase 1)

| Action | Min System Role | Min Org Role | Notes |
|--------|----------------|-------------|-------|
| Register/login/refresh | Public | — | No auth required |
| View own profile | `USER` | — | |
| Update own profile | `USER` | — | |
| View any user profile | `USER` | — | |
| Create organization | `USER` | — | Creator becomes `OWNER` automatically |
| Update organization | `USER` | `ADMIN` | |
| Delete organization | `USER` | `OWNER` | |
| Add org member | `USER` | `ADMIN` | |
| Remove org member | `USER` | `ADMIN` | Cannot remove `OWNER` |
| Change member role | `USER` | `OWNER` | |
| Create event | `USER` | `ADMIN` | |
| Update event | `USER` | `ADMIN` | |
| Publish/close event | `USER` | `ADMIN` | |
| Delete event (draft only) | `USER` | `ADMIN` | |
| Create race | `USER` | `ADMIN` | |
| Update/delete race | `USER` | `ADMIN` | Only on draft events |
| Register for race | `USER` | — | Event must be `PUBLISHED` |
| Cancel own registration | `USER` | — | |
| View event registrations | `USER` | `MEMBER` | |
| Follow/unfollow | `USER` | — | |
| View followers/following | `USER` | — | |
| Manage any resource | `SUPER_ADMIN` | — | Overrides all org-level checks |

---

## API Endpoints (Phase 1)

All endpoints prefixed with `/api/v1`.

### Identity Context

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Blacklist current token |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update current user profile |
| GET | `/users/:id` | View any user's public profile |

### Organization Context

| Method | Path | Description |
|--------|------|-------------|
| POST | `/organizations` | Create org (caller becomes OWNER) |
| GET | `/organizations` | List orgs (public, paginated) |
| GET | `/organizations/:slug` | Get org by slug |
| PATCH | `/organizations/:id` | Update org |
| DELETE | `/organizations/:id` | Delete org (OWNER only) |
| POST | `/organizations/:id/members` | Add member |
| GET | `/organizations/:id/members` | List members |
| PATCH | `/organizations/:id/members/:userId` | Change member role |
| DELETE | `/organizations/:id/members/:userId` | Remove member |

### Event Context

| Method | Path | Description |
|--------|------|-------------|
| POST | `/organizations/:orgId/events` | Create event (nested under org) |
| GET | `/events` | List all published events (public, paginated, filterable) |
| GET | `/events/:slug` | Get event by slug |
| PATCH | `/events/:id` | Update event |
| PATCH | `/events/:id/status` | Change event status (publish/close/complete) |
| DELETE | `/events/:id` | Delete event (draft only) |
| POST | `/events/:eventId/races` | Create race |
| GET | `/events/:eventId/races` | List races for event |
| PATCH | `/races/:id` | Update race |
| DELETE | `/races/:id` | Delete race (draft event only) |
| POST | `/races/:raceId/registrations` | Register for race |
| GET | `/races/:raceId/registrations` | List registrations (org members) |
| GET | `/users/me/registrations` | List my registrations |
| DELETE | `/registrations/:id` | Cancel own registration |

### Social Context

| Method | Path | Description |
|--------|------|-------------|
| POST | `/follows` | Follow a target (body: targetId, targetType) |
| DELETE | `/follows/:id` | Unfollow |
| GET | `/users/:id/following` | List who a user follows |
| GET | `/users/:id/followers` | List user's followers |
| GET | `/organizations/:id/followers` | List org's followers |
| GET | `/events/:id/followers` | List event's followers |

---

## Pagination Strategy

**Cursor-based** for all list endpoints. Offset-based pagination breaks when data changes between pages (items shift). Cursor-based is stable and performs better at scale.

Request format:
```
GET /events?cursor=<opaque_cursor>&limit=20
```

Response format:
```json
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true,
    "limit": 20
  }
}
```

- `cursor` is a base64-encoded JSON object (typically `{ "id": <last_id> }`)
- `limit` defaults to 20, max 100
- First request omits `cursor` to get the first page
- Sorting: default by `createdAt DESC` (newest first). Events additionally support `startDate ASC` (upcoming first).

---

## Redis Key Schema

| Key Pattern | Value | TTL | Purpose |
|-------------|-------|-----|---------|
| `auth:blacklist:<jti>` | `1` | 15m (matches access token expiry) | Token revocation on logout |
| `auth:refresh:<userId>:<tokenId>` | `{ token, deviceInfo, createdAt }` | 7d | Refresh token storage. Supports multiple devices. |
| `ratelimit:<ip>:<endpoint>` | counter | 1m window | Rate limiting |

- `jti` = JWT ID, a unique identifier per access token
- On logout: blacklist the access token's `jti` and delete the refresh token entry
- On refresh: delete old refresh token, issue new one (rotation)
- Multiple devices: a user can have multiple refresh tokens (one per device/session)

---

## Security

### Password Hashing
- Algorithm: **bcrypt** with cost factor 12
- Why bcrypt over argon2: wider library support in Node.js, sufficient for RunHop's threat model. Argon2 is marginally better but adds a native dependency.

### Token Strategy
- **Access token**: JWT, 15-minute expiry, contains `{ sub: userId, role, jti }`
- **Refresh token**: opaque UUID, 7-day expiry, stored in Redis
- **Logout**: blacklist access token `jti` in Redis (TTL = remaining token life), delete refresh token from Redis
- **Token rotation**: every refresh request issues a new refresh token and invalidates the old one (prevents replay)

### Rate Limiting
- Login: 5 attempts per minute per IP
- Registration: 3 per hour per IP
- General API: 100 requests per minute per authenticated user
- Implemented via `@nestjs/throttler` backed by Redis

### HTTP Security
- **Helmet**: security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS**: whitelist frontend origin(s) only. No wildcard in production.
- **Validation**: all input validated via `class-validator` on DTOs. `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unknown fields and rejects unexpected ones.

### Prisma Boundary Discipline
Prisma uses a single `schema.prisma` with all models. Any module can technically query any table. The boundary rule (only access your own context's tables) is enforced by code review discipline. Architectural tests (e.g., ESLint rule or custom test asserting import patterns) are recommended for Phase 2+.

---

## Testing Strategy

### Unit Tests
- **What**: Services (business logic), guards, interceptors, utility functions
- **How**: Jest with mocked dependencies. `PrismaService` is mocked — unit tests never touch a database.
- **Location**: Co-located with source files (e.g., `auth.service.spec.ts` next to `auth.service.ts`)
- **Naming**: `*.spec.ts`

### E2E Tests
- **What**: Full API request/response cycles per context
- **How**: `@nestjs/testing` + `supertest`. Tests run against a real PostgreSQL + Redis via Docker Compose (`docker-compose.test.yml`).
- **Location**: `test/e2e/` directory, organized by context
- **Naming**: `*.e2e-spec.ts`
- **Database**: each test suite gets a fresh database (Prisma migrate + seed before suite, drop after)

### What Gets Tested
| Layer | Unit Test | E2E Test |
|-------|-----------|----------|
| Service business logic | Yes | — |
| Guard/decorator behavior | Yes | — |
| Full request → response | — | Yes |
| Auth flow (register/login/refresh/logout) | — | Yes |
| Permission enforcement | — | Yes |
| Validation (DTO rejection) | — | Yes |
| Database constraints (unique, FK) | — | Yes |

### CI Pipeline
- Run `lint` → `unit tests` → `e2e tests` on every PR
- E2E tests use Docker Compose to spin up Postgres + Redis
- Fail the pipeline on any test failure or lint error

---

## Observability

### Health Checks
- `GET /health` — returns `{ status: 'ok', uptime, version }`. Checks Postgres and Redis connectivity.
- Used as K8s liveness and readiness probe.

### Logging
- Structured JSON logs via NestJS built-in logger (or `pino` for performance in production)
- Log levels: `error`, `warn`, `log`, `debug`
- Every request logs: method, path, status code, response time, userId (if authenticated)
- No sensitive data in logs (passwords, tokens, PII)

---

## Entity Relationships

### Phase 1 Entities

**User**
- id (PK), email (unique), password (hashed), displayName, avatar, bio, role (enum: `USER`, `SUPER_ADMIN`), createdAt, updatedAt, deletedAt (nullable)

> **Design decision:** `ORG_ADMIN` is intentionally NOT a system-level role. Org-level permissions are derived exclusively from `OrgMembership.role`. This avoids state duplication — a user who is OWNER of Org A and MEMBER of Org B should not need a single system role to represent both.

**Organization**
- id (PK), name, slug (unique), description, logo, banner, createdAt, updatedAt, deletedAt (nullable)

**OrgMembership**
- id (PK), userId (FK → User), orgId (FK → Organization), role (enum: `OWNER`, `ADMIN`, `MEMBER`), joinedAt
- Unique constraint: (userId, orgId)

**Event**
- id (PK), orgId (FK → Organization), name, slug (unique), description, location, bannerImage, startDate, endDate, status (enum: `DRAFT`, `PUBLISHED`, `CLOSED`, `COMPLETED`), createdAt, updatedAt

**Race**
- id (PK), eventId (FK → Event), name, distance, unit, maxParticipants, price, currency, createdAt, updatedAt

**Registration**
- id (PK), userId (FK → User), raceId (FK → Race), status (enum: `PENDING`, `CONFIRMED`, `CANCELLED`), registeredAt
- Unique constraint: (userId, raceId)

**Follow**
- id (PK), followerId (FK → User), targetId, targetType (enum: `USER`, `ORGANIZATION`, `EVENT`), createdAt
- Unique constraint: (followerId, targetId, targetType)

### Phase 2+ Entities

**Post**
- id (PK), authorId, authorType (enum: `ORGANIZATION`, `EVENT`), content, images (JSON), createdAt, updatedAt

**Reaction**
- id (PK), postId (FK → Post), userId (FK → User), type (enum: `LIKE`, `COMMENT`), comment (nullable), createdAt

**Notification**
- id (PK), recipientId (FK → User), type (enum), payload (JSON), read (boolean), createdAt

**Payment** (Phase 3)
- id (PK), registrationId (FK → Registration), method (enum: `GCASH`, `MAYA`), amount, currency, status (enum: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `REFUNDED`), proofImage, createdAt, updatedAt

### Relationship Summary

| Relationship | Type |
|---|---|
| User → OrgMembership | 1:N |
| Organization → OrgMembership | 1:N |
| Organization → Event | 1:N |
| Event → Race | 1:N |
| Race → Registration | 1:N |
| User → Registration | 1:N |
| User → Follow | 1:N |
| Registration → Payment | 1:N (one registration, multiple payment attempts if rejected) |
| Post → Reaction | 1:N |

### Design Decisions

1. **Polymorphic Follow** (targetType + targetId): One table, one query pattern. Trade-off: no DB-level FK on targetId. Application-layer validation is sufficient at RunHop's scale.

2. **Polymorphic Post** (authorType + authorId): Posts authored by orgs or events. Unified system instead of separate tables.

3. **Notification JSON payload**: Extensible without schema migrations per notification type. The `type` enum tells the frontend how to render it.

4. **Payment as separate entity**: Payment has its own lifecycle independent of registration. Mixing them creates a messy state machine.

5. **Price stored as integer (cents)**: `price: 50000` means PHP 500.00. Avoids floating-point precision issues. Currency is per-event (all races in one event share currency), stored on Race for denormalization convenience.

6. **Soft delete on User and Organization**: These entities use `deletedAt` (nullable timestamp). Hard deletion would cascade-break registrations, follows, and memberships. Events and races use hard delete (only allowed in `DRAFT` status when no registrations exist).

### Database Indexes

Beyond primary keys and unique constraints, these indexes are required for core query performance:

| Table | Index | Query It Supports |
|-------|-------|-------------------|
| `OrgMembership` | `(userId)` | "List my organizations" |
| `OrgMembership` | `(orgId, role)` | "List org admins" |
| `Event` | `(orgId, status)` | "List published events for org" |
| `Event` | `(status, startDate)` | "List upcoming published events" |
| `Race` | `(eventId)` | "List races for event" |
| `Registration` | `(raceId, status)` | "Count confirmed registrations" (capacity check) |
| `Registration` | `(userId)` | "List my registrations" |
| `Follow` | `(followerId)` | "List who I follow" |
| `Follow` | `(targetType, targetId)` | "List followers of entity" |

---

## Folder Structure

```
runhop/
├── src/
│   ├── domain/
│   │   ├── identity/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── register.dto.ts
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── token-response.dto.ts
│   │   │   ├── user/
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-user.dto.ts
│   │   │   │       └── update-user.dto.ts
│   │   │   └── identity.module.ts
│   │   │
│   │   ├── organization/
│   │   │   ├── organization/
│   │   │   │   ├── organization.module.ts
│   │   │   │   ├── organization.controller.ts
│   │   │   │   ├── organization.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-organization.dto.ts
│   │   │   │       └── update-organization.dto.ts
│   │   │   ├── org-membership/
│   │   │   │   ├── org-membership.module.ts
│   │   │   │   ├── org-membership.controller.ts
│   │   │   │   ├── org-membership.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── add-member.dto.ts
│   │   │   │       └── update-role.dto.ts
│   │   │   └── organization-context.module.ts
│   │   │
│   │   ├── event/
│   │   │   ├── event/
│   │   │   │   ├── event.module.ts
│   │   │   │   ├── event.controller.ts
│   │   │   │   ├── event.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-event.dto.ts
│   │   │   │       └── update-event.dto.ts
│   │   │   ├── race/
│   │   │   │   ├── race.module.ts
│   │   │   │   ├── race.controller.ts
│   │   │   │   ├── race.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-race.dto.ts
│   │   │   │       └── update-race.dto.ts
│   │   │   ├── registration/
│   │   │   │   ├── registration.module.ts
│   │   │   │   ├── registration.controller.ts
│   │   │   │   ├── registration.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-registration.dto.ts
│   │   │   └── event-context.module.ts
│   │   │
│   │   └── social/
│   │       ├── follow/
│   │       │   ├── follow.module.ts
│   │       │   ├── follow.controller.ts
│   │       │   ├── follow.service.ts
│   │       │   └── dto/
│   │       │       └── create-follow.dto.ts
│   │       └── social-context.module.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   └── storage.service.ts
│   │   └── config/
│   │       ├── config.module.ts
│   │       └── env.validation.ts
│   │
│   ├── shared/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── types/
│   │   │   ├── enums.ts
│   │   │   └── interfaces.ts
│   │   └── shared.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── k8s/
│   ├── deployment.yml
│   ├── service.yml
│   └── configmap.yml
│
├── test/
│   ├── e2e/
│   └── unit/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── nest-cli.json
└── package.json
```

### Barrel Module Pattern

Each bounded context has a barrel module that wires up internals and exports only what other contexts may use:

```typescript
// identity.module.ts
@Module({
  imports: [AuthModule, UserModule],
  exports: [UserModule],  // AuthModule stays internal
})
export class IdentityModule {}
```

Consumers import `IdentityModule` — not `UserModule` directly. One point of control over what each context exposes.

---

## Infrastructure Decisions

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| Validation | `class-validator` + `class-transformer` | NestJS standard. DTOs with decorators, auto-validated via `ValidationPipe`. |
| Config | `@nestjs/config` + Zod | Env vars validated at startup. App won't boot with missing config. |
| Auth | `@nestjs/passport` + `passport-jwt` | Access token (15m) + refresh token (7d, stored in Redis). |
| Redis client | `ioredis` | Feature-rich. Token blacklisting, refresh tokens, rate limiting. BullMQ-compatible for Phase 4. |
| API response format | `{ data, meta }` wrapper | Transform interceptor. `meta` holds pagination when applicable. |
| Error format | `{ statusCode, message, error }` | Global exception filter. No stack traces in production. |
| API prefix | `/api/v1/` | Versioned from day one. |

---

## Phase Roadmap

| Phase | Scope | New Modules |
|-------|-------|-------------|
| **Phase 1 — MVP** | Auth, users, orgs, org membership, events, races, registration, follows | All Phase 1 modules above |
| **Phase 2 — Social** | Posts, reactions (likes/comments), feed, notifications | `social/post`, `social/reaction`, `social/feed`, `social/notification` |
| **Phase 3 — Payment** | GCash/Maya QR manual payment flow, payment verification | `event/payment` |
| **Phase 4 — Scale** | BullMQ queues, caching layer, K8s deployment, push notifications | `infrastructure/queue`, K8s manifests |
