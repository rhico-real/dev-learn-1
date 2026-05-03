# Frontend Architecture

This document describes the planned architecture for the future `apps/web` frontend.

## Planned Stack

- **Framework**: React
- **Build tool**: Vite
- **Application type**: SPA
- **Backend**: existing NestJS API in this repository

## App Position In The Repo

The frontend is planned to live in:

```text
apps/web
```

This keeps the repository ready for a multi-application structure while preserving the current backend-first layout.

## Architecture Goals

The frontend should be designed to:

- stay clearly separated from backend implementation concerns
- consume backend APIs cleanly
- support both public and authenticated surfaces
- keep UI rules and design documentation local to the frontend track

## Planned Boundaries

The frontend should own:

- client-side routing
- page composition
- user interface state
- visual system and interaction patterns
- API request handling on the client side

The backend should continue to own:

- business logic
- persistence
- authorization rules
- domain workflows
- data integrity

## Documentation Ownership

When frontend implementation starts, architecture changes should be documented here before or alongside code changes that materially affect:

- routing structure
- app shell structure
- shared UI foundations
- environment configuration shape
- API integration conventions
