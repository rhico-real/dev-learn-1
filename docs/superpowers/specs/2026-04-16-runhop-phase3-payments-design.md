# RunHop Phase 3 Payments Design

**Date:** 2026-04-16
**Status:** Proposed
**Type:** Phase Design & Module Breakdown

---

## Overview

Phase 3 adds a manual payment flow to RunHop. Users submit proof-of-payment screenshots for race registrations, and org admins review and approve or reject them. This phase does not integrate with any payment gateway — it is a human-reviewed, offline-payment verification system targeting GCash and Maya (the dominant mobile payment methods in the Philippines).

This phase introduces one module inside the Event context:

- `payment`

The module should follow the same patterns established in Phase 1 and Phase 2: DTOs, guards, service-layer business logic, domain events for side effects, and cursor pagination for list endpoints.

---

## Goals

- Add a complete manual payment verification flow for race registrations
- Keep the payment module inside the Event bounded context alongside registration, race, and event
- Preserve the modular monolith dependency rules
- Teach transactional business flows, status state machines, admin review patterns, and cross-module side effects
- Increase implementation difficulty slightly compared to Phase 2

## Non-Goals

- Payment gateway API integration (GCash API, Maya API, Stripe, etc.)
- Automated refunds
- Refund status tracking (can be added later)
- Invoice generation
- Payment receipts or email confirmations
- Partial payments or installments
- Multiple currencies per registration

---

## Why This Phase Exists

Phase 1 built the domain core (identity, organizations, events, races, registrations). Phase 2 made the platform social (posts, reactions, feed, notifications). Phase 3 makes the event business usable:

- A registration without payment confirmation is just a reservation
- Org admins need a way to verify that users actually paid before confirming their spot
- The manual flow is realistic for the Philippine market where GCash/Maya QR payments are standard and API integrations are not always available for smaller organizers

This phase teaches:

- Payment lifecycle design with explicit status transitions
- Admin review workflows
- Stronger consistency thinking (payment state drives registration state)
- Retry logic with limits
- Cross-module side effects via domain events

---

## Payment Entity & Data Model

### New Model: Payment

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | |
| `registrationId` | FK → Registration | Which registration this payment is for |
| `method` | Enum: `GCASH`, `MAYA` | Payment channel used |
| `amount` | Int (cents) | e.g., 50000 = PHP 500.00 (matches Race.price pattern) |
| `currency` | String | Defaults to `"PHP"`, copied from the race at submission time |
| `proofImage` | String | URL to uploaded proof-of-payment screenshot |
| `status` | Enum: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED` | |
| `reviewedBy` | String? (nullable) | userId of the admin who reviewed |
| `reviewedAt` | DateTime? (nullable) | When the review happened |
| `rejectionReason` | String? (nullable) | Why it was rejected (helps user on retry) |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### New Enums

- `PaymentMethod` — `GCASH`, `MAYA`
- `PaymentStatus` — `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`

### Constraints & Indexes

- No unique constraint on `registrationId` — one registration can have multiple payment attempts (up to 3, enforced at service layer)
- Index on `(registrationId, status)` — for checking attempt count and current payment state
- Index on `(status, createdAt)` — for admin review queues

### Relationship

`Registration 1:N Payment` — one registration, up to 3 payment attempts if previous attempts are rejected.

---

## Payment Status State Machine

```
SUBMITTED ──→ UNDER_REVIEW ──→ APPROVED
                    │
                    └──→ REJECTED
