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
| `event` | Event CRUD (name, description, date, location, banner, status). An event belongs to an org. Manages event lifecycle: `DRAFT` → `PUBLISHED` → `CLOSED` → `COMPLETED`. |
| `race` | Race CRUD within an event. A race is a specific category (5K, 10K, 21K) with its own distance, capacity, price tiers. |
| `registration` | User registers for a specific race. Tracks registration status: `PENDING` → `CONFIRMED` → `CANCELLED`. Phase 3 adds payment linkage. |

**Why grouped:** Event, race, and registration form a tight transactional cluster. They share validation rules (can't register for an unpublished event, can't exceed race capacity).

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
              ▼            ▼            ▼
     ┌────────────┐  ┌──────────┐  ┌────────┐
     │Organization│  │  Social  │  │  Event  │
     │            │  │ (follow) │  │         │
     └─────┬──────┘  └──────────┘  └────┬────┘
           │                            │
           └────────────────────────────┘
                 Event depends on Org
```

**Rules:**
- Dependencies flow one way (downward)
- **Identity** is depended on by everyone but depends on nothing
- **Organization** depends on Identity only
- **Event** depends on Identity + Organization
- **Social** depends on Identity only (uses IDs for targets, not full entity imports)
- **No circular dependencies**

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

## Entity Relationships

### Phase 1 Entities

**User**
- id (PK), email (unique), password (hashed), displayName, avatar, bio, role (enum: `USER`, `ORG_ADMIN`, `SUPER_ADMIN`), createdAt, updatedAt

**Organization**
- id (PK), name, slug (unique), description, logo, banner, createdAt, updatedAt

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
| Registration → Payment | 1:1 |
| Post → Reaction | 1:N |

### Design Decisions

1. **Polymorphic Follow** (targetType + targetId): One table, one query pattern. Trade-off: no DB-level FK on targetId. Application-layer validation is sufficient at RunHop's scale.

2. **Polymorphic Post** (authorType + authorId): Posts authored by orgs or events. Unified system instead of separate tables.

3. **Notification JSON payload**: Extensible without schema migrations per notification type. The `type` enum tells the frontend how to render it.

4. **Payment as separate entity**: Payment has its own lifecycle independent of registration. Mixing them creates a messy state machine.

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
