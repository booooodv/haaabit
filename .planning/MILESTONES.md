# Milestones

## v1.6 OpenClaw Compatibility (Shipped: 2026-03-10)

**Phases completed:** 4 phases, 11 plans, 22 tasks

**Key accomplishments:**
- Shipped a workspace-visible `skills/haaabit-mcp/SKILL.md` plus one canonical `packages/mcp/examples/openclaw.jsonc` asset so OpenClaw operators have a single host-facing setup contract.
- Hardened MCP startup diagnostics around `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`, including wrong-shape hints and a supported `bootstrap-token` handoff for operators who start from account credentials.
- Aligned the repo README, package README, skill guidance, and troubleshooting docs so OpenClaw clearly separates workflow guidance, MCP runtime wiring, and secret injection.
- Added `docs/openclaw-validation-checklist.md`, `pnpm verify:openclaw`, and `pnpm verify:openclaw:full` as the reusable release gate for OpenClaw plus generic MCP-client regressions.
- Closed the milestone without regressing the shipped generic `stdio` MCP path or the underlying API contract behavior.

**Audit outcome:** `tech_debt` accepted for archival. See `milestones/v1.6-MILESTONE-AUDIT.md`.

---

## v1.5 MCP Integration (Shipped: 2026-03-09)

**Phases completed:** 4 phases, 11 plans, 22 tasks

**Key accomplishments:**
- Added a real `packages/mcp` workspace package that can be published as `@haaabit/mcp` and launched by generic MCP clients over local `stdio`.
- Reused the shipped bearer-authenticated API and shared contracts instead of introducing a second backend or duplicating schema definitions.
- Shipped full habits, today, and stats read/write MCP tool coverage with centralized MCP-facing error semantics.
- Added package-local operator docs, generic `npx` setup examples, and README smoke checks tied to the actual package metadata and tool inventory.
- Closed the milestone with a release gate covering package build, full MCP Vitest coverage, built-CLI stdio discovery/read/write integration, and upstream API contract regressions.

**Audit outcome:** `passed`. See `milestones/v1.5-MILESTONE-AUDIT.md`.

---

## v1.4 Open Source Readiness (Shipped: 2026-03-09)

**Phases completed:** 3 phases, 7 plans, 14 tasks

**Key accomplishments:**
- Eliminated recoverable API-token storage by hashing tokens at rest, backfilling legacy plaintext rows, and switching token reads to metadata-only responses.
- Removed browser-side password draft persistence while preserving non-secret auth form context across reloads.
- Tightened the repository publication baseline with locked ignore coverage, a root MIT `LICENSE`, and deletion of stale dead code.
- Centralized duplicated Fastify auth/timestamp helpers and habit contract enum mappers into shared API modules without changing shipped route or contract behavior.
- Closed the milestone with a green release gate across repository metadata checks, full API Vitest, web production build, and focused Playwright critical paths.

**Audit outcome:** No standalone `v1.4-MILESTONE-AUDIT.md` was present at archival time; milestone was archived from phase-level verification evidence and accepted as no-audit tech debt.

---

## v1.0 milestone (Shipped: 2026-03-07)

**Phases completed:** 6 phases, 16 plans, 48 tasks

**Key accomplishments:**
- Delivered secure auth, protected web shell, and first-habit onboarding on top of an explicit habit recurrence model.
- Made `today` trustworthy with a canonical habit-day clock, reversible complete/undo flows, quantified check-ins, and provenance-aware AI actions.
- Added full habit management, archive/restore, direct-link detail views, and history-safe per-habit statistics.
- Added dashboard overview analytics, 7-day/30-day trends, and consistency checks that keep stats aligned with check-in mutations.
- Exposed bearer-authenticated REST coverage for habits, today, and stats, plus `/api/openapi.json` and `/api/docs`.
- Finished v1 with a self-hosted Compose stack, migration workflow, health checks, operator runbooks, and clean-install/upgrade rehearsals.

**Audit outcome:** `tech_debt` accepted for v1.0 archival. See `milestones/v1.0-MILESTONE-AUDIT.md`.

---

## v1.1 milestone (Shipped: 2026-03-08)

**Phases completed:** 5 phases, 15 plans, 32 tasks

**Key accomplishments:**
- Established shared design tokens, typography, primitives, overlays, and selector contracts across the web app.
- Unified the signed-in shell, system-state grammar, responsive behavior, and restrained motion policy for desktop and mobile.
- Refreshed auth and the dashboard/today loop into a trust-forward, Today-first experience with calmer in-place feedback.
- Reworked habits, detail, and API Access into one consistent management-family surface with summary-first hierarchy and safer token handling.
- Added accessibility release gates for axe smoke, keyboard/focus continuity, contrast, reduced motion, and explicit manual sign-off.

**Audit outcome:** `tech_debt` accepted for v1.1 archival. See `milestones/v1.1-MILESTONE-AUDIT.md`.

---

## v1.2 milestone (Shipped: 2026-03-08)

**Phases completed:** 3 phases, 8 plans, 24 tasks

**Key accomplishments:**
- Added one shared locale system with browser-language detection, English fallback, and remembered manual switching across auth and the protected shell.
- Localized dashboard, today, habits, detail, onboarding, and API Access while preserving user-authored habit data exactly as entered.
- Added bilingual quickstart and self-host documentation with repository-safe links and operator guidance for locale behavior.
- Localized `/api/docs` while keeping `/api/openapi.json` and technical contract literals in English.
- Closed the milestone with bilingual regression coverage across desktop/mobile routing, keyboard focus continuity, reduced motion, API docs access, and docs integrity checks.

**Audit outcome:** `tech_debt` accepted for v1.2 archival. See `milestones/v1.2-MILESTONE-AUDIT.md`.

---
