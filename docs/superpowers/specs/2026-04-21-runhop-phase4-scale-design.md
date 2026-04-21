# RunHop Phase 4 — Production Maturity Design Spec

**Date:** 2026-04-21
**Phase:** 4 of 4
**Focus:** Queues, Caching, Push Notifications, Deployment

---

## What Phase 4 Is

Phase 4 does not add new domain features. It makes everything built in Phases 1–3 production-ready. You will learn how real backend systems handle async processing, high read volume, mobile delivery, and deployment to a container cluster.

This phase teaches:
- Async processing with queues
- Cache-aside strategy and invalidation
- Mobile push notification delivery via FCM
- Containerization and Kubernetes deployment

---

## The Four Pillars (in order)

| Step | Focus | What it touches |
|------|-------|----------------|
| 1 | Queues (BullMQ) | Notifications (Phase 2), payment events (Phase 3) |
| 2 | Caching (Redis) | Feed + event listings (Phase 1/2) |
| 3 | Push Notifications (FCM) | Notification queue (Step 1) |
| 4 | Deployment Maturity | Whole app |

All infrastructure lives under `src/infrastructure/`. Domain modules are not restructured — they only change how they emit side effects.

Redis is already defined in the architecture spec (`docker-compose` + `ioredis`). BullMQ runs on top of it.

---

## Step 1: Queues (BullMQ)

### Problem being solved

Right now, Phase 2 uses NestJS's in-process event emitter to create notifications. If it fails, the failure is silent. Phase 3's payment approval triggers registration confirmation synchronously. These side effects block the HTTP response and are not retried on failure.

### Solution

Replace in-process events with BullMQ queues. Side effects become **jobs** that are processed asynchronously by workers.

### Queues introduced

| Queue | Job | Triggered by |
|-------|-----|-------------|
| `notification-queue` | `notification.create` | Like, comment, follow, payment approval |
| `registration-queue` | `registration.confirm` | Payment approved |

### Structure

```
src/infrastructure/queue/
  queue.module.ts              ← registers BullMQ with Redis config
  queue.constants.ts           ← queue name enums
  processors/
    notification.processor.ts  ← consumes notification.create jobs
    registration.processor.ts  ← consumes registration.confirm jobs
```

### How it works

- Domain services call `Queue.add(jobName, payload)` instead of `EventEmitter2.emit()`
- Processors are `@Processor()` classes that define `@Process(jobName)` handlers
- Failed jobs are retried with exponential backoff (3 attempts by default)
- Permanently failed jobs move to a dead-letter queue for inspection

### What you learn

- Producer/consumer pattern
- Why async processing protects HTTP response time
- Job retries with backoff
- Dead-letter handling when a job fails permanently
- Why queues are more reliable than in-process events

---

## Step 2: Caching (Redis)

### Problem being solved

Feed assembly and event listings hit the database on every request. As users grow, these become the most expensive reads in the system. Most of the time the data hasn't changed since the last request.

### Solution

Cache-aside pattern: check Redis first → on miss, fetch from DB → write result to Redis with a TTL. On mutations, bust the relevant cache key.

### What gets cached

| Endpoint | TTL | Invalidated when |
|----------|-----|-----------------|
| `GET /feed` | 30s | User creates or deletes a post |
| `GET /events` (listing) | 5 min | Event is created, updated, or deleted |
| `GET /events/:id/races` | 10 min | Race is created, updated, or deleted |

### Structure

```
src/infrastructure/cache/
  cache.module.ts      ← registers ioredis client as a provider
  cache.service.ts     ← get / set / del with key builder helper
  cache.constants.ts   ← TTL values, key prefix constants
```

### How it works

- Service calls `CacheService.get(key)` before the DB query
- On a cache miss: run DB query, then call `CacheService.set(key, data, ttl)`
- On mutations (create/update/delete): call `CacheService.del(key)` after the DB write

### Cache key format

```
runhop:<resource>:<identifier>
runhop:feed:<userId>
runhop:events:list
runhop:events:<eventId>:races
```

### What you learn

- Cache-aside vs write-through (and why you chose cache-aside here)
- How to pick TTLs — short for user-specific reads, longer for shared reads
- Why stale data is sometimes acceptable (feed at 30s is fine; payment state is not cacheable)
- Why forgetting invalidation causes bugs that are hard to reproduce

---

## Step 3: Push Notifications (FCM + in-app)

### Problem being solved

Phase 2 writes `Notification` records to the DB. Users only see them when they open the app and poll the API. Real apps deliver notifications to the device immediately.

