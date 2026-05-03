# Study Plan

This is the practical path to get productive in React for this repo.

It assumes you are not new to building UI, only new to building it in React.

That matters because your job is not to relearn interface thinking from scratch. Your job is to remap it.

## Phase 1: Read The App Without Changing Architecture

Goal:

- understand the current code before trying to improve it

Tasks:

1. Read `src/main.jsx` from top to bottom.
2. Write down the route tree in your own words.
3. Identify which parts are props, state, and static content.
4. Read `src/auth.js` and explain how login works from button click to saved session.

If you cannot explain those clearly yet, do not jump into refactors.

Flutter framing:

- treat this like reading an unfamiliar screen tree before restructuring it

## Phase 2: Make Small Safe UI Changes

Goal:

- get comfortable editing React without fear

Tasks:

1. Change hero copy.
2. Add one new landing-page section.
3. Add one new CTA button.
4. Change the data for one card list.
5. Add one new route such as `/about`.

This phase matters because React gets easier once you see that most changes are just state, props, and JSX.

Flutter framing:

- this is the equivalent of getting comfortable editing widgets before redesigning app architecture

## Phase 3: Learn API Integration By Doing One Real Flow

Goal:

- stop thinking of frontend/backend integration as mysterious

Tasks:

1. Read [API Integration](./api-integration.md).
2. Trace `login()` and `register()` in `src/auth.js`.
3. Add one more API helper using the same pattern.
4. Render loading, success, and error states explicitly.

This is the part that will make you capable of building real product screens.

Flutter framing:

- same discipline as wiring a form screen to a backend service and handling async states cleanly

## Phase 4: Start Structuring For Growth

Goal:

- keep the frontend teachable as it expands

Tasks:

1. Move `AuthPage` into its own file.
2. Move `MarketingPage` into its own file.
3. Move section data arrays into separate modules.
4. Create a `lib/api` folder for request helpers.

At this point, you are not just learning React. You are learning how to keep a frontend from collapsing into one giant file.

Flutter framing:

- same idea as splitting a giant screen file into clearer screens, widgets, and services

## 7-Day Version

### Day 1

Read:

- [React Foundations For This Repo](./react-foundations-for-this-repo.md)
- [Project Map](./project-map.md)

Do:

- change landing page copy in one section

### Day 2

Read:

- [Architecture](./architecture.md)

Do:

- add a new route and navigate to it with `Link`

### Day 3

Read:

- [API Integration](./api-integration.md)

Do:

- trace the auth request flow end to end

### Day 4

Read:

- [Frontend Best Practices](./frontend-best-practices.md)

Do:

- extract one component from `main.jsx`

### Day 5

Read:

- [Surfaces](./surfaces.md)
- [Design System](./design-system.md)

Do:

- refine one landing section with clearer structure and hierarchy

### Day 6

Do:

- add one more frontend stateful interaction
- include loading and error handling

### Day 7

Do:

- refactor one area without changing behavior
- explain to yourself why the new structure is cleaner

## Translation Goal

By the end of this track, you should be able to say:

- "a component is just a widget in React terms"
- "hooks are the part I had to learn, not UI composition itself"
- "routing, forms, and API integration are different in syntax, not alien in architecture"

## The Standard To Aim For

You do not need to become a React expert first.

You need to become capable of doing these reliably:

- add a page
- add a component
- handle a form
- call an API
- manage local UI state
- keep files organized

Once those are comfortable, the rest of the frontend stack becomes much easier to absorb.
