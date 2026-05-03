# Frontend Architecture

This document explains how to think about the frontend architecture for `apps/web` as it exists now and as it grows.

## Current Stack

- React 18
- Vite
- React Router DOM
- plain CSS
- browser `fetch`

This is a deliberately simple stack. That is good for learning.

## Current Shape

Right now, most of the app lives in `src/main.jsx`.

That file currently owns:

- route definitions
- layout shell
- landing page sections
- auth page logic
- static marketing data

This is acceptable at the current size, but it should not stay that way forever.

## Architectural Goal

The frontend should be easy to change in three directions:

1. landing page and marketing work
2. authenticated product pages
3. API-driven features

That means the architecture needs to protect clarity in these areas:

- route structure
- UI composition
- feature ownership
- request boundaries
- styling organization

## Recommended Mental Model

Think in layers:

### Routes

Route-level screens decide which page the user is on.

Examples:

- `/`
- `/login`
- `/register`

### Layout

Shared shell components handle structure used across pages.

Example:

- `SiteFrame`

### Features

Features group related UI and behavior.

Examples:

- auth
- marketing
- races
- community

### Infrastructure

Infrastructure helpers handle technical concerns outside presentation.

Examples:

- API request helpers
- storage helpers
- env config

## Good Boundary Rules

### UI components should own:

- rendering
- local interaction state
- event handlers
- composition of smaller pieces

### API helpers should own:

- request URLs
- headers
- JSON parsing
- normalized error handling

### Backend should own:

- real business rules
- authorization
- persistence
- validation that must be trusted

## What To Split Next

The next safe structural improvements are:

1. extract route pages from `main.jsx`
2. move static section data into separate modules
3. move `SiteFrame` into shared layout code
4. move request helpers into `src/lib/api`

That is enough structure for the next stage without making the app feel overbuilt.

## Suggested Growth Structure

```text
src/
├── app/
│   └── router.jsx
├── components/
├── features/
│   ├── auth/
│   ├── marketing/
│   └── shared/
├── lib/
│   ├── api/
│   └── storage/
├── pages/
└── styles/
```

You do not need to create all of that immediately.

Use it as a direction, not a ceremony checklist.

## Marketing Surface Vs Product Surface

This app has two different frontend jobs:

1. public marketing and landing pages
2. authenticated product UI

Those should share brand foundations, but they should not be treated as the same UI problem.

Marketing usually optimizes for:

- narrative
- hierarchy
- conversion
- visual impact

Product UI usually optimizes for:

- task completion
- density
- navigation stability
- state visibility

That distinction should influence file structure, layout choices, and component reuse decisions.

## What Good Frontend Architecture Feels Like

When the architecture is healthy:

- route files are short
- shared helpers are obvious
- feature code lives near related feature code
- API calls are consistent
- adding a new page does not require touching unrelated areas

That is the standard to aim for here.
