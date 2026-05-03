# Project Map

This is the fastest way to understand what is already inside `apps/web`.

If you are coming from Flutter, think of this document as the equivalent of learning:

- where your route table lives
- where your stateful screen logic lives
- where your API service helpers live
- where your theme/layout styling lives

## Current Stack

- React 18
- Vite
- React Router DOM
- plain CSS
- browser `fetch`

That is a good stack for learning because the moving parts are still small.

## Current File Layout

```text
apps/web
├── docs/
├── public/
├── scripts/
├── src/
│   ├── auth.js
│   ├── main.jsx
│   └── styles.css
├── package.json
└── vite.config.js
```

## What Each File Currently Does

### `src/main.jsx`

This is doing most of the app work right now:

- app routing
- page rendering
- auth page behavior
- marketing page sections
- layout shell
- static content arrays

This is fine for an early app, but it is too much responsibility for one file long term.

As you grow the app, this file should gradually split into:

- route definitions
- page components
- shared layout components
- feature-specific modules

Flutter comparison:

- right now `src/main.jsx` is doing the job of multiple screens, shared widgets, and some service wiring all in one place
- that is workable early, but not a structure you want once the app starts growing

### `src/auth.js`

This file is your first API utility module.

It currently owns:

- API base URL selection
- `fetch` request wrapper for auth actions
- error message extraction
- session persistence in `localStorage`

This is a good start because backend calls are already separated from UI rendering.

Flutter comparison:

- this is closest to a lightweight service/helper file that sits between UI code and your backend

### `src/styles.css`

This is the global stylesheet for the current landing page and auth views.

Right now that is acceptable because the app is small.

As the app grows, keep the CSS organized by:

- global tokens and resets
- layout primitives
- section/component styles
- auth/product-specific areas when needed

Flutter comparison:

- CSS here plays the role that shared theme values, reusable styling patterns, and layout conventions often play in Flutter

## How To Read The Current App

Use this order:

1. open `src/main.jsx`
2. find `App()`
3. inspect the route tree
4. read `MarketingPage()`
5. read `AuthPage()`
6. read `src/auth.js`
7. inspect `src/styles.css`

That sequence helps you go from highest-level structure down into details.

## What The App Already Teaches You

Even before refactoring, this app already shows:

- client-side routing
- reusable layout composition
- conditional navigation
- controlled forms
- async submit handling
- API integration
- simple local persistence

That means you already have enough code here to learn real React patterns from actual usage.

The key shift is not "learn UI from zero."

The key shift is "learn how browser UI architecture expresses similar ideas differently."

## Recommended Next Structure

Do not over-split too early, but this is a good target shape:

```text
src/
├── app/
│   ├── router.jsx
│   └── layout/
├── components/
├── features/
│   ├── auth/
│   ├── marketing/
│   └── races/
├── lib/
│   ├── api/
│   └── storage/
├── pages/
└── styles/
```

The point of this structure is not fashion. The point is clearer ownership:

- `pages/` for route-level screens
- `features/` for related UI + logic
- `lib/` for infrastructure helpers
- `components/` for generic reusable building blocks

## A Safe Refactor Path

If you want to clean the current app without breaking momentum:

1. Move static arrays like `featuredRaces` into separate data files.
2. Extract `MarketingPage` into its own file.
3. Extract `AuthPage` into its own file.
4. Move `SiteFrame` into a shared layout file.
5. Create a dedicated `lib/api` area for request helpers.

That sequence keeps each change small and understandable.

## When To Create A New Component

Create a new component when at least one of these becomes true:

- the JSX block is hard to scan
- the same UI pattern is repeated
- one section has its own logic or state
- a route file is becoming too large

Do not extract components just because a block is visually big. Extract when it improves clarity.
