# RunHop Roadmap Overview

This is the full picture for RunHop as it is currently defined in the architecture.

## How Many Phases?

There are **4 phases** in the current roadmap.

| Phase | Focus | Main Outcome |
|-------|-------|--------------|
| **Phase 1** | Core platform | Users, organizations, events, races, registrations, follows |
| **Phase 2** | Social layer | Posts, likes, comments, feed, notifications |
| **Phase 3** | Payments | Manual payment flow for race registration |
| **Phase 4** | Scale | Queues, caching, deployment maturity, push notifications |

## The Big Picture

RunHop is not just an event system and not just a social app. It is both:

- a platform where organizations can create race events
- a system where users can register for races
- a social product where users can follow activity and interact with content
- a production-minded backend that later grows into payments and scale infrastructure

That means the roadmap is intentionally layered:

1. **Phase 1 gives you the domain foundation**
   - identity
   - organizations
   - events
   - races
   - registrations
   - follows
2. **Phase 2 makes the product feel alive**
   - posts
   - likes
   - comments
   - feed
   - notifications
3. **Phase 3 makes the event business usable**
   - payment submission
   - payment verification
   - linking payment state to registration flow
4. **Phase 4 makes the system more production-ready**
   - queues
   - caching
   - push notifications
   - stronger deployment and scaling setup

## What Each Phase Is Teaching You

### Phase 1: Backend Foundations

This phase teaches:

- NestJS module structure
- DTO validation
- auth and guards
- service boundaries
- Prisma schema design
- basic pagination
- cross-context validation in a modular monolith

### Phase 2: Read Models And Social Interactions

This phase teaches:

- content modeling
- uniqueness constraints
- feed assembly
- cursor pagination in more realistic read flows
- side effects through events
- separating write models from read models

### Phase 3: Transactional Business Flows

This phase teaches:

- payment lifecycle design
- status transitions
- stronger consistency thinking
- admin review flows
- how registration and payment interact safely

### Phase 4: Production Maturity

This phase teaches:

- async processing
- queue-based side effects
- caching strategy
- deployment concerns
- scaling tradeoffs

## Current State

Right now, your docs status looks like this:

| Phase | Status | Docs |
|-------|--------|------|
| **Phase 1** | Complete | [Phase 1 MVP Plan](../superpowers/plans/2026-03-18-runhop-phase1-mvp.md) |
| **Phase 2** | Complete | [Phase 2 Social Design](../superpowers/specs/2026-04-14-runhop-phase2-social-design.md), [Phase 2 Social Plan](../superpowers/plans/2026-04-14-runhop-phase2-social.md) |
| **Phase 3** | Ready to build | [Phase 3 Payments Design](../superpowers/specs/2026-04-16-runhop-phase3-payments-design.md), [Phase 3 Payments Plan](../superpowers/plans/2026-04-16-runhop-phase3-payments.md) |
| **Phase 4** | Planning | [Phase 4 Scale Design](../superpowers/specs/2026-04-21-runhop-phase4-scale-design.md) |

## Recommended Reading Order

If you want to understand the whole system before building more:

1. [System Architecture Spec](../superpowers/specs/2026-03-18-runhop-system-architecture-design.md)
2. [This Roadmap Overview](roadmap-overview.md)
3. [Phase 1 MVP Plan](../superpowers/plans/2026-03-18-runhop-phase1-mvp.md)
4. [Phase 2 Social Design](../superpowers/specs/2026-04-14-runhop-phase2-social-design.md)
5. [Phase 2 Social Plan](../superpowers/plans/2026-04-14-runhop-phase2-social.md)
6. [Phase 3 Payments Design](../superpowers/specs/2026-04-16-runhop-phase3-payments-design.md)
7. [Phase 3 Payments Plan](../superpowers/plans/2026-04-16-runhop-phase3-payments.md)

## Important Note

The roadmap can evolve later, but as of now the project has **4 planned phases**. Phase 3 is the current next phase, not the entire roadmap.
