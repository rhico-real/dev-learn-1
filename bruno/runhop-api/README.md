# RunHop Bruno Collection

Import the `bruno/runhop-api` folder in Bruno.

Set these environment variables in `environments/local.bru` before use:

- `baseUrl`
- `accessToken`
- resource IDs like `orgId`, `eventId`, `raceId`, `postId`

Most routes use the global Nest prefix: `/api/v1`.
The health endpoint does not: `/health`.
