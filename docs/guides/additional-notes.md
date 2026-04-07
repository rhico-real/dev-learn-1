# Additional Notes

> Personal notes and references to keep handy while building.

---

## HTTP Status Codes & Exceptions

Every API response includes a status code. Know what they mean so you can debug faster and write better error handling.

### Success Codes

| Status Code | Name | When It's Used |
|---|---|---|
| `200` | OK | General success — GET requests, updates that return data |
| `201` | Created | A new resource was created — POST `/auth/register`, POST `/events` |
| `204` | No Content | Success but nothing to return — DELETE requests |

### Client Error Codes (Your fault)

| Status Code | Name | When It's Used | NestJS Exception |
|---|---|---|---|
| `400` | Bad Request | Invalid JSON, missing required fields, validation failed | `BadRequestException` |
| `401` | Unauthorized | No token, expired token, invalid token | `UnauthorizedException` |
| `403` | Forbidden | Valid token but you don't have permission (e.g., wrong role) | `ForbiddenException` |
| `404` | Not Found | Resource doesn't exist — wrong ID, wrong URL | `NotFoundException` |
| `405` | Method Not Allowed | Using GET on a POST-only endpoint | `MethodNotAllowedException` |
| `409` | Conflict | Duplicate entry — e.g., registering with an email that already exists | `ConflictException` |
| `410` | Gone | Resource existed before but was deleted | `GoneException` |
| `422` | Unprocessable Entity | JSON is valid but the data doesn't make sense (e.g., end date before start date) | `UnprocessableEntityException` |
| `429` | Too Many Requests | Rate limited — too many requests in a short time | Use `@nestjs/throttler` |

### Server Error Codes (Server's fault)

| Status Code | Name | When It's Used | NestJS Exception |
|---|---|---|---|
| `500` | Internal Server Error | Unhandled exception, bug in your code | `InternalServerErrorException` |
| `502` | Bad Gateway | Your server got a bad response from an upstream service | `BadGatewayException` |
| `503` | Service Unavailable | Server is down or overloaded (e.g., database connection lost) | `ServiceUnavailableException` |
| `504` | Gateway Timeout | Upstream service didn't respond in time | `GatewayTimeoutException` |

### Quick Rules to Remember

> **4xx = the client (you) did something wrong.** Fix your request.
>
> **5xx = the server did something wrong.** Fix your code.

### How to Use in NestJS

When you throw an exception in a controller or service, NestJS automatically sends the right status code:

```typescript
// Returns 404 with message
throw new NotFoundException('Event not found');

// Returns 409 with message
throw new ConflictException('Email already registered');

// Returns 401 with message
throw new UnauthorizedException('Invalid credentials');
```

The global exception filter catches these and formats the response as:

```json
{
  "statusCode": 404,
  "message": "Event not found",
  "error": "Not Found",
  "timestamp": "2026-03-22T07:34:55.446Z",
  "path": "/api/v1/events/abc123"
}
```

> **Tip:** That `400 Bad Request` error you just saw? It was because of malformed JSON in the request body. The server couldn't even parse it — that's always a 400.

---

## Database Visualization & Relationships

### How to Visualize the Schema
Every time you run `npx prisma generate`, a live Entity-Relationship Diagram (ERD) is updated at `docs/erd.svg`.

![Entity Relationship Diagram](erd.svg)

- **View ERD:** Open `docs/erd.svg` in your browser or any SVG viewer.
- **Auto-Update:** This diagram syncs automatically with your `schema.prisma`.

### Current Relationship Map (Quick Glance)
- **User (1) <---> (N) OrgMembership <---> (1) Organization** (Many-to-Many via Join Table)
- **Organization (1) <---> (N) Event** (One-to-Many)
- **Event (1) <---> (N) Race** (One-to-Many)
- **Race (1) <---> (N) Registration** (One-to-Many)
- **User (1) <---> (N) Registration** (One-to-Many)
- **User (1) <---> (N) Follow** (Self-referential/Polymorphic)

### Key Architectural Notes
- **Composite Unique Keys:** `Registration` uses `@@unique([userId, raceId])` to prevent duplicate entries.
- **Indexes:** Frequent lookups like `orgId` on `Event` or `eventId` on `Race` are indexed for performance.

## Prisma & Transactions
In high-concurrency systems (like race registration), always wrap complex creation logic in a `this.prisma.$transaction()` to ensure all-or-nothing atomicity.
