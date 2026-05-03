# Frontend API Integration

This document describes the intended integration boundary between the future `apps/web` SPA and the existing NestJS backend.

## Source Of Truth

The NestJS backend remains the source of truth for:

- business rules
- domain workflows
- authentication decisions
- persisted data

The frontend should consume those capabilities through HTTP APIs rather than duplicating backend logic in the client.

## Planned Integration Responsibilities

The frontend is expected to handle:

- request initiation
- loading states
- empty states
- error states
- session-aware navigation
- presentation of backend data

The backend is expected to handle:

- validation
- authorization
- persistence
- domain invariants
- secure token issuance and verification

## Areas To Document Further During Implementation

When the frontend starts, this document should be extended with:

- API base URL strategy
- environment-variable expectations
- token storage and session rules
- request wrapper conventions
- error-shape handling
- retry policy
- file-upload handling if needed

## Current Status

This is a planning document only.

It intentionally avoids locking implementation details that are better decided once the frontend codebase exists.
