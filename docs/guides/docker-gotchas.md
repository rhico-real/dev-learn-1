# Docker Gotchas

> A practical log of Docker and Docker Compose problems hit while packaging and running RunHop locally.

## What This Guide Is For

This is not a Docker tutorial. It is a list of failure modes that are easy to hit when building a NestJS + Prisma + Redis + PostgreSQL app with Docker Compose.

Use it when:
- `docker compose up` says services started but the app is still not reachable
- a build succeeds but the container exits immediately
- Prisma works locally but fails in Docker
- Docker ports collide with services already running on your machine

## 1. `docker compose down` Does Not Free Every Port On Your Machine

`docker compose down` only stops and removes containers from the current Compose project.

It does **not** stop:
- old standalone containers
- containers from other Compose projects
- Homebrew services
- SSH tunnels

That is why you can still get:

```text
Bind for :::5432 failed: port is already allocated
Bind for :::6379 failed: port is already allocated
```

### How to debug

```bash
docker ps
lsof -i :5432
lsof -i :6379
brew services list
```

### What to look for

- old containers like `postgres_db` or `redis_cache`
- local `postgresql@14` or `redis` services
- `ssh` processes forwarding ports like `5432` or `6379`

## 2. `docker stop` vs `docker compose down`

These solve different problems.

### `docker stop`

Stops specific containers by name or ID.

```bash
docker stop postgres_db redis_cache
```

Use this for leftover containers outside your current Compose stack.

### `docker compose down`

Stops and removes containers created by the current `docker-compose.yml`, plus the Compose network.

```bash
docker compose down
```

Use this when shutting down the current project stack cleanly.

## 3. `--build` Is Not Needed Every Time

`docker compose up -d`:
- starts containers
- uses the existing built image if it already exists

`docker compose up -d --build`:
- rebuilds the image first
- then starts containers

Use `--build` when:
- `Dockerfile` changed
- app source changed and the app runs from the image
- dependencies changed

You do not need `--build` every time for infra-only services like Postgres and Redis.

## 4. `docker ps` Only Shows Running Containers

If `localhost:3000` is refusing connections, check whether the app container is actually still running.

```bash
docker ps
docker ps -a
```

Common pattern:
- `docker compose up -d` says the app container started
- the app crashes immediately after startup
- `docker ps` no longer shows the app container

To see why it died:

```bash
docker logs dev-learn-1-app-1
```

## 5. `localhost` Inside A Container Is Not Your Other Containers

This is one of the biggest Compose mistakes.

Inside the `app` container:
- `localhost` means the `app` container itself
- not the Postgres container
- not the Redis container

So these values are wrong for full Compose app mode:

```env
DATABASE_URL=postgresql://runhop:runhop@localhost:5432/runhop
REDIS_HOST=localhost
```

For Compose, use service names:

```env
DATABASE_URL=postgresql://runhop:runhop@postgres:5432/runhop
REDIS_HOST=redis
REDIS_PORT=6379
```

### Practical rule

- local app on your Mac: use `localhost`
- app inside Docker Compose: use `postgres` and `redis`

This is why one `.env` often cannot serve both local mode and full Compose mode cleanly.

## 6. A Successful Image Build Does Not Mean The App Will Run

These lines only mean the image was created:

```text
Successfully built <image-id>
Successfully tagged runhop:local
```

They do **not** mean:
- the container entrypoint is correct
- Prisma can connect
- Redis can connect
- your app stays up after boot

Always follow with:

```bash
docker ps
docker ps -a
docker logs <app-container-name>
```

## 7. Check The Real Nest Build Output Before Writing `CMD`

Do not assume the entry file is always `dist/main.js`.

In this project, the real output was:

```text
dist/src/main.js
```

That meant this failed:

```dockerfile
CMD ["node", "dist/main.js"]
```

and this was the correct path:

```dockerfile
CMD ["node", "dist/src/main.js"]
```

### How to verify

```bash
npm run build
find dist -maxdepth 3 -type f
```

## 8. Prisma In Docker Needs The Schema At The Right Time

If the app imports enums like `Platform` from `@prisma/client` and crashes with enum-related errors, the generated Prisma client in the final image may be missing or stale.

Typical symptoms:
- `TypeError` around `@IsEnum(Platform)`
- Prisma client not matching the current schema

### Safer pattern

- copy `prisma/` before install/generate steps
- run `npx prisma generate` in the image that will actually run the app
- make sure the final runtime image has a client generated from the current schema

## 9. Prisma ERD Generation Is A Build-Time Trap

This schema block caused Docker build failures:

```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
}
```

Why it broke:
- it triggered Mermaid / Puppeteer tooling
- that tried to launch a browser during image build
- Docker image compatibility issues showed up immediately

If you only need Prisma Client in Docker, do not generate the ERD during image build.

## 10. Alpine Is Smaller, But Less Forgiving

Alpine images are common, but they are not always the best choice for Node apps using native tooling.

Problems hit here:
- Puppeteer / Mermaid / browser tooling friction
- Prisma runtime compatibility warnings
- missing system libraries like OpenSSL

For reliability, Debian-based images like `node:bookworm-slim` are often easier to work with than `node:alpine`.

## 11. Colima Replaces Docker Desktop, Not Docker Compose

Colima is the local Docker runtime on macOS.

What stays the same:
- `docker`
- `docker compose`
- `Dockerfile`
- `docker-compose.yml`

What changes:
- Colima becomes the Docker engine behind those commands

Useful commands:

```bash
colima status
colima list
colima start
colima stop
```

If Docker says it cannot connect to the daemon, check whether the Colima profile is actually healthy:

```bash
colima list
```

If the profile shows `Broken`, a restart may be required.

## 12. The Best Day-To-Day Dev Workflow Is Usually Hybrid

For most backend work, the smoothest setup is:
- Postgres and Redis in Docker
- Nest app running locally with `npm run start:dev`

Why:
- fast hot reload
- easier debugging
- easier logs
- fewer full-image rebuilds while coding

Use full Docker app mode occasionally to verify packaging and onboarding, not necessarily for every edit-run cycle.

## Quick Debug Checklist

When Docker is not behaving, run these first:

```bash
docker ps
docker ps -a
docker compose logs app
docker logs <container-name>
lsof -i :3000
lsof -i :5432
lsof -i :6379
brew services list
colima list
```

## Summary Rules

- `docker compose down` only cleans up the current Compose project
- `localhost` inside a container is the container itself
- build success is not runtime success
- always inspect the real `dist/` output before setting `CMD`
- Prisma needs generated client artifacts in the final runtime image
- Alpine saves size; Debian usually saves time
