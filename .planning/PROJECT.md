# Haaabit

## What This Is

Haaabit is a shipped, self-hostable habit tracking product for individual users that is designed AI-first rather than UI-first. It now includes a publishable MCP package alongside the web app and REST API, so AI hosts can query and act on habits through the same personal-token-compatible backend semantics.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Current State

- **Latest shipped milestone:** v1.5 MCP Integration (archived on 2026-03-09)
- **Delivered surfaces:** web product, bearer-authenticated REST API, bilingual docs/UI, self-host deployment stack, and publishable `@haaabit/mcp`
- **Current MCP baseline:** local `stdio` transport, generic-client-ready package docs, full habits/today/stats read+write tool coverage, centralized MCP-facing error semantics, and release-gated build/test/API parity
- **Current stack:** Next.js 16, Fastify, Better Auth, Prisma with SQLite/libsql, Vitest, Playwright, Docker Compose, Caddy, and the MCP SDK
- **Milestone stats:** 4 phases, 11 plans, 22 planned tasks, 38 changed files in the working milestone set, and roughly 4h22m from first execution artifact to final verification
- **Accepted deferred scope:** remote Streamable HTTP transport, MCP registry publication metadata, and minor publication polish items such as `error.tsx`, `not-found.tsx`, and Docker `pnpm` parity

## Next Milestone Goals

No next milestone is defined yet.

Use `$gsd-new-milestone` to choose the next direction. Likely candidates from the current backlog:

- Remote MCP transport and deployment packaging
- MCP registry metadata and publication polish
- Broader product capability work such as notifications, dark mode, or keyboard-first productivity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first habit state access is the main priority | The product exists to let AI know what must be done today and act on it accurately | ✓ Good |
| Web and API remain separate services behind one public proxy | Keeps codebase separation while preserving a simple self-host operator model | ✓ Good |
| REST ships before MCP | Stable API behavior is the base contract; MCP wraps it instead of replacing it | ✓ Good |
| Localization preserves user-authored data and API payload literals | Avoids mutating user content or destabilizing AI-facing contracts | ✓ Good |
| Open-source prep should fix safety/publication blockers before optional polish | Security and repository quality mattered more than cosmetic extras before public release | ✓ Good |
| MCP lives in `packages/mcp` as a thin adapter over the shipped REST API | Reuses `@haaabit/contracts`, avoids drift, and keeps API and MCP versioned together | ✓ Good |
| v1.5 targets generic MCP clients through local `stdio` first | Matches current operator expectations and avoids premature remote auth complexity | ✓ Good |

## Historical Context

<details>
<summary>Archived project context through v1.5 planning</summary>

# Haaabit

## What This Is

Haaabit is a shipped, self-hostable habit tracking product for individual users that is designed AI-first rather than UI-first. It combines a calm web interface for daily execution, history, analytics, API access, self-host operations, and bilingual use with a stable backend that lets an AI assistant query what should be done today and complete habit check-ins on the user's behalf.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Current State

- **Latest shipped milestone:** v1.4 Open Source Readiness (completed locally and archived on 2026-03-09)
- **Delivered surfaces:** auth, Today-first dashboard, habits management/detail, API Access, bilingual quickstart and self-host docs, locale-aware API docs UI, bearer-authenticated REST API, and Docker-first self-host deployment
- **Current stack:** Next.js 16, Fastify, Better Auth, Prisma with SQLite/libsql, Vitest, Playwright, Docker Compose, and Caddy
- **Frontend baseline:** shared tokens, typography, primitives, overlays, responsive shell grammar, keyboard/focus-safe interaction patterns, and reduced-motion-safe behavior
- **Localization baseline:** Simplified Chinese and English supported across the shipped product and docs, with browser-based defaulting, remembered manual override, and stable English technical literals for commands/contracts
- **Open-source baseline:** API tokens are hashed at rest, browser auth drafts avoid password persistence, repository ignore rules and MIT licensing are in place, and duplicated API hygiene helpers/mappers are centralized
- **Accepted tech debt:** v1.2 archive-time process debt includes a missing `12-VALIDATION.md`; v1.3 closed product bugs in code, but its planning archive was not preserved in the tracked repository docs; v1.4 was archived without a standalone milestone audit file

