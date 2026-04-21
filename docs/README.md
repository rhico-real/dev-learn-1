# RunHop Documentation

> A social + event platform for races. Built with NestJS, TypeScript, PostgreSQL, Redis.

## Getting Started

If you're building RunHop in order, start with the whole roadmap first, then move into the current phase.

1. **See the full picture**
   - **[Roadmap Overview](guides/roadmap-overview.md)** — the complete project progression across all 4 phases, what each phase adds, and what each phase is meant to teach.
2. **Read the architecture**
   - **[System Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md)** — the blueprint for bounded contexts, entities, APIs, and infrastructure decisions.
3. **Understand what is already done**
   - **[Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md)** — auth, users, organizations, events, races, registrations, and follows.
   - **[Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md)** — posts, reactions, feed, and notifications.
4. **Move into the current phase**
   - **[Phase 3 Payments Design](superpowers/specs/2026-04-16-runhop-phase3-payments-design.md)** — what Phase 3 is for, what it includes, and what it intentionally avoids.
   - **[Phase 3 Payments Plan](superpowers/plans/2026-04-16-runhop-phase3-payments.md)** — the implementation path for manual payment verification tied to race registration.
5. **Use the learning guides when you get stuck**
   - Database concepts, system design concepts, DDD boundaries, and relationship diagrams are meant to support the phase plans.

## What's in here

### Architecture
- **[System Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md)** — The blueprint. Bounded contexts, entity relationships, API endpoints, security, and infrastructure decisions.
- **[Phase 3 Payments Design](superpowers/specs/2026-04-16-runhop-phase3-payments-design.md)** — The approved Phase 3 scope for manual payment verification tied to race registration.
- **[Phase 4 Scale Design](superpowers/specs/2026-04-21-runhop-phase4-scale-design.md)** — The approved Phase 4 scope for queues, caching, push notifications, and deployment.

### Roadmap
- **[Roadmap Overview](guides/roadmap-overview.md)** — The whole picture. All 4 phases, what each phase adds, and how the project grows from MVP to scale.

### Implementation
- **[Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md)** — Step-by-step guide to building RunHop. 11 tasks from project scaffolding to full integration. Written for a Flutter developer learning NestJS.
- **[Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md)** — Implementation guide for the social layer. Posts, reactions, feed, and notifications.
- **[Phase 3 Payments Plan](superpowers/plans/2026-04-16-runhop-phase3-payments.md)** — Implementation guide for the manual payment flow tied to race registration.

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
| **Phase 1** | Auth, users, orgs, events, races, registration, follows |
| **Phase 2** | Posts, feed, likes, comments, notifications |
| **Phase 3 (CURRENT)** | Manual payment verification for race registration |
| **Phase 4** | BullMQ queues, Redis caching, FCM push notifications, K8s deployment |

## Plans By Phase

| Phase | Status | Main Docs |
|-------|--------|-----------|
| **Phase 1** | Complete | [Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md), [Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md) |
| **Phase 2** | Complete | [Phase 2 Social Design](superpowers/specs/2026-04-14-runhop-phase2-social-design.md), [Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md) |
| **Phase 3** | In progress | [Phase 3 Payments Design](superpowers/specs/2026-04-16-runhop-phase3-payments-design.md), [Phase 3 Payments Plan](superpowers/plans/2026-04-16-runhop-phase3-payments.md) |
| **Phase 4** | Planning | [Phase 4 Scale Design](superpowers/specs/2026-04-21-runhop-phase4-scale-design.md) |
