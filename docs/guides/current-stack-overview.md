# Current Stack Overview

This document describes the repository as it exists today, not the future target state.

## What Exists Today

RunHop is currently a backend-first codebase with supporting documentation and a custom docs UI.

The implemented stack in this repository is:

- **Backend framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma v6
- **Cache / queue backing service**: Redis 7
- **Authentication**: JWT + Passport
- **Background processing**: BullMQ
- **Push notifications**: Firebase Admin / FCM
- **Local environment**: Docker Compose
- **Testing**: Jest for unit and e2e coverage

## Current Repository Shape

Today the repo is organized primarily around the backend application and the documentation set.

Main areas:

- `src/`
  - NestJS application code
  - bounded contexts for identity, organization, event, and social features
- `prisma/`
  - schema, migrations, and seed data
- `test/`
  - e2e coverage
- `docs/`
  - project, roadmap, architecture, and learning documentation
- `docs/v2/`
  - a custom static docs UI built with HTML, CSS, and JavaScript

## Current Docs Surfaces

There are two docs-related surfaces already present:

1. `docs/`
   - the markdown source of truth for project docs
2. `docs/v2/`
   - a custom reader UI that renders the markdown docs

These docs are primarily backend and platform oriented.

## What Does Not Exist Yet

The following are planned but not implemented in this repository yet:

- a dedicated frontend application under `apps/web`
- a production product UI for end users
- a dedicated marketing website
- a frontend component system implemented in code
- a frontend build pipeline separate from the NestJS backend

## Why This Distinction Matters

The repository is transitioning from:

- **current state**: backend-first platform with internal docs

to

- **target state**: full-stack product with a separate web frontend and a dedicated frontend docs track

Future planning documents should clearly label whether they describe:

- what exists now
- what is intended later