## Current Milestone: v1.5 MCP Integration

**Goal:** Add a generic-client-friendly MCP server package inside the monorepo so AI hosts can use Haaabit's existing personal-token API surface through MCP without introducing a second backend or a second auth model.

**Target features:**
- Ship a standalone `packages/mcp` workspace package that can also be published as `@haaabit/mcp`
- Expose the full personal-token-compatible habits, today, and stats API surface as MCP tools
- Reuse `@haaabit/contracts` and existing API semantics so MCP tool schemas stay aligned with REST behavior
- Support generic MCP clients through local `stdio` launch, env-based configuration, and npm/npx usage docs

## Requirements

### Validated

- ✓ Provide a usable web interface for viewing today's habits, completed habits, history, and core statistics — v1.0
- ✓ Let users create, edit, archive, and manually check in habits with flexible frequency and target definitions — v1.0
- ✓ Expose stable REST API endpoints so AI assistants can query today's pending/completed habits, habit details, and statistics, and update check-in state — v1.0
- ✓ Support standard account login for self-hosted personal use without adding unnecessary operational complexity — v1.0
- ✓ Make self-hosted deployment straightforward with Docker-first setup and clear project documentation — v1.0
- ✓ Establish a shared design system foundation instead of continuing page-by-page inline styling — v1.1
- ✓ Make the full signed-in and signed-out experience feel visually consistent, production-ready, and clearly tiered in priority — v1.1
- ✓ Improve interaction polish, responsive behavior, and system states without changing the underlying habit/check-in semantics — v1.1
- ✓ Resolve the UI-adjacent v1 tech debt that would undermine a broader release push — v1.1
- ✓ Add one shared locale system for Simplified Chinese and English with browser default detection, English fallback, and remembered manual switching — v1.2
- ✓ Localize shipped product-owned UI copy and docs without translating user-authored habit data or changing API payload contracts — v1.2
- ✓ Verify bilingual product behavior across desktop/mobile routing, focus continuity, reduced motion, and API/docs surfaces — v1.2
- ✓ Fix the shipped bug clusters around today semantics, analytics correctness, registration control, and UI regressions without widening product scope — v1.3
- ✓ Persistent secrets are no longer recoverable from database rows or browser storage in the default shipped paths — v1.4
- ✓ The repository can be published without leaking local machine artifacts, AI tooling state, test output, or unclear usage rights — v1.4
- ✓ Open-source first impression meets a minimum cleanliness bar through removal of obvious dead code and low-value duplication — v1.4

### Active

- [ ] Ship a standalone MCP server package inside the monorepo instead of adding a parallel service or forking domain logic.
- [ ] Make the existing bearer-authenticated habits, today, and stats capabilities callable as MCP tools without redefining schemas by hand.
- [ ] Keep MCP configuration on the existing API base URL plus personal API token model; do not add a second auth system.
- [ ] Make the package usable by generic MCP clients via `stdio`, npm publication, and copy-pasteable setup docs.

### Out of Scope

- Team collaboration and multi-user workspace features — the product remains focused on personal self-use.
- Multi-tenant SaaS operations — the architecture remains intentionally self-host-first and operator-simple.
- Passkeys, OAuth providers, or broader auth-model expansion — keep the auth model simple unless a future milestone deliberately reopens it.
- New habit semantics or recurrence-rule expansion — preserve stable domain behavior unless a future milestone requires it.
- Automatic translation of user-entered habit names or categories — preserve user data exactly as entered.
- API payload localization for AI clients — keep API response contracts stable unless a future milestone explicitly reopens them.
- Browser-session auth flows and admin registration management as MCP tools — those routes are interactive/cookie-oriented and do not fit the personal-token MCP path.
- Remote Streamable HTTP deployment for Haaabit MCP — v1.5 targets a local `stdio` package first, with remote transport possible later if needed.
- Token bootstrap or token rotation from inside the MCP server — the MCP package should consume an existing personal token, not manage its own bootstrap secrets.
- Optional publication-polish leftovers such as `error.tsx`, `not-found.tsx`, and Docker `pnpm` version parity — useful, but deferred behind MCP delivery.

</details>

---
*Last updated: 2026-03-09 after completing and archiving milestone v1.5 MCP Integration*