```

- `SUBMITTED → UNDER_REVIEW`: Admin picks up the payment for review
- `UNDER_REVIEW → APPROVED`: Admin confirms the proof is valid
- `UNDER_REVIEW → REJECTED`: Admin rejects with a reason

No other transitions allowed. Enforced at the service layer.

**Simplification:** The review endpoint handles both transitions atomically. When an admin reviews a payment, it moves from `SUBMITTED → APPROVED` or `SUBMITTED → REJECTED`, with `UNDER_REVIEW` recorded as the intermediate state. This avoids a "claimed but never finished" limbo state.

---

## Business Rules

### Submission Rules

1. User can only submit payment for their own registration
2. Registration must be in `PENDING` status
3. Race price must be > 0 (free races auto-confirm, no payment needed)
4. Amount must match the race price exactly
5. Max 3 payment attempts per registration — if all 3 are rejected, registration is auto-cancelled
6. Cannot submit a new payment while a previous one is `SUBMITTED` or `UNDER_REVIEW`

### Review Rules

1. Only org ADMIN/OWNER of the event's org (or SUPER_ADMIN) can review payments
2. Rejection requires a `rejectionReason`
3. `reviewedBy` and `reviewedAt` are set on approval or rejection

### Side Effects (via domain events)

| Event | Trigger | Action |
|-------|---------|--------|
| `payment.approved` | Admin approves payment | Auto-confirm registration (`PENDING → CONFIRMED`) |
| `payment.rejected` (3rd attempt) | Admin rejects 3rd payment | Auto-cancel registration (`PENDING → CANCELLED`) |

### Free Race Rule

When a user registers for a race with `price = 0`, the registration is immediately set to `CONFIRMED` — no payment flow at all. This is handled in `RegistrationService.create()`, not in the payment module.

---

## API Endpoints

All under `/api/v1`.

### User-Facing Endpoints

| Method | Path | Description | Min Role |
|--------|------|-------------|----------|
| `POST` | `/registrations/:id/payments` | Submit payment proof | `USER` (own registration only) |
| `GET` | `/registrations/:id/payments` | List own payment attempts | `USER` (own registration only) |
| `GET` | `/payments/:id` | Get single payment detail | `USER` (own) or org `ADMIN` |

### Admin-Facing Endpoints

| Method | Path | Description | Min Org Role |
|--------|------|-------------|-------------|
| `GET` | `/events/:eventId/payments` | List payments for event (review queue) | `ADMIN` |
| `PATCH` | `/payments/:id/review` | Approve or reject a payment | `ADMIN` |

### Endpoint Details

- **`POST /registrations/:id/payments`** — body: `{ method, amount, currency, proofImage }`. Validates attempt count, checks no active payment exists, validates amount matches race price.
- **`GET /events/:eventId/payments`** — cursor pagination, filterable by `status` (so admins can view just `SUBMITTED` payments needing review).
- **`PATCH /payments/:id/review`** — body: `{ action: "APPROVE" | "REJECT", rejectionReason?: string }`. Transitions through `UNDER_REVIEW` atomically. Rejection requires `rejectionReason`.

---

## Module Structure

```
src/domain/event/
├── payment/
│   ├── payment.module.ts
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   ├── payment.listener.ts       # listens for registration events (free race auto-confirm)
│   └── dto/
│       ├── create-payment.dto.ts
│       └── review-payment.dto.ts
├── event/
├── race/
├── registration/
└── event-context.module.ts
```

### Internal Dependencies (within Event context)

- `PaymentService` → `RegistrationService` — validate registration ownership, check status, get race price
- `PaymentService` → `RaceService` — check price for free-race logic
- `RegistrationService` — needs a small update to handle free-race auto-confirm at registration time

### Cross-Context Dependencies

- `PaymentService` → `OrgMembershipService` — verify admin role for review endpoints (same pattern Event context already uses)

### Domain Events

| Event emitted | Emitter | Listener | Action |
|---------------|---------|----------|--------|
| `payment.approved` | PaymentService | RegistrationService (listener) | Auto-confirm registration |
| `payment.rejected` (3rd attempt) | PaymentService | RegistrationService (listener) | Auto-cancel registration |

---

## Permissions & Ownership

### Baseline Rules

- Only authenticated users can submit payments
- Users can only submit and view payments for their own registrations
- Only org ADMIN/OWNER of the event's org can review payments and view the event payment queue
- SUPER_ADMIN can review any payment

### Permission Map

| Action | Min System Role | Min Org Role | Notes |
|--------|----------------|-------------|-------|
| Submit payment | `USER` | — | Own registration only |
| View own payments | `USER` | — | Own registration only |
| View single payment | `USER` | — | Own payment, or org ADMIN for event's org |
| List event payments | `USER` | `ADMIN` | Admin review queue |
| Approve/reject payment | `USER` | `ADMIN` | |
| Any payment action | `SUPER_ADMIN` | — | Overrides all org-level checks |

---

## Testing Strategy

### Unit Tests (PaymentService)

- Submission validation: own registration, pending status, amount matches price, attempt count < 3, no active payment
- Status transitions: only valid transitions allowed, invalid ones throw
- Free race: registration auto-confirms when price = 0
- 3rd rejection: auto-cancels registration
- Review permissions: rejection requires reason

### E2E Tests (Critical Flows)

| Flow | What it validates |
|------|-------------------|
| Happy path: submit → approve → registration confirmed | Full lifecycle + side effect |
| Reject → retry → approve | Retry works, new attempt succeeds |
| 3x reject → registration cancelled | Auto-cancel after max attempts |
| Submit for someone else's registration | 403 forbidden |
| Submit when payment already pending | 409 conflict |
| Submit amount mismatch | 400 bad request |
| Free race auto-confirm | Registration skips payment entirely |
| Non-admin tries to review | 403 forbidden |
| Admin reviews payment for different org's event | 403 forbidden |
| Reject without reason | 400 bad request |
| Admin payment queue: filter by status, pagination | Read query correctness |

### Testing Discipline

Same as Phase 1 and 2 — service-level unit tests for business rules, e2e for full request/response cycles. No new testing patterns needed.

---

## Learning Objectives

Compared with Phase 2, Phase 3 should stretch you in these areas:

- Designing explicit status state machines with enforced transitions
- Building admin review workflows with role-based access
- Implementing retry logic with limits and side effects
- Connecting two entities through domain events (payment approval → registration confirmation)
- Thinking about consistency: what happens if the payment is approved but the registration update fails?
- Handling the boundary between "user action" and "admin action" in the same module

This is the intended challenge increase: business-process flows that go beyond CRUD and social interactions.

---

## Risks and Guardrails

### Risk 1: Over-engineering the payment state machine

Adding states like `REFUNDED`, `EXPIRED`, `DISPUTED` before they're needed.

Guardrail: Four states only — `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`. Add more later if a real requirement appears.

### Risk 2: Coupling payment logic into registration

Putting payment validation inside `RegistrationService` instead of keeping it in `PaymentService`.

Guardrail: `PaymentService` owns all payment logic. `RegistrationService` only reacts to domain events.

### Risk 3: Skipping the free-race edge case

Forgetting that `price = 0` races should bypass payment entirely.

Guardrail: Handle this in `RegistrationService.create()` — check price, auto-confirm if free. Test it explicitly.

### Risk 4: Not validating amount server-side

Trusting the client-submitted amount without checking it against the race price.

Guardrail: `PaymentService.create()` must fetch the race price and compare. Reject mismatches with 400.

---

## Relationship to the Full Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Platform core: auth, users, orgs, events, races, registrations, follows | Complete |
| **Phase 2** | Social layer: posts, reactions, feed, notifications | Complete |
| **Phase 3** | Payments: manual payment verification for race registrations | Ready to build |
| **Phase 4** | Scale and operational maturity: queues, caching, deployment | Roadmap only |

Phase 3 makes the event business usable. It is the bridge between a social platform and a product that can handle real race registrations with payment confirmation.
