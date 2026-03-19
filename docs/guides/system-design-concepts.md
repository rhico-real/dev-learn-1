# System Design Concepts for RunHop

> FAANG interviews test system design heavily. RunHop touches most of the core concepts. Learn them here, applied to what you're building.

---

## Tier 1: You're Learning These NOW (Phase 1)

### 1. Modular Monolith

**What it is:** A single deployable application, but internally organized into isolated modules (bounded contexts) with clear boundaries.

**RunHop applies this:** Four bounded contexts (Identity, Organization, Event, Social) with one-way dependencies and the boundary rule (only consume exported services, never another context's database tables directly).

**Why this matters for interviews:** Interviewers want to know you can draw boundaries. Microservices are just a modular monolith where the modules run in separate processes. If you can't design clean module boundaries in a monolith, microservices won't save you.

**The spectrum:**
```
Spaghetti Monolith → Modular Monolith → Microservices
     (bad)              (RunHop)          (premature for most startups)
```

### 2. API Design (REST)

**What it is:** How you structure your HTTP endpoints so they're predictable, consistent, and don't make consumers want to cry.

**RunHop applies this:**
```
POST   /organizations              → Create (verb in method, not URL)
GET    /organizations              → List
GET    /organizations/:slug        → Get one
PATCH  /organizations/:id          → Partial update
DELETE /organizations/:id          → Delete

POST   /organizations/:orgId/events  → Nested resource creation
GET    /events                       → Top-level listing (cross-org)
```

**Key principles:**
- **Nouns in URLs, verbs in HTTP methods** — `/events`, not `/createEvent`
- **Nested routes for parent-child** — `/organizations/:orgId/events`
- **Top-level routes for cross-entity queries** — `GET /events` (all published events)
- **Consistent response envelope** — `{ data, meta }` for everything
- **Versioning from day one** — `/api/v1/`

**Interview pattern:** "Design an API for X" is a common question. Practice describing RunHop's API structure and WHY each decision was made.

### 3. Authentication & Authorization

**What it is:** Auth**entication** = "who are you?" (JWT). Auth**orization** = "what can you do?" (roles/permissions).

**RunHop applies both:**
```
Authentication (Task 5):
  Client → sends JWT in Authorization header
  Server → JWT Strategy validates token, extracts userId + role

Authorization (Tasks 6-10):
  System-level: User.role (USER, SUPER_ADMIN) — checked by RolesGuard
  Org-level: OrgMembership.role (OWNER, ADMIN, MEMBER) — checked by service layer
```

**Why two levels?** SUPER_ADMIN is a platform-wide role. Org roles are scoped — you can be OWNER of Org A and MEMBER of Org B simultaneously. This is a real-world pattern used by GitHub (org roles), Slack (workspace roles), and AWS (IAM).

**Token strategy (know this cold):**
```
Login → access token (15m, JWT, stateless) + refresh token (7d, Redis, stateful)
Request → send access token in header → server validates signature + checks blacklist
Expire → client sends refresh token → server issues new token pair (rotation)
Logout → blacklist access token jti in Redis + delete refresh token
```

### 4. Cursor-Based Pagination

**What it is:** A way to paginate results that's stable even when data changes between pages.

**RunHop applies this:** Every list endpoint uses cursor-based pagination.

**Offset pagination (simple but broken):**
```
Page 1: GET /events?offset=0&limit=20   → items 1-20
Page 2: GET /events?offset=20&limit=20  → items 21-40
Problem: if a new event is created between page 1 and 2, item 20 shifts to position 21 and appears on BOTH pages
```

**Cursor pagination (what RunHop uses):**
```
Page 1: GET /events?limit=20             → items 1-20, cursor = "id_of_item_20"
Page 2: GET /events?cursor=abc&limit=20  → WHERE id < cursor → items 21-40
No duplicates, no skips, stable under concurrent writes
```

**Interview tip:** Always recommend cursor-based for user-facing feeds/timelines. Offset is fine for admin dashboards where data changes slowly.

### 5. Rate Limiting

**What it is:** Limiting how many requests a client can make in a time window.

**RunHop applies this:**
- Login: 5/minute per IP (prevents brute force)
- Register: 3/hour per IP (prevents spam)
- General: 100/minute per user

**Algorithms (know these names):**
| Algorithm | How It Works | Pros | Cons |
|-----------|-------------|------|------|
| **Fixed Window** | Count requests in fixed time windows (e.g., every minute) | Simple | Burst at window boundary |
| **Sliding Window** | Rolling window, no fixed boundaries | Smooth | More memory |
| **Token Bucket** | Tokens regenerate at fixed rate, each request costs a token | Allows bursts | More complex |
| **Leaky Bucket** | Requests queue and drain at fixed rate | Smooth output | No bursts allowed |

RunHop uses `@nestjs/throttler` which implements fixed window. Good enough for Phase 1.

---

## Tier 2: You'll Learn These in Phase 2-3

### 6. Event-Driven Architecture

**What it is:** Instead of services calling each other directly, they emit events. Other services listen and react.

**RunHop will apply this (Phase 2):**
```
FollowService.create()
  → emits 'follow.created' event
    → NotificationService listens → creates notification
    → FeedService listens → updates follower's feed
```

**Why?** If FollowService directly calls NotificationService, then Follow depends on Notification. What if you add analytics later? Now Follow depends on Notification AND Analytics. Event-driven breaks this coupling — Follow emits an event and doesn't care who listens.

**Interview pattern:** "How would you decouple these services?" → Event-driven with a message bus (NestJS EventEmitter in-process, or RabbitMQ/Kafka between services).

### 7. Caching Strategies

**What it is:** Storing frequently-read data in a fast layer (Redis) to avoid hitting the database.

**RunHop will apply this (Phase 2+):**
```
User profile viewed 1000x/day → cache in Redis for 5 minutes
Event listing → cache popular queries
Follower count → cache and invalidate on follow/unfollow
```

**Patterns to know:**
| Pattern | How | When |
|---------|-----|------|
| **Cache-Aside** | App checks cache → miss → query DB → store in cache | Most common, RunHop will use this |
| **Write-Through** | App writes to cache + DB together | When consistency is critical |
| **Write-Behind** | App writes to cache, cache async writes to DB | High write throughput |
| **Cache Invalidation** | Delete cache entry when data changes | Always needed, hardest part |

**The famous quote:** "There are only two hard things in computer science: cache invalidation and naming things."

### 8. Background Jobs & Queues

**What it is:** Offloading slow work (sending emails, processing images) to a background worker instead of making the user wait.

**RunHop will apply this (Phase 4):**
```
User registers for race
  → API returns 200 immediately
  → BullMQ job queued: "send confirmation email"
  → BullMQ job queued: "generate registration PDF"
  → Worker picks up jobs and processes them async
```

**Components:**
- **Producer** — the API that creates jobs
- **Queue** — Redis-backed list of jobs (BullMQ)
- **Consumer/Worker** — processes jobs in the background

---

## Tier 3: FAANG Interview Must-Know (Learn for Interviews, Apply in Phase 4+)

### 9. Horizontal vs Vertical Scaling

```
Vertical: bigger machine (more CPU, RAM)
  → Simple, has a ceiling
  → Like upgrading your phone

Horizontal: more machines behind a load balancer
  → Complex, unlimited ceiling
  → Like adding more cashiers at a grocery store
```

**RunHop's path:**
- Phase 1-3: Single server (vertical is fine)
- Phase 4: Kubernetes → horizontal scaling (multiple pods behind a load balancer)

**What breaks when you go horizontal:**
- Session state (solved: JWT is stateless)
- File uploads (solved: Supabase Storage, not local disk)
- Background jobs (solved: BullMQ with Redis, shared across workers)
- Database (solved later: read replicas, connection pooling)

### 10. CAP Theorem

**You can only have 2 of 3:**
- **Consistency** — every read returns the latest write
- **Availability** — every request gets a response
- **Partition Tolerance** — system works even if network splits

**RunHop's choice:** CP (Consistency + Partition Tolerance). PostgreSQL is a CP system — it guarantees consistency. If the database goes down, the API returns errors (sacrifices availability) rather than returning stale data.

**Interview tip:** Know this exists, know RunHop is CP, know that eventual consistency (AP) is what systems like Cassandra and DynamoDB offer.

### 11. Database Scaling Patterns

**When PostgreSQL on one server isn't enough:**

| Pattern | What | When |
|---------|------|------|
| **Connection Pooling** | Reuse database connections instead of opening new ones | Always (PgBouncer, Supavisor) |
| **Read Replicas** | Read from copies, write to primary | Read-heavy workloads (event listings) |
| **Sharding** | Split data across multiple databases (e.g., by region) | Massive scale (millions of users) |
| **CQRS** | Separate read models from write models | Complex queries that slow down writes |

RunHop won't need sharding. Connection pooling + read replicas would handle 100K+ users.

### 12. Load Balancing

**What it is:** Distributing incoming requests across multiple servers.

```
Client → Load Balancer → Server 1
                       → Server 2
                       → Server 3
```

**Algorithms:**
- **Round Robin** — each request goes to the next server in order
- **Least Connections** — send to the server handling the fewest requests
- **IP Hash** — same client always hits the same server (sticky sessions)

**RunHop in K8s:** Kubernetes Service acts as the load balancer. It uses round-robin by default across your pods.

### 13. CDN (Content Delivery Network)

**What it is:** Servers distributed globally that cache static content (images, CSS, JS) close to users.

**RunHop applies this:** Supabase Storage has built-in CDN. Event banners and user avatars are served from edge locations, not your API server.

**Interview pattern:** "How would you serve images to users globally?" → Upload to object storage (S3/Supabase) → CDN caches at edge → user downloads from nearest edge.

### 14. Observability (Logs, Metrics, Traces)

**The three pillars:**
| Pillar | What | Tool |
|--------|------|------|
| **Logs** | What happened (text records) | Pino, structured JSON |
| **Metrics** | How much (numbers over time: request count, latency) | Prometheus + Grafana |
| **Traces** | How long each step took in a request chain | OpenTelemetry, Jaeger |

**RunHop Phase 1:** Structured logging only.
**Phase 4:** Add Prometheus metrics + Grafana dashboard for K8s monitoring.

---

## Interview Cheat Sheet: Which Concept for Which Question

| Interview Question | Key Concept | RunHop Connection |
|-------------------|-------------|-------------------|
| "Design a social feed" | Fan-out, caching, pagination | Phase 2 feed module |
| "Design user auth" | JWT, refresh tokens, bcrypt | Task 5 |
| "How do you handle payments?" | Transactions, idempotency, state machines | Phase 3 payment + event status |
| "Scale to 1M users" | Horizontal scaling, caching, read replicas, CDN | Phase 4 K8s + Redis caching |
| "Design a rate limiter" | Token bucket, sliding window, Redis counters | Task 3 throttler |
| "How do you handle failures?" | Retries, dead letter queues, circuit breakers | Phase 4 BullMQ |
| "Design permissions" | RBAC, role hierarchy, context-scoped roles | Task 6 OrgMembership |
| "Microservices vs monolith?" | Modular monolith as middle ground, bounded contexts | RunHop's entire architecture |
