# Bounded Contexts — The Walls Between Your Code

> Every time the plan says "Identity Context" or "Organization Context," it's talking about a bounded context. This is the single most important architectural idea in RunHop. Get this right and everything else falls into place.

---

## Start Here: The Mall Analogy

Think of RunHop as a **shopping mall** with four stores:

```
🏬 RunHop Mall
├── 🔐 Identity Store     — handles IDs, passwords, security badges
├── 🏢 Organization Store — handles running clubs and memberships
├── 🏃 Event Store        — handles races, events, sign-ups
└── 👥 Social Store       — handles who follows who
```

Each store:
- **Has its own inventory** (data). The Identity Store keeps passwords. The Event Store keeps race info. They don't share shelves.
- **Has a service window** (exported services). Other stores can come to the window and ask for something: "Hey Identity, does user `abc` exist?" But they can't walk behind the counter.
- **Has its own employees** (controllers, services). Event Store employees don't log into Identity Store's cash register.

**The mall manager (AppModule) decides which stores can talk to each other.** That's it. That's bounded contexts.

---

## Why Not Just One Big Store?

You could put everything in one `GodService`:

```typescript
// 💀 The God Service — everything in one place
class AppService {
    createUser() { ... }
    login() { ... }
    createOrganization() { ... }
    addOrgMember() { ... }
    createEvent() { ... }
    registerForRace() { ... }
    followUser() { ... }
    // 50 more methods...
}
```

This is called a **Big Ball of Mud**. Works great on day 1. By day 100:

| Problem | What happens |
|---------|-------------|
| One change breaks everything | You fix a login bug, suddenly registration breaks |
| Can't work in parallel | Two devs both need to edit `AppService` — merge conflict hell |
| Testing is a nightmare | To test `followUser()` you have to mock auth, orgs, events, everything |
| Impossible to understand | 2,000-line file, good luck finding anything |

Bounded contexts fix all of this by putting **walls** between unrelated things.

---

## RunHop's Four Contexts

### Identity — "Who are you?"

```
src/domain/identity/
├── user/        ← User CRUD, profiles
└── auth/        ← Login, register, JWT tokens, logout
```

**Owns:** User table, passwords, JWT tokens, refresh tokens in Redis

**Knows about:** Nothing else. Identity is the **foundation** — it has zero dependencies on other contexts.

**Other contexts need it for:** Looking up users, verifying they exist

---

### Organization — "What running clubs exist?"

```
src/domain/organization/
└── org/         ← Create/manage orgs, add/remove members
```

**Owns:** Organization table, OrgMembership table

**Depends on:** Identity (needs `UserService` to verify members exist)

**Does NOT know about:** Events, Social — an organization doesn't care about races or followers

---

### Event — "What races are happening?"

```
src/domain/event/
├── event/        ← Create/manage running events
├── race/         ← Individual races within events
└── registration/ ← Sign up for races
```

**Owns:** Event, Race, Registration tables

**Depends on:** Identity (user lookup), Organization (verify org owns the event)

**Does NOT know about:** Social — an event doesn't care who follows it

---

### Social — "Who follows what?"

```
src/domain/social/
└── follow/      ← Follow/unfollow users, orgs, events
```

**Owns:** Follow table

**Depends on:** Identity (verify user exists)

**Does NOT know about:** Organization, Event — Social just stores follow relationships using IDs. It doesn't need to understand what an organization or event is.

---

## The One Rule You Must Never Break

> **Never reach into another context's database table. Always go through its exported service.**

This is the **boundary rule**. Here's what it looks like:

```typescript
// ❌ WRONG — Event context queries User table directly
@Injectable()
export class RegistrationService {
    constructor(private prisma: PrismaService) {}

    async register(userId: string, raceId: string) {
        // Reaching into Identity's table — VIOLATION
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException();
        // ...
    }
}
```

```typescript
// ✅ RIGHT — Event context asks Identity through its service
@Injectable()
export class RegistrationService {
    constructor(
        private prisma: PrismaService,
        private userService: UserService  // ← imported from Identity context
    ) {}

    async register(userId: string, raceId: string) {
        // Asking Identity: "does this user exist?"
        const exists = await this.userService.exists(userId);
        if (!exists) throw new NotFoundException();
        // ...
    }
}
```

**Why does this matter?**

Tomorrow you add soft-delete to users. With the wrong approach, you'd have to find every `prisma.user.findUnique()` across the entire codebase and add `where: { deletedAt: null }`. With the right approach, you change `UserService.exists()` once and every context automatically gets the fix.

