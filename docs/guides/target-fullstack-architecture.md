# Target Full-Stack Architecture

This document describes the intended future structure of the RunHop repository after a web frontend is added. It is a planning document, not a description of current implementation.

## Target Direction

RunHop is planned to evolve into a full-stack repository with:

- the existing NestJS backend remaining as the primary API
- a separate web frontend application under `apps/web`
- a dedicated frontend documentation track under `apps/web/docs`

## Planned Repository Shape

The intended structure is:

```text
src/                  # existing NestJS backend
prisma/               # existing schema and migrations
docs/                 # backend, platform, architecture, and learning docs
apps/
  web/                # planned frontend application
    docs/             # planned frontend-specific docs
```

## Frontend Track

The planned frontend at `apps/web` is intended to cover two major surfaces:

1. **Marketing surface**
   - landing page
   - public-facing product messaging
   - future brand and conversion-focused pages
2. **Authenticated product surface**
   - application shell
   - dashboard flows
   - future user-facing product features

## Planned Frontend Stack

The current plan for the future frontend is:

- **App type**: single-page application
- **Framework**: React
- **Tooling**: Vite
- **Backend integration**: consume the existing NestJS API

## Documentation Split

The documentation split is intentional:

- `docs/`
  - current backend and platform documentation
  - architecture, setup, roadmap, and learning guides
- `apps/web/docs/`
  - frontend architecture
  - design system and themes
  - UX/UI direction
  - app-surface definitions
  - frontend API integration guidance

This keeps frontend design and implementation guidance separate from backend platform learning material.

## Integration Boundaries

The intended backend/frontend relationship is:

- NestJS remains the source of business logic and API endpoints
- the SPA authenticates against the backend and consumes those endpoints
- frontend docs define how web concerns should be organized without changing backend architecture by default

## Non-Goals For This Planning Stage

This planning document does not define:

- final component choices
- exact route names
- final state-management library decisions
- deployment topology for the frontend
- production CI/CD details

Those can be documented in the frontend track as implementation becomes real.
