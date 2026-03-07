# haaabit

Self-hosted habit tracking focused on making "what should I do today?" legible to both humans and AI callers.

## Self-hosting

The official self-hosted path is a single public entrypoint backed by three services:

- `proxy` for public routing
- `web` for the Next.js app
- `api` for auth, habits, today, stats, and OpenAPI

Start here:

- [Self-host install guide](/Users/finn/code/haaabit/.worktrees/phase-2-today-engine/docs/self-hosting.md)
- [Self-host upgrade guide](/Users/finn/code/haaabit/.worktrees/phase-2-today-engine/docs/self-hosting-upgrades.md)

## Quick commands

```bash
cp .env.example .env
docker compose build web api
docker compose run --rm migrate
docker compose up -d
./scripts/self-host/check.sh
```

The guides above document the full two-step install flow, backup-first upgrades, and repeatable verification scripts.
