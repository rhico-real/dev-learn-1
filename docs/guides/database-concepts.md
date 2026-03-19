# Database Concepts for RunHop

> Learn these concepts as you build. Each section maps to a RunHop task where you'll use it.

---

## Phase 1 Concepts (Learn NOW — you need these for Tasks 2-10)

### 1. Relationships & Keys

**Where you use this:** Task 2 (Prisma schema)

There are three types of relationships between tables. All three appear in RunHop.

**One-to-Many (1:N)** — the most common
```
Organization --1:N--> Event
"One org has many events. One event belongs to one org."
```
In Prisma:
```prisma
model Organization {
  id     String  @id @default(uuid())
  events Event[]    // one org has many events
}

model Event {
  id    String       @id @default(uuid())
  orgId String
  org   Organization @relation(fields: [orgId], references: [id])
  // orgId is the Foreign Key (FK) — it points to Organization's Primary Key (PK)
}
```

**Dart analogy:** Like a `ListView` that belongs to a `Screen`. The screen holds many list items, each item knows which screen it's on.

**Many-to-Many (N:M)** — uses a junction table
```
User --N:M--> Organization (via OrgMembership)
"A user can be in many orgs. An org can have many users."
```
You can't directly link N:M in SQL. You need a **junction table** (OrgMembership) that has two foreign keys:
```prisma
model OrgMembership {
  id     String @id @default(uuid())
  userId String
  orgId  String
  role   OrgRole
  user   User         @relation(fields: [userId], references: [id])
  org    Organization @relation(fields: [orgId], references: [id])

  @@unique([userId, orgId])  // a user can only have one membership per org
}
```

**One-to-One (1:1)** — rare, appears in Phase 3
```
Registration --1:1--> Payment (conceptually, though we modeled it as 1:N for resubmission)
```

