# Organizer Events Flow

This update makes events the parent object before races.

## What changed

- The organizer entry point now opens the events surface first.
- The first organizer tile is always `Add event`.
- Events save with `name`, `description`, `location`, `banner image`, `start date`, and `end date`.
- Each saved event opens a detail page where multiple races can be added.
- The race authoring page now saves races into the selected event instead of behaving like a standalone flow.

## Routes

- `/organizer/events`
- `/organizer/events/new`
- `/organizer/events/:eventId`
- `/organizer/events/:eventId/races/new`

## Local storage

- Events are stored under `runhop.organizer-events`.
- Each event stores its race list locally until the backend replaces it.

## Theme

- The UI follows the Ferrari theme already defined in `apps/web/Ferrari-theme.md`.
- The organizer flow keeps the same dark canvas, sharp geometry, and restrained Rosso Corsa accent.
