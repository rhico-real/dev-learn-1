# Frontend Best Practices

This is the practical ruleset for this frontend.

These are not universal React laws. These are the defaults that fit this repo.

## 1. Keep Backend Truth In The Backend

The frontend should never become the home of:

- authorization rules
- business invariants
- pricing logic
- race registration rules
- validation you only trust in the browser

The frontend can help users with UX, but the backend remains the source of truth.

## 2. Keep State As Local As Possible

Default to local component state first.

Use broader shared state only when data truly needs to be shared across distant parts of the UI.

Good local state examples:

- form inputs
- modal open/close
- tab selection
- submit status
- local filter controls

Do not introduce a global store just because the app is growing.

## 3. Separate UI From Request Helpers

UI components should not contain raw repetitive `fetch` wiring everywhere.

Instead:

- keep request details in small helper modules
- keep components focused on user interaction and rendering

Your current `src/auth.js` is the right instinct.

## 4. Design Loading, Error, And Empty States On Purpose

Do not treat these as cleanup work.

For every screen that depends on data, ask:

- what shows while waiting?
- what shows if the backend fails?
- what shows if the result is empty?

That is part of the feature, not extra polish.

## 5. Prefer Simple Data Flow

Pass props downward.

Lift state upward only when multiple children truly need the same owner.

If state feels confusing, the usual problem is one of these:

- ownership is unclear
- the component is doing too much
- logic needs to be extracted

## 6. Keep Route Files Focused

Route-level components should explain the page, not contain every implementation detail.

Good route component responsibilities:

- compose sections
- load page-level data
- connect feature modules

Less good responsibilities:

- dozens of unrelated helpers
- large inline datasets
- repeated fetch boilerplate

## 7. Use `useEffect` Carefully

Do not use `useEffect` as a reflex.

Use it when you are synchronizing with something outside rendering, such as:

- fetching on page load
- subscribing to browser events
- syncing state to storage

Do not use it for logic that can happen:

- during render
- in an event handler
- from derived values

## 8. Be Careful With `useMemo` And `useCallback`

These are optimization tools, not cleanup tools.

Do not add them by default.

Use them only if:

- you measured a real problem
- a child memoization boundary actually depends on stable references
- a computation is genuinely expensive

Most early React code gets worse, not better, when these are added automatically.

## 9. Keep API Boundaries Predictable

Standardize these things early:

- base URL access
- headers
- auth token handling
- error shape normalization
- response parsing

If every feature invents its own request style, the frontend becomes inconsistent fast.

## 10. Organize By Responsibility, Not By File Type Alone

Avoid giant buckets that become dumping grounds.

This is weak:

```text
components/
hooks/
utils/
```

This is usually stronger:

```text
features/auth/
features/races/
features/community/
lib/api/
pages/
```

Reason:

feature grouping makes ownership clearer when the app grows.

## 11. Keep Presentational Reuse Honest

Do not make something "reusable" before you understand the variations.

It is usually better to duplicate a small UI block once and learn the pattern than to create an over-abstract component too early.

Extract after repetition becomes clear.

## 12. Treat CSS As Architecture Too

Frontend quality is not only React quality.

You also need:

- consistent spacing
- clear typography hierarchy
- controlled color roles
- responsive behavior
- sensible naming

If CSS gets messy, the product gets harder to change even if the React is good.

## 13. Use Environment Variables For Environment-Specific Config

This app already uses:

```js
import.meta.env.VITE_API_BASE_URL
```

That is correct.

Use Vite env vars for:

- API base URL
- app-level feature switches when needed
- environment-specific frontend config

Do not hardcode deployment-specific URLs into components.

## 14. Keep The Learning Focused

For this repo, the highest-value frontend skills are:

1. building pages from components
2. handling forms
3. integrating APIs
4. managing local UI state
5. structuring files cleanly
6. keeping UX states explicit

That is enough to build serious product work before you worry about more advanced patterns.
