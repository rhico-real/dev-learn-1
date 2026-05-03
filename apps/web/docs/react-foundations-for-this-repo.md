# React Foundations For This Repo

This guide is for learning the React ideas that matter most for `apps/web`.

It is written for your actual setup:

- Vite
- React 18
- React Router
- a frontend that talks to your NestJS API

The goal is not to memorize React trivia. The goal is to map React to concepts you already know from Flutter so you can build confidently.

## Flutter To React Mental Map

Use this as the first translation layer:

| Flutter | React |
|--------|-------|
| `Widget` | component |
| `build()` output | JSX returned from the component |
| `setState()` | state setter from `useState` |
| constructor params / widget fields | props |
| `Navigator` | React Router |
| `Future` | `Promise` |
| `initState()` side-effect work | usually `useEffect` |
| `TextEditingController` style control | controlled input state |
| lifting state up | lifting state up |

This is not a perfect 1:1 mapping, but it is close enough to reduce friction.

## What React Is Doing

React is not "the whole frontend."

In this repo:

- **Vite** runs the dev server and builds the app
- **React** renders UI from state
- **React Router** decides which page component to show
- **`fetch`** talks to your backend
- **CSS** controls the look

So the mental split is:

- routing decides **where you are**
- state decides **what data the UI has**
- rendering decides **what the UI looks like right now**

If you come from Flutter, think of React as the UI/runtime layer for the browser, not the entire application architecture.

## The Core Loop

Most React code is this loop:

1. state changes
2. React re-renders
3. JSX is recalculated
4. the DOM updates

Example from your app:

```jsx
const [formState, setFormState] = useState({
  displayName: '',
  email: '',
  password: '',
});
```

When an input changes, `setFormState(...)` runs. That causes React to render again. The new `value` flows back into the form.

This is the basic pattern you will use everywhere.

Flutter comparison:

- in Flutter, state changes and `build()` runs again
- in React, state changes and the component function runs again

That is conceptually very close.

## JSX Is Just UI Description

This:

```jsx
<Route path="/login" element={<AuthPage mode="login" />} />
```

means:

- when the URL is `/login`
- render the `AuthPage`
- pass `mode="login"`

JSX looks like HTML, but it is really JavaScript syntax for describing UI trees.

Flutter comparison:

- Flutter uses nested widget constructors
- React uses nested JSX tags

Both are just structured UI descriptions.

## Components Are Functions

In this codebase, components are plain functions:

```jsx
function MarketingPage({ session = null }) {
  return <main>...</main>;
}
```

The rule to remember:

- props go in
- JSX comes out

If the component needs changing data over time, it uses state.

Flutter comparison:

- a React function component is closer to a small widget plus its render logic
- `props` are similar to widget constructor inputs

## Props Vs State

This distinction matters a lot.

### Props

Props are inputs from a parent component.

Example:

```jsx
<MarketingPage session={initialSession} />
```

`session` is a prop for `MarketingPage`.

### State

State is data owned by the component itself.

Example:

```jsx
const [status, setStatus] = useState({
  submitting: false,
  error: '',
});
```

Rule:

- if the parent owns it, it is a prop
- if the component owns it, it is state

Flutter comparison:

- props are like values passed into a widget
- state is like data held inside a `State<T>` object

## Event Handlers Change State

React does not mutate the DOM directly the way jQuery-style code would.

Instead, handlers update state:

```jsx
const handleChange = (event) => {
  const { name, value } = event.target;

  setFormState((current) => ({
    ...current,
    [name]: value,
  }));
};
```

This means:

- read input event
- calculate next state
- let React update the UI

That is the right default pattern.

Flutter comparison:

- instead of `onChanged: (value) { setState(() { ... }); }`
- you use `onChange={...}` and call a React state setter

## Lists Need Stable Keys

Your landing page already does this correctly:

```jsx
{featuredRaces.map((race) => (
  <article className="race-card" key={race.title}>
```

`key` helps React track list items between renders.

Rule:

- use a real stable id when possible
- do not use array index if the order can change

Flutter comparison:

- this is similar to caring about widget identity with keys in Flutter
- React also needs stable identity when rendering repeating UI

## Conditional Rendering

React uses normal JavaScript conditions inside JSX.

Example:

```jsx
{status.error ? <p className="auth-form__error">{status.error}</p> : null}
```

This means:

- if there is an error, show it
- otherwise render nothing

This is how you should think about loading states, auth states, empty states, and error states too.

Flutter comparison:

- same idea as using `if`, ternaries, or early returns in `build()`

## Side Effects

A side effect is something outside pure rendering:

- calling an API
- reading `localStorage`
- writing `localStorage`
- subscribing to browser events

In your current app:

- `loadSession()` reads from `localStorage`
- `saveSession()` writes to `localStorage`
- `login()` and `register()` call the backend

The important rule:

- rendering should describe UI
- effects should handle outside-world work

As the app grows, that usually means `useEffect` or event-driven async functions.

Flutter comparison:

- `useEffect` is not exactly `initState()`, but that is the closest first mental model
- both are used when you need to do work beyond pure rendering

## React Router In This App

You are using client-side routing:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<MarketingPage session={initialSession} />} />
    <Route path="/login" element={<AuthPage mode="login" ... />} />
    <Route path="/register" element={<AuthPage mode="register" ... />} />
  </Routes>
</BrowserRouter>
```

This means:

- the browser URL changes
- React Router chooses a component
- the page does not fully reload

When you want a new page in this app, the usual work is:

1. create a page component
2. add a `Route`
3. add navigation with `Link`

Flutter comparison:

- `Link` is conceptually like a declarative navigation trigger
- `<Route path="/login" ... />` is closer to defining route mappings than pushing a route imperatively every time

## Controlled Forms

Your auth form uses the standard React form pattern:

- input `value` comes from state
- `onChange` updates state
- `onSubmit` handles the request

That is called a controlled form.

This is the right default for serious app forms because it keeps the UI and data flow predictable.

Flutter comparison:

- if you are used to `TextEditingController`, React controlled inputs solve a similar coordination problem
- the main difference is that React usually treats state as the single source of truth for the field value

## The Main Things To Learn First

If you only focus on the highest-value topics, make it these:

1. components
2. props
3. state
4. event handlers
5. conditional rendering
6. list rendering
7. routing
8. API calls

That is enough to build a lot of useful frontend work.

If you already know Flutter well, the biggest new parts are usually:

- JSX syntax
- browser event handling
- hooks
- browser-based API and storage patterns

## What Not To Overcomplicate Yet

Do not rush into:

- global state libraries
- custom hook abstractions everywhere
- advanced memoization
- giant folder taxonomies
- premature component libraries

For this repo, the correct first step is:

- build clear pages
- keep state local when possible
- extract shared helpers only after repetition is real

## Practical Exercises

Use the real app while learning:

1. Change the copy and structure of the hero section.
2. Add a new "How It Works" section using mapped card data.
3. Add a `/about` route with `Link` navigation.
4. Add a loading message during login.
5. Add a success state after registration.
6. Move race data into a separate module.

If you can do those cleanly, your React basics are already becoming usable.
