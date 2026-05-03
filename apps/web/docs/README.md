# RunHop Web Docs

This is the frontend learning track for `apps/web`.

It is written for your situation specifically:

- you already know Flutter
- you are learning React so you can ship frontend work on your own
- you need patterns that fit this repo, not generic tutorial code

The goal is to get you comfortable enough to:

- change the landing page without hesitation
- add new sections and routes cleanly
- integrate the NestJS API from the frontend
- avoid frontend structure that turns into a mess later

## What This Track Is Optimized For

This docs track is biased toward Flutter comparison because that is your fastest path.

So instead of teaching React like you are new to UI development, it tries to translate:

- `Widget` thinking into component thinking
- `setState` thinking into hook/state thinking
- `Navigator` thinking into React Router thinking
- `Future`/async workflow into frontend API workflow

## Best Reading Order

1. [React Foundations For This Repo](./react-foundations-for-this-repo.md)
2. [Project Map](./project-map.md)
3. [Architecture](./architecture.md)
4. [API Integration](./api-integration.md)
5. [Frontend Best Practices](./frontend-best-practices.md)
6. [Study Plan](./study-plan.md)
7. Supporting references:
   - [Surfaces](./surfaces.md)
   - [Design System](./design-system.md)

## How To Use This Properly

Read one document, then touch the real app immediately.

For example:

- after foundations, edit one React section
- after routing, add one new route
- after API integration, connect one endpoint
- after architecture, extract one component

That is much better than reading everything first.

## Run Locally

From `apps/web`:

```bash
npm run docs
```

That serves this `docs/` folder locally on port `5556`.