---

## How NestJS Enforces This

NestJS doesn't let you import services freely. You have to declare what's available:

```typescript
// Identity says: "I export UserService. That's all you get."
@Module({
    providers: [UserService, AuthService],
    exports: [UserService],  // ← AuthService stays private
})
export class UserModule {}
```

```typescript
// Organization says: "I need Identity's UserService"
@Module({
    imports: [UserModule],  // ← explicitly requests access
    providers: [OrgService],
})
export class OrgModule {}
```

```typescript
// Now OrgService can use UserService
@Injectable()
export class OrgService {
    constructor(private userService: UserService) {}  // ✅ works

    // But NOT AuthService — it wasn't exported
    // constructor(private authService: AuthService) {}  // ❌ NestJS error
}
```

Notice: `AuthService` is **not exported**. No one outside Identity can use it. Auth is only accessible through HTTP endpoints (`/auth/login`, etc.). This is intentional — other contexts should never call `authService.login()` directly.

---

## Dependencies Flow One Way

```
            ┌──────────┐
            │ IDENTITY │  ← depends on nothing
            └────┬─────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
   ┌────────┐ ┌──────┐ ┌────────┐
   │  ORG   │ │EVENT │ │ SOCIAL │
   └────────┘ └──┬───┘ └────────┘
                 │
                 ▼
              ┌──────┐
              │ ORG  │  ← Event also depends on Org
              └──────┘
```

**Rules:**
- Arrows point **toward dependencies** (what you need)
- Identity has no arrows pointing out — it's independent
- **No circular arrows ever.** If Event → Social AND Social → Event, your architecture is broken

**What this means practically:**
- You can delete the Social module and everything else still compiles
- You can delete the Event module and Identity + Organization still work
- You can **never** delete Identity without breaking everything

---

## Same Word, Different Meaning

The word "user" means something different depending on which store you're in:

```
Identity Store:     "User = someone who can log in"
                     → has email, password, JWT, system role

Organization Store: "User = a club member"
                     → has org role (OWNER, ADMIN, MEMBER)

Event Store:        "User = a race participant"
                     → has registration status (PENDING, CONFIRMED)

Social Store:       "User = a follower"
                     → has follow relationships
```

That's why the Prisma schema has separate models:

```prisma
model User           { ... password, role ... }       // Identity's view
model OrgMembership  { ... userId, orgRole ... }      // Org's view
model Registration   { ... userId, status ... }       // Event's view
model Follow         { ... followerId, targetId ... } // Social's view
```

Each context stores **only what it cares about**. The `userId` is just a pointer — "go ask Identity if you need more details."

---

## The Flutter Comparison

You've done feature-based folders in Flutter:

```dart
// Flutter — feature folders (no enforcement)
lib/
  features/
    auth/             // Anyone can import anything from here
    organizations/    // No rules preventing cross-feature imports
    events/
    social/
```

In Flutter, nothing stops `EventService` from importing `AuthRepository` and calling `_privateMethod()`. It's honor system.

NestJS bounded contexts add **actual enforcement:**

```
// NestJS — bounded contexts (enforced by framework)
src/domain/
  identity/     // Module controls what's exported
  organization/ // Must explicitly import dependencies
  event/        // Can't use non-exported services
  social/       // Framework throws error if you violate boundaries
```

Same idea. Flutter relies on discipline. NestJS relies on **the module system**.

---

## Quick Decision Guide

When you're building a feature and don't know where it goes:

| Ask yourself... | If yes → |
|----------------|----------|
| Is it about authentication, passwords, or tokens? | **Identity** |
| Is it about a running club, its members, or roles within it? | **Organization** |
| Is it about a race event, a specific race, or signing up? | **Event** |
| Is it about following or unfollowing something? | **Social** |
| Is it used by multiple contexts? (guards, decorators, filters) | **Shared** (`src/shared/`) |
| Does it talk to Postgres, Redis, or external APIs? | **Infrastructure** (`src/infrastructure/`) |

---

## The Litmus Test

You know your bounded contexts are clean when:

1. **You can delete one context** and the others still compile (except their imports from it)
2. **You can explain each context in one sentence** without mentioning the others
3. **A new developer** can work on Event without understanding how Auth works internally
4. **Each context has one reason to change.** Auth changes don't force Event changes.

If any of these fail, your walls have holes.
