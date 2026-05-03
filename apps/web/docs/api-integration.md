# API Integration

This document explains how the React frontend should talk to the NestJS backend.

The main principle is simple:

- the frontend requests and presents
- the backend decides and guarantees

Flutter comparison:

- this should feel familiar if you previously kept domain rules on the backend and used Flutter mainly for presentation and request orchestration

## Current Pattern In This App

Your current auth integration lives in `src/auth.js`.

It already shows a sound basic pattern:

1. read a base URL from `import.meta.env`
2. build a small request helper
3. parse JSON carefully
4. normalize backend errors into a user-facing message
5. keep session persistence separate from components

That is the right direction.

If you are coming from Flutter, think of `src/auth.js` as the early version of an API service layer.

## Current Base URL Strategy

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
```

This means:

- local and deployed environments can point to different backends
- components do not need hardcoded URLs
- Vite env vars control environment-specific config

Use this pattern consistently.

Flutter comparison:

- same idea as keeping environment-specific base URLs out of widgets and inside configuration

## What Components Should Not Do

Avoid putting this kind of code directly in many UI components:

```js
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

Why that is bad:

- URL logic gets duplicated
- error handling becomes inconsistent
- auth headers eventually get messy
- testing and refactoring get harder

## Better Default Pattern

Split the frontend into these responsibilities:

### API module

Owns:

- endpoint path
- request config
- response parsing
- error normalization

### Component

Owns:

- form state
- button state
- loading UI
- error UI
- success UI

That keeps the code teachable.

Flutter comparison:

- UI layer handles interaction and rendering
- helper/service layer handles request mechanics

That separation is still the right instinct here.

## Current Auth Flow

The login/register flow currently works like this:

1. user types into a controlled form
2. `handleSubmit` builds a payload
3. component calls `login(payload)` or `register(payload)`
4. request helper calls the backend
5. backend returns JSON
6. session is saved into `localStorage`
7. user is redirected

That is a clean beginner-to-intermediate flow.

From a Flutter perspective, it is very similar to:

1. form state lives in the screen
2. submit handler calls a service
3. response is processed
4. local session state is persisted
5. navigation happens after success

## Error Handling Rule

Every API-backed UI should deliberately handle:

- loading
- error
- success
- empty

Your auth form already handles loading and error. Keep applying that standard to future screens.

## Where To Put Future Request Code

As the app grows, prefer something like:

```text
src/
└── lib/
    └── api/
        ├── client.js
        ├── auth.js
        ├── races.js
        └── community.js
```

Possible responsibilities:

- `client.js` for shared request behavior
- feature files for endpoint-specific helpers

## Example Direction

You do not need this exact code now, but this is the direction to grow toward:

```js
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'Request failed'
    );
  }

  return data;
}
```

Then feature helpers become small:

```js
export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

## Session Handling Guidance

Right now you store session data in `localStorage`.

That is acceptable for learning and for the current stage, but be disciplined about ownership:

- storage helpers manage reading and writing
- components do not hand-roll storage logic repeatedly

As auth becomes more serious, you will also need to think through:

- token refresh
- logout clearing
- route protection
- session expiry behavior

## Best Practices For This Repo

1. Keep one consistent base request pattern.
2. Keep backend-specific details out of presentational components.
3. Normalize backend errors before they hit the UI.
4. Use env vars for base URL configuration.
5. Add loading, error, and empty states intentionally.
6. Keep backend rules in NestJS, not in React.

## Practical Exercises

1. Extract the shared request logic from `src/auth.js` into `src/lib/api/client.js`.
2. Keep auth-specific functions in `src/lib/api/auth.js`.
3. Add one new API helper for a public race list endpoint.
4. Render loading, success, error, and empty states in the consuming component.

If you can do those cleanly, your frontend/backend integration skills are moving in the right direction.
