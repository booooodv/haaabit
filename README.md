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
- **MCP package for AI hosts** — publishable `@haaabit/mcp` package that exposes the same personal-token-compatible habits, today, and stats surface over local `stdio`
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

## OpenClaw Native Plugin / OpenClaw 原生插件

Haaabit now ships a native OpenClaw plugin for the OpenClaw host:

- Package: [`@haaabit/openclaw-plugin`](./packages/openclaw-plugin/README.md)
- Canonical OpenClaw setup asset: [`packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](./packages/openclaw-plugin/examples/openclaw-plugin.jsonc)
- Runtime env: `HAAABIT_API_URL` + `HAAABIT_API_TOKEN`
- Tool contract: direct `habits_*`, `today_*`, and `stats_get_overview` tools backed by the Haaabit API
- Result contract: stable JSON envelopes shaped as `{ ok, toolName, summary, data }` on success and `{ ok, toolName, error }` on failure
- Optional workflow guidance: [`skills/haaabit-mcp`](./skills/haaabit-mcp/SKILL.md) and [`.agents/skills/haaabit-mcp`](./.agents/skills/haaabit-mcp/SKILL.md)

Recommended OpenClaw strategy:

1. Load the native plugin first with [`packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](./packages/openclaw-plugin/examples/openclaw-plugin.jsonc).
2. Inject `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` into the plugin runtime.
3. If the host also supports workspace Skills, add [`skills/haaabit-mcp`](./skills/haaabit-mcp/SKILL.md) as optional routing guidance. Do not treat the Skill as the transport layer.
4. If you only have account credentials, run `npx -y @haaabit/mcp bootstrap-token --api-url <...> --email <...>` once, then store the returned personal API token as `HAAABIT_API_TOKEN`.

## MCP Package / MCP 包

Haaabit also ships a standalone MCP package for generic MCP clients:

- Package: [`@haaabit/mcp`](./packages/mcp/README.md)
- Transport: local `stdio`
- Canonical generic-host setup: [`packages/mcp/README.md`](./packages/mcp/README.md)
- Built-in guidance: `haaabit_assistant_workflow` prompt and `haaabit://guides/workflow` resource
- Best fit: generic MCP clients, Claude Code MCP, Inspector, one-shot `bootstrap-token`

If the agent also supports repo-local Skills, invoke `$haaabit-mcp` for stronger today-first guidance, including bilingual trigger phrases like `今天还剩哪些习惯没做？`, `撤销刚才的打卡。`, or `How am I doing this week?`.

See [`packages/openclaw-plugin/README.md`](./packages/openclaw-plugin/README.md) for the native OpenClaw path, [`packages/mcp/README.md`](./packages/mcp/README.md) for generic MCP hosts, [AI Agent Integration / AI 机器人接入](./docs/ai-agent-integration.md) for host-by-host guidance, and [OpenClaw Troubleshooting](./docs/openclaw-troubleshooting.md) for symptom-driven fixes.

## Project Structure / 项目结构

```
apps/
  api/          Fastify API server
  web/          Next.js web app
packages/
  contracts/    Shared Zod schemas and TypeScript types
  openclaw-plugin/ Native OpenClaw plugin package
  mcp/          MCP server package for generic AI hosts
prisma/         Database schema and migrations
docker/         Caddy config
docs/           Self-hosting guides
```

## License / 许可证

[MIT](./LICENSE)
