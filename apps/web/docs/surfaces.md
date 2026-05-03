# Frontend Surfaces

The planned `apps/web` frontend is expected to serve two distinct surfaces.

## 1. Marketing Surface

This is the public-facing side of the product.

Expected purpose:

- communicate what RunHop is
- present brand, positioning, and value
- support future landing and acquisition pages

Expected characteristics:

- public routes
- narrative and conversion-oriented layout
- strong visual identity
- content and CTA-focused structure

## 2. Authenticated Product Surface

This is the application side of RunHop for signed-in users.

Expected purpose:

- give users access to product workflows
- host future dashboard and app-shell experiences
- provide feature entry points for domain flows

Expected characteristics:

- authenticated routes
- persistent app shell patterns
- data-driven screens
- task-oriented interface design

## Why The Split Matters

The marketing surface and the product surface should not be treated as the same kind of UI.

They differ in:

- layout rhythm
- information density
- interaction patterns
- navigation expectations
- visual priorities

This split should guide future route planning, component reuse decisions, and design-system boundaries.
