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

---

## Prisma Error Codes (P-Series)

When Prisma encounters a database error, it throws a `PrismaClientKnownRequestError` with a specific code. Mapping these to the correct **NestJS Exception** is how you turn a `500 Internal Server Error` into a clean, helpful response for the user.

| Error Code | Name | Meaning | Recommended NestJS Exception |
|---|---|---|---|
| `P2002` | Unique constraint failed | Trying to create something that already exists (e.g., duplicate email) | `ConflictException` |
| `P2025` | Record to update not found | Trying to `update` or `delete` a record with an ID that doesn't exist | `NotFoundException` |
| `P2003` | Foreign key constraint failed | Trying to link to a record (like a User) that doesn't exist | `BadRequestException` |
| `P2014` | Required relation violation | Trying to delete a record that other records still depend on | `ConflictException` / `BadRequestException` |
| `P2011` | Null constraint violation | Trying to save `null` into a field that is required in the DB | `BadRequestException` |

### Pro Pattern: The One-Trip Update

Instead of checking `findUnique` then `update` (2 trips), use a `try/catch` block for performance:

```typescript
async confirm(registrationId: string) {
  try {
    return await this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'CONFIRMED' },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundException('Registration not found.');
    }
    throw error; // Let other unknown errors become 500s
  }
}
```

---

## How to Use in NestJS

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

## Best Practices

### Prisma: When to Use `@unique` vs `@@index`

Use `@unique` when the database must reject duplicates. Use `@@index` when duplicates are allowed, but you want filtering, lookup, or sorting to be faster.

### Quick Rule

- `@unique` means: there can only be one.
- `@@index` means: there may be many, but you query this a lot.

### Use `@unique` When

- The value must be globally unique, such as `email`, `username`, or `slug`
- Duplicate records would violate a business rule
- A join or mapping table should only allow one specific pair

Example:

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
}
```

Example with a composite unique constraint:

```prisma
model Registration {
  userId String
  raceId String

  @@unique([userId, raceId])
}
```

This means one user can only register once per race.

### Use `@@index` When

- The field is used often in `where`, filtering, or sorting
- The field is a foreign key like `userId`, `postId`, or `orgId`
- Duplicates are valid, but query performance matters

Example:

```prisma
model Post {
  id       String @id @default(uuid())
  authorId String
  title    String

  @@index([authorId])
}
```

`authorId` should usually be indexed, not unique, because one user can have many posts.

Example with a composite index:

```prisma
model Post {
  authorId  String
  createdAt DateTime

  @@index([authorId, createdAt])
}
```

This helps with queries like: get a user's posts ordered by date.

### Practical Examples

- Make fields unique for `email`, `username`, `slug`, and external provider IDs
- Make relation keys indexed for `userId`, `eventId`, `raceId`, and similar foreign keys
- Use `@@unique` for join-table pairs that must not repeat
- Use `@@index` for status and date combinations commonly used in list pages, dashboards, or admin filters

### Important Reminder

Do not make a field unique just to speed it up. `@unique` is primarily a data integrity rule. If duplicates are valid and you only want better query performance, use an index instead.