**Key types in RunHop:**
| Key Type | Example | Purpose |
|----------|---------|---------|
| **Primary Key (PK)** | `User.id` | Uniquely identifies each row. We use UUIDs, not auto-increment integers. |
| **Foreign Key (FK)** | `Event.orgId` → `Organization.id` | Links one table to another. The database enforces this — you can't create an event with a fake orgId. |
| **Composite Unique** | `@@unique([userId, orgId])` on OrgMembership | Two columns together must be unique. Prevents a user from joining the same org twice. |
| **Candidate Key** | `Organization.slug` | Could be a PK (it's unique) but we chose UUID instead. Slug is a secondary unique identifier. |

---

### 2. Indexing

**Where you use this:** Task 2 (Prisma schema — `@@index` declarations)

An index is like a book's index — instead of reading every page to find "marathon," you look up "marathon" in the index and jump to the right page.

**Without an index:** The database scans every row (full table scan). For 10 rows, fine. For 1 million rows, your API takes 5 seconds.

**With an index:** The database uses a B-tree (a sorted tree structure) to find the row in milliseconds.

**RunHop's indexes and WHY they exist:**

```prisma
model Event {
  @@index([orgId, status])     // "List published events for this org"
  @@index([status, startDate]) // "List upcoming published events" — sorted by date
}
```

The first index is a **composite index** — it indexes TWO columns together. This means the query `WHERE orgId = X AND status = 'PUBLISHED'` is fast. But `WHERE status = 'PUBLISHED'` alone would NOT use this index efficiently (leftmost column matters).

**When NOT to index:**
- Columns you rarely query by (e.g., `bio` on User — nobody searches by bio)
- Tables with very few rows (indexing a 10-row table is pointless)
- Columns with low cardinality (e.g., a boolean column — only two values, index doesn't help much)

**Covering index** (advanced, know it exists):
An index that contains ALL the columns a query needs, so the database never touches the actual table — it reads everything from the index alone. We don't need this for RunHop's scale.

---

### 3. Transactions & ACID

**Where you use this:** Task 6 (creating org + owner membership atomically)

A transaction groups multiple operations into one atomic unit. Either ALL succeed or ALL rollback.

**RunHop example:**
```typescript
// Task 6: Creating an organization
const result = await prisma.$transaction(async (tx) => {
  const org = await tx.organization.create({ data: orgData });
  const membership = await tx.orgMembership.create({
    data: { userId, orgId: org.id, role: 'OWNER' }
  });
  return { org, membership };
});
// If membership creation fails, the org is also rolled back — no orphan orgs
```

**ACID properties (what the database guarantees):**
| Property | What It Means | RunHop Example |
|----------|--------------|----------------|
| **Atomicity** | All or nothing | Creating org + membership either both succeed or both fail |
| **Consistency** | Data stays valid | The `@@unique([userId, orgId])` constraint is never violated, even mid-transaction |
| **Isolation** | Concurrent transactions don't interfere | Two users registering for the last race slot at the same time — only one gets it |
| **Durability** | Once committed, it's permanent | A confirmed registration survives a server crash |

---

### 4. Soft Deletes

**Where you use this:** Task 6 (Organization delete, User delete)

```prisma
model User {
  deletedAt DateTime?  // null = active, timestamp = deleted
}
```

Instead of `DELETE FROM users WHERE id = X`, you do:
```typescript
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

Every query must filter: `where: { deletedAt: null }`. If you forget this, "deleted" users show up in results — a common bug.

**Why not hard delete?** If User #5 registered for a race and you hard-delete User #5, the registration row has a foreign key pointing to a user that no longer exists. Database error. Soft delete keeps the data intact.

---

## Phase 2-3 Concepts (Learn LATER — when you build these features)

### 5. SQL JOINs

**Where you'll use this:** Phase 2 (feed aggregation, complex queries)

Prisma handles most JOINs for you via `include`:
```typescript
// This generates a LEFT JOIN under the hood
const event = await prisma.event.findUnique({
  where: { id },
  include: { races: true, org: true }  // JOIN races and organization tables
});
```

But you should understand what's happening:
- **INNER JOIN** — only rows that match in BOTH tables (event + race where both exist)
- **LEFT JOIN** — all rows from left table, matched rows from right (all events, even if they have no races)
- **RIGHT JOIN** — opposite of LEFT (rarely used)

**When you'll drop to raw SQL:** When Prisma's query builder can't express what you need (e.g., complex aggregations for the feed). Use `prisma.$queryRaw`.

### 6. N+1 Problem

**Where you'll encounter this:** Task 6+ (any list endpoint that includes related data)

The N+1 problem:
```typescript
// BAD — 1 query to get events, then N queries to get each event's org
const events = await prisma.event.findMany(); // 1 query
for (const event of events) {
  const org = await prisma.organization.findUnique({ where: { id: event.orgId } }); // N queries
}

// GOOD — 1 query that JOINs everything
const events = await prisma.event.findMany({
  include: { org: true }  // Prisma generates a JOIN — 1 query total
});
```

**Dart analogy:** Like making N separate API calls in Flutter instead of one batch call. Same problem, different layer.

### 7. Concurrency & Isolation Levels

**Where you'll use this:** Phase 3 (payment processing), Phase 4 (high-traffic race registration)

When two users register for the last race slot simultaneously:
1. User A reads: 99/100 slots taken → 1 remaining
2. User B reads: 99/100 slots taken → 1 remaining
3. Both create registrations → 101/100 slots. Bug.

**Solutions (from simple to complex):**
- **Unique constraint** (Phase 1): Database rejects duplicates — handles same-user-double-register
- **Optimistic locking** (Phase 3): Add a `version` column, check it before updating
- **Pessimistic locking** (Phase 4): `SELECT ... FOR UPDATE` locks the row while you're working on it
- **Serializable isolation**: Database runs transactions one at a time — slowest but safest

For Phase 1, the simple count + unique constraint is enough. Don't over-engineer.

### 8. Denormalization

**Where you'll use this:** Phase 2 (feed, follower counts)

Normalization = no duplicate data. Denormalization = intentionally duplicate data for read performance.

**Example:** Instead of counting followers every time (`SELECT COUNT(*) FROM follows WHERE targetId = X`), store `followerCount` directly on the Organization table. Update it when someone follows/unfollows.

Trade-off: faster reads, but you must keep the count in sync. If the count gets out of sync, you have a bug.

**Rule of thumb:** Start normalized (Phase 1). Denormalize only when you measure a performance problem (Phase 4).

### 9. Query Optimization with EXPLAIN

**Where you'll use this:** Phase 4 (when queries get slow)

```sql
EXPLAIN ANALYZE SELECT * FROM events WHERE status = 'PUBLISHED' AND start_date > NOW();
```

This shows HOW the database executes your query — whether it uses an index, how many rows it scans, how long each step takes. It's like Flutter's DevTools performance tab but for SQL.

**Key things to look for:**
- `Seq Scan` = full table scan (bad for large tables — needs an index)
- `Index Scan` = using an index (good)
- `Nested Loop` = potential N+1 at the database level
- High `rows` count = scanning too many rows

---

## Concept Cheat Sheet

| Concept | When You Need It | RunHop Task |
|---------|-----------------|-------------|
| Relationships (1:N, N:M) | Now | Task 2 |
| PK, FK, Composite Keys | Now | Task 2 |
| Indexes | Now | Task 2 |
| Transactions | Now | Task 6 |
| Soft Deletes | Now | Task 6 |
| N+1 Problem | Soon | Task 6+ |
| JOINs (via Prisma `include`) | Soon | Task 6+ |
| Concurrency | Later | Phase 3-4 |
| Denormalization | Later | Phase 2+ |
| EXPLAIN / Query Optimization | Later | Phase 4 |
| Raw SQL | Later | Phase 2+ |
