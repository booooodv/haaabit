# Self-hosting

This repository ships an official self-hosted path based on Docker Compose with one public entrypoint.

## Topology

- `proxy` is the only published service
- `web` serves the Next.js app
- `api` serves auth, habit APIs, today APIs, stats, and OpenAPI
- `migrate` is a one-off operator command used for first install and upgrades

By default the stack stores data in a named Docker volume and serves the app at `http://localhost:8080`.

## Prerequisites

- Docker Desktop or Docker Engine with Compose v2
- A shell that can run the commands below

## Configuration

1. Copy the example file:

```bash
cp .env.example .env
```

2. Generate a secret:

```bash
openssl rand -hex 32
```

3. Edit `.env` and set at least:

- `APP_BASE_URL`
- `BETTER_AUTH_SECRET`

Default first-install values:

- `APP_BASE_URL=http://localhost:8080`
- `HAAABIT_PUBLIC_PORT=8080` is optional and only needed when the host port should differ from the URL default

Advanced overrides remain optional:

- `DATABASE_URL`
- `API_INTERNAL_BASE_URL`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`

## First install

The official install flow is two-step on purpose.

### Step 1: Prepare and initialize

Build the runtime images and apply migrations before first start:

```bash
docker compose build web api
docker compose run --rm migrate
```

`docker compose run --rm migrate` is the canonical schema lifecycle command. It also handles first-time SQLite file creation for the default `file:/data/haaabit.db` path.

### Step 2: Start and verify

Start the stack and run the top-level health check:

```bash
docker compose up -d
./scripts/self-host/check.sh
```

If the health check passes, open:

- `${APP_BASE_URL}/`
- `${APP_BASE_URL}/api/docs`
- `${APP_BASE_URL}/api/openapi.json`

## What the health check validates

`./scripts/self-host/check.sh` verifies:

- `proxy`, `web`, and `api` are running
- `${APP_BASE_URL}/health` returns `{ "ok": true }`
- `${APP_BASE_URL}/api/openapi.json` is reachable
- the web entrypoint returns HTML through the public proxy

## Troubleshooting

### `BETTER_AUTH_SECRET is required`

Your `.env` is missing `BETTER_AUTH_SECRET`, or it is too short. Generate a new one with `openssl rand -hex 32`.

### `APP_BASE_URL` does not match where you are browsing

Set `APP_BASE_URL` to the actual public URL operators will use, including the port when not using default HTTP ports.

### `docker compose run --rm migrate` fails on first install

Re-run it before `docker compose up -d`. The runtime services are not expected to initialize schema automatically.

### `/health` works but `/api/*` does not

This indicates the proxy is up but API routing is wrong. Re-check `docker-compose.yml`, `docker/caddy/Caddyfile`, and rerun `./scripts/self-host/check.sh`.

### The web app starts but server-side data loads fail

Check `API_INTERNAL_BASE_URL`. In the official topology it should keep pointing at `http://api:3001`.

## Rehearsal helpers

For repeatable operator-path checks:

```bash
./scripts/self-host/verify-clean-install.sh
./scripts/self-host/verify-upgrade.sh
```

These scripts are intended to mirror the documented flow rather than replace it.
