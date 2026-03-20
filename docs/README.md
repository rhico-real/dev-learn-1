# RunHop Documentation

> A social + event platform for races. Built with NestJS, TypeScript, PostgreSQL, Redis.

## What's in here

### Architecture
- **[System Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md)** — The blueprint. Bounded contexts, entity relationships, API endpoints, security, and infrastructure decisions.

### Implementation
- **[Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md)** — Step-by-step guide to building RunHop. 11 tasks from project scaffolding to full integration. Written for a Flutter developer learning NestJS.

### Learning Guides
- **[Database Concepts](guides/database-concepts.md)** — Relationships, indexes, transactions, ACID, soft deletes, N+1 — all explained with RunHop examples.
- **[System Design Concepts](guides/system-design-concepts.md)** — Modular monolith, REST API, auth, caching, scaling, CAP theorem — mapped to FAANG interview patterns.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Backend | NestJS (TypeScript, strict mode) |
| Database | PostgreSQL 16 |
| ORM | Prisma v6 |
| Cache | Redis 7 (ioredis) |
| Auth | JWT + Passport |
| Dev Environment | Docker Compose |
| Deployment Target | Kubernetes |

## Phase Roadmap

| Phase | What |
|-------|------|
| **Phase 1 (NOW)** | Auth, users, orgs, events, races, registration, follows |
| **Phase 2** | Posts, feed, likes, comments, notifications |
| **Phase 3** | GCash/Maya payment |
| **Phase 4** | BullMQ queues, caching, K8s deployment |
