# Haaabit

## What This Is

Haaabit is a shipped, self-hostable habit tracking product for individual users that is designed AI-first rather than UI-first. It now ships a web app, a bearer-authenticated REST API, a publishable `@haaabit/mcp` package, and an OpenClaw-ready host integration path so AI hosts can discover guidance, launch MCP tools, and inject secrets through one documented setup story.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Current State

- **Latest shipped milestone:** v1.6 OpenClaw Compatibility (shipped 2026-03-10, archived 2026-03-11)
- **Delivered surfaces:** web product, bearer-authenticated REST API, bilingual docs/UI, self-host deployment stack, publishable `@haaabit/mcp`, and OpenClaw-ready operator guidance
- **Current MCP baseline:** local `stdio` transport, generic-client-ready package docs, full habits/today/stats read+write tool coverage, centralized MCP-facing error semantics, and release-gated build/test/API parity
- **Current interoperability baseline:** Haaabit now ships a workspace-visible `skills/haaabit-mcp/SKILL.md`, a canonical `packages/mcp/examples/openclaw.jsonc`, aligned repo/package docs, a dedicated troubleshooting guide, and an explicit OpenClaw validation checklist
- **Current OpenClaw gap:** OpenClaw still reaches Haaabit tools through the chain `skill -> mcporter/runner -> MCP -> API`, which adds transport indirection for the host that most needs native tool availability
- **Current auth baseline:** steady-state MCP auth remains `HAAABIT_API_URL` plus personal API token, and `bootstrap-token` is the supported one-shot handoff for operators who start from account credentials
- **Current verification baseline:** `pnpm verify:openclaw` and `pnpm verify:openclaw:full` now serve as the reusable release gate for OpenClaw plus generic MCP-client regressions
- **Current stack:** Next.js 16, Fastify, Better Auth, Prisma with SQLite/libsql, Vitest, Playwright, Docker Compose, Caddy, and the MCP SDK
- **Accepted tech debt:** v1.6 archived with non-blocking process debt (missing standalone `22-VERIFICATION.md` through `25-VERIFICATION.md`, `wave_0_complete: false` in the v1.6 validation docs, and real OpenClaw UI/secret-store validation still marked external-host-only); older accepted archive debt from v1.2/v1.3/v1.4 remains historical context only

## Current Milestone: v1.7 OpenClaw Native Plugin

**Goal:** Replace the current OpenClaw `skill -> mcporter -> MCP -> API` path with a native OpenClaw plugin package that calls the shipped Haaabit API directly.

**Target features:**
- Ship `packages/openclaw-plugin` as the native OpenClaw integration package and expose the existing Haaabit habits/today/stats tool surface without MCP forwarding
- Reuse the existing Haaabit API client, contracts/types, and bearer-token auth semantics instead of duplicating business logic or schema definitions
- Keep plugin runtime config to `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`, with fail-fast diagnostics for missing config, network failures, not-found targets, and wrong-kind mutations
- Return structured JSON envelopes that agents can consume directly, rather than surfacing raw HTTP responses
- Publish one canonical OpenClaw-native setup and verification path for fresh sessions, while keeping generic MCP support as a separate integration story

**Active requirements:**
- Native OpenClaw tools should be directly callable in a new session without a separate MCP bridge
- Plugin implementation must stay thin and reuse the shipped API/auth/contracts stack
- Errors and success payloads must stay structured and agent-readable

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
| v1.6 optimizes host interoperability without assuming repo-local Skill support or automatic skill-to-MCP binding | OpenClaw-style hosts can separate guidance discovery from actual tool wiring | ✓ Good |
| OpenClaw compatibility ships as a workspace-visible skill plus a paired MCP runtime contract | Operators need one canonical path that explains guidance, runtime, and secret injection together | ✓ Good |
| Steady-state MCP auth remains token-oriented, with account credentials handled only through explicit bootstrap handoff | This resolves setup friction without turning passwords into the runtime auth model | ✓ Good |
| Verification ships as explicit scripts plus a checklist, with external-host-only steps called out honestly | Milestone close needs reproducible in-repo evidence without pretending to emulate the full host UI | ✓ Good |
| v1.7 should replace the OpenClaw MCP bridge with a native plugin package while preserving the shipped API contract | OpenClaw is the host where extra transport indirection hurts most, but the domain logic already exists in the API layer | — Pending |
| OpenClaw plugin work should reuse the existing API client/contracts/error semantics instead of forking OpenClaw-only domain code | The transport is changing; the business rules and payload contracts should stay single-sourced | — Pending |

## Historical Context

<details>
<summary>Archived context through v1.6 completion</summary>

### Shipped Baseline Through v1.6

- v1.0 delivered the web product, core API, habit model, and self-host deployment baseline.
- v1.1 established the design system, responsive polish, and accessibility/reduced-motion release gates.
- v1.2 added the shared Simplified Chinese and English localization system across product and docs.
- v1.3 fixed shipped bugs around today semantics, analytics correctness, registration control, and UI regressions.
- v1.4 hardened secret handling and repository open-source readiness.
- v1.5 added the publishable `@haaabit/mcp` package and generic MCP-client `stdio` integration path.
- v1.6 closed the OpenClaw interoperability gap with a canonical host-facing skill, config asset, bootstrap handoff, troubleshooting docs, and named verification gates.

### Historical Deferred Scope

- Remote Streamable HTTP transport is still deferred beyond the archived local-host path.
- MCP Registry ownership/metadata and extra publication polish remain backlog candidates rather than archived blockers.
- Browser-session/admin auth routes remain intentionally out of scope for MCP tools because the supported model is personal-token based.

### Historical Archive Notes

- v1.2 archive-time process debt included a missing `12-VALIDATION.md`.
- v1.3 shipped in the codebase, but its planning archive was not preserved in this repository snapshot.
- v1.4 was archived without a standalone milestone audit file.
- v1.6 was audited as `tech_debt`, not `gaps_found`, because the remaining issues were process evidence gaps rather than runtime blockers.

</details>

---
*Last updated: 2026-03-11 after defining v1.7 OpenClaw Native Plugin*
