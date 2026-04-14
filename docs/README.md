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
4. **Move into the current phase**
   - **[Phase 2 Social Design](superpowers/specs/2026-04-14-runhop-phase2-social-design.md)** — what Phase 2 is for, what it includes, and what it intentionally avoids.
   - **[Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md)** — the implementation path for posts, reactions, feed, and notifications.
5. **Use the learning guides when you get stuck**
   - Database concepts, system design concepts, DDD boundaries, and relationship diagrams are meant to support the phase plans.

## What's in here

### Architecture
- **[System Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md)** — The blueprint. Bounded contexts, entity relationships, API endpoints, security, and infrastructure decisions.
- **[Phase 2 Social Design](superpowers/specs/2026-04-14-runhop-phase2-social-design.md)** — The approved Phase 2 scope and boundaries for posts, reactions, feed, and notifications.

### Roadmap
- **[Roadmap Overview](guides/roadmap-overview.md)** — The whole picture. All 4 phases, what each phase adds, and how the project grows from MVP to scale.

### Implementation
- **[Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md)** — Step-by-step guide to building RunHop. 11 tasks from project scaffolding to full integration. Written for a Flutter developer learning NestJS.
- **[Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md)** — Next-step implementation guide for the social layer. More advanced than Phase 1, but still structured and teachable.

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
| **Phase 2 (CURRENT)** | Posts, feed, likes, comments, notifications |
| **Phase 3** | GCash/Maya payment |
| **Phase 4** | BullMQ queues, caching, K8s deployment |

## Plans By Phase

| Phase | Status | Main Docs |
|-------|--------|-----------|
| **Phase 1** | Complete | [Architecture Spec](superpowers/specs/2026-03-18-runhop-system-architecture-design.md), [Phase 1 MVP Plan](superpowers/plans/2026-03-18-runhop-phase1-mvp.md) |
| **Phase 2** | Ready to start | [Phase 2 Social Design](superpowers/specs/2026-04-14-runhop-phase2-social-design.md), [Phase 2 Social Plan](superpowers/plans/2026-04-14-runhop-phase2-social.md) |
| **Phase 3** | Planned | Architecture roadmap only |
| **Phase 4** | Planned | Architecture roadmap only |
