# Haaabit

Self-hosted habit tracker that makes "what should I do today?" legible to both humans and AI.

自托管习惯追踪工具，让人和 AI 都能清楚地知道"今天该做什么"。

## Features / 功能

- **Today-first dashboard** — see pending and completed habits at a glance, with completion rates and trends
- **Boolean and quantified habits** — simple yes/no or numeric targets (e.g. "Read 10 pages")
- **Flexible recurrence** — daily, specific weekdays, weekly count, or monthly count
- **Reversible check-ins** — every action creates an immutable mutation record; undo anytime
- **Streaks and analytics** — current/longest streaks, 7-day and 30-day trends, stability ranking
- **REST API with OpenAPI docs** — bearer-authenticated endpoints for habits, today, stats, and check-ins
- **AI-ready** — structured API and provenance-tracked mutations let AI agents check in on your behalf
- **Bilingual UI** — English and Chinese with browser-language detection and manual switching
- **Archive and restore** — shelve habits without losing history
- **Admin controls** — first user becomes admin; toggle new-user registration on or off
- **Single-binary deployment** — SQLite database, Docker Compose, no external services required

## Tech Stack / 技术栈

| Layer | Technology |
|-------|-----------|
| API | Fastify, Prisma, better-auth, Zod |
| Web | Next.js (App Router), CSS Modules, Radix UI |
| Database | SQLite |
| Proxy | Caddy |
| Runtime | Node.js, TypeScript, pnpm |
| Testing | Vitest (API), Playwright (E2E) |

## Quick Start (Docker) / 快速开始

```bash
git clone https://github.com/booooodv/haaabit.git
cd haaabit
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET (run: openssl rand -hex 32)

docker compose build web api
docker compose run --rm migrate
docker compose up -d
```

Open `http://localhost:8080` — the first registered user becomes admin.

For the full setup guide, see [Self-host install guide / 自托管安装指南](./docs/self-hosting.md).

For upgrades, see [Self-host upgrade guide / 自托管升级指南](./docs/self-hosting-upgrades.md).

## Local Development / 本地开发

Prerequisites: Node.js 20+, pnpm 10+

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Copy env and set BETTER_AUTH_SECRET
cp .env.example .env

# Start API and web in parallel
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/api/docs`

### Running Tests / 运行测试

```bash
# API unit tests (Vitest)
pnpm test

# E2E browser tests (Playwright)
pnpm test:e2e
```

## API Overview / API 概览

All endpoints require Bearer token authentication. Generate a personal API token from the web UI under API Access.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/today` | Today's habits with status |
| `POST` | `/api/today/complete` | Complete a boolean habit |
| `POST` | `/api/today/set-total` | Set value for a quantified habit |
| `POST` | `/api/today/undo` | Undo the latest check-in |
| `GET` | `/api/habits` | List habits (filterable) |
| `POST` | `/api/habits` | Create a habit |
| `GET` | `/api/habits/:id` | Habit detail with stats and history |
| `PATCH` | `/api/habits/:id` | Update a habit |
| `GET` | `/api/stats/overview` | Dashboard analytics |
| `GET` | `/api/openapi.json` | OpenAPI 3.1 spec |
| `GET` | `/api/docs` | Interactive API documentation |

Full request/response examples are available at `/api/docs`.

## Project Structure / 项目结构

```
apps/
  api/          Fastify API server
  web/          Next.js web app
packages/
  contracts/    Shared Zod schemas and TypeScript types
prisma/         Database schema and migrations
docker/         Caddy config
docs/           Self-hosting guides
```

## License / 许可证

[MIT](./LICENSE)