### Solution

Extend the notification queue worker (Step 1) to also send a Firebase Cloud Messaging push after writing the DB record. The Flutter app registers its FCM token with the backend on login.

### New database model

```
DeviceToken
  id         String   @id @default(cuid())
  userId     String
  token      String   ← FCM registration token from the Flutter app
  platform   Platform ← IOS | ANDROID
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, token])
```

### New endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users/me/device-token` | Register FCM token after login |
| `DELETE` | `/users/me/device-token` | Remove token on logout |

### Delivery flow

```
Event occurs (like / follow / comment / payment approved)
  → NotificationService writes Notification record (in-app)
  → Queue.add('notification.create', { userId, type, payload })
  → notification.processor picks up job
  → fetches user's DeviceToken(s) from DB
  → calls FCM API with title + body + data payload
  → on FCM error: retry up to 3 times, then log to dead-letter
```

### FCM payload structure

```json
{
  "notification": {
    "title": "RunHop",
    "body": "Someone liked your post"
  },
  "data": {
    "type": "POST_LIKE",
    "referenceId": "<postId>"
  }
}
```

The `data` field lets the Flutter app deep-link to the relevant screen.

### What you learn

- FCM token lifecycle — tokens expire and must be refreshed
- Why you store tokens per device, not per user (one user, multiple devices)
- How queues protect FCM failures from affecting the main request
- The difference between in-app notifications (DB record) and push notifications (device delivery)
- Why push is best-effort — you never guarantee delivery, you only guarantee the attempt

---

## Step 4: Deployment Maturity

### Problem being solved

The app runs locally via `npm run start:dev`. It can't be deployed to a server without manual setup on every machine. Configuration is scattered. There's no way for a load balancer to know if the app is healthy.

### Solution

Package the app in Docker with a multi-stage build, define a Kubernetes deployment, and add a health check endpoint.

### 1. Dockerfile (multi-stage)

```
Stage 1 — builder
  FROM node:20-alpine
  Install all dependencies
  Compile TypeScript → dist/

Stage 2 — runner
  FROM node:20-alpine
  Copy dist/ and package.json only
  Install production dependencies only
  Run node dist/main.js
```

Multi-stage keeps the final image small — no TypeScript compiler, no devDependencies.

### 2. Docker Compose update

Add the NestJS app as a service. `docker compose up` starts Postgres, Redis, and the app together. Useful for integration testing and onboarding new developers.

### 3. Health check endpoint

```
GET /health

Response:
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

Returns `200` when healthy, `503` when any dependency is down. Kubernetes uses this for readiness and liveness probes.

### 4. Kubernetes manifests

```
k8s/
  deployment.yaml    ← app container, replica count, resource limits
  service.yaml       ← exposes app inside the cluster (ClusterIP)
  configmap.yaml     ← non-secret env vars (DB_HOST, REDIS_HOST, PORT)
  secret.yaml        ← sensitive env vars (DB_PASSWORD, JWT_SECRET, FCM_KEY)
```

### 5. Environment variable discipline

All configuration is read from environment variables. No hardcoded values in source code. A `.env.example` file documents every required variable with a description and example value.

### What you learn

- Multi-stage Docker builds and why image size matters in production
- Kubernetes primitives: Pod, Deployment, Service
- Readiness vs liveness probes (readiness = "can I receive traffic?", liveness = "am I still running?")
- ConfigMap vs Secret — what goes where and why
- Why `.env.example` is version-controlled but `.env` is not

---

## Data Model Changes Summary

| Model | Change | Step |
|-------|--------|------|
| `DeviceToken` | New model | Step 3 |
| Existing models | No changes | — |

---

## What Phase 4 Is Not

- No new domain features (no new race types, no refunds, no analytics)
- No redesign of existing module boundaries
- No change to the payment state machine
- No GraphQL or WebSocket layer

These may come in a future phase if the project grows.

---

## Learning Outcomes Summary

After Phase 4 you will understand:

1. Why synchronous side effects break at scale and how queues fix them
2. How to cache reads safely without serving stale data at the wrong time
3. How mobile push notification delivery actually works end-to-end
4. How to containerize a NestJS app and deploy it to Kubernetes
5. How production systems manage configuration, health, and dependencies

---

## Relationship to the Full Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Platform core | Complete |
| Phase 2 | Social layer | Complete |
| Phase 3 | Payments | In progress |
| Phase 4 | Production maturity | Planning |
