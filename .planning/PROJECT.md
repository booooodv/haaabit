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

## Next Milestone Goals

- Decide whether the next milestone is still publication polish or a return to product expansion.
- Create fresh milestone-scoped requirements and roadmap docs before resuming implementation work.
- Re-evaluate deferred publication polish (`error.tsx`, `not-found.tsx`, Docker `pnpm` version pinning) against larger roadmap items such as MCP, notifications, dark theme, and keyboard productivity.

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

- [ ] Add explicit public-release fallback routes (`error.tsx`, `not-found.tsx`) for the web app.
- [ ] Pin `Dockerfile.web` to the same `pnpm` version already assumed by the API/runtime toolchain.
- [ ] Define the first post-open-source expansion milestone with fresh requirements for MCP, notifications, dark theme, or keyboard productivity.

### Out of Scope

- Team collaboration and multi-user workspace features — the product remains focused on personal self-use.
- Multi-tenant SaaS operations — the architecture remains intentionally self-host-first and operator-simple.
- Passkeys, OAuth providers, or broader auth-model expansion — keep the auth model simple unless a future milestone deliberately reopens it.
- New habit semantics or recurrence-rule expansion — preserve stable domain behavior unless a future milestone requires it.
- Automatic translation of user-entered habit names or categories — preserve user data exactly as entered.
- API payload localization for AI clients — keep API response contracts stable unless a future milestone explicitly reopens them.
- New UX fallback pages and Docker image polish beyond the minimum publication bar — useful, but not required for the smallest safe open-source release.

## Context

The product now spans four meaningful delivery steps even though only v1.0-v1.2 are fully represented in tracked planning archives. v1.0 established the end-to-end personal self-host workflow: auth, onboarding, daily execution, habit management, analytics, AI REST access, and Docker-first deployment. v1.1 rebuilt the web product around one calmer design language and explicit accessibility gates. v1.2 widened usability by adding bilingual product and docs support for Simplified Chinese and English. The current code baseline then closed a v1.3 bugfix pass around undo semantics, registration control, analytics correctness, and UI polish.

The project has now crossed the minimum open-source-readiness bar locally. Secrets are hashed, browser auth drafts avoid password persistence, repository publication metadata is in place, and the last low-value API duplication hotspots were cleaned up under regression coverage. The next milestone is therefore a real product or publication-polish choice rather than more baseline cleanup.

## Constraints

- **Product scope:** Personal self-use first — avoid designing around team workflows or SaaS complexity unless a future milestone reopens them.
- **AI integration:** REST is the proven base; MCP should reuse the same domain semantics instead of forking behavior.
- **Authentication:** Standard registration/login remains the baseline until a later milestone explicitly broadens auth scope.
- **Deployment:** Self-hosted and Docker-friendly — setup should stay practical for users running the app on their own infrastructure.
- **Open source:** Public release is now the immediate goal — secrets, local artifacts, and licensing ambiguity must be addressed before publication.
- **Security:** Persistent credentials must be non-recoverable wherever the product stores operator or AI access secrets.
- **Repository hygiene:** Personal AI tooling state, generated local artifacts, test reports, and local databases must stay out of tracked source.
- **Contract stability:** Existing habit semantics, AI REST contracts, and self-host operator model should remain stable unless this milestone must touch them for security.
- **Localization scope:** Chinese and English only until a later milestone deliberately expands locale support.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first habit state access is the main priority | The user wanted AI to know what must be done today and act on it accurately | ✓ Good |
| Reminder orchestration stays outside the app | External AI systems can own loops and scheduling while the product focuses on dependable data/actions | ✓ Good |
| v1 targets individual self-hosting before team scenarios | Narrowing scope kept the first release useful and deployable without SaaS complexity | ✓ Good |
| v1 ships REST before MCP | Stable API behavior is the foundation; MCP can build on top later | ✓ Good |
| Web and API remain separate services behind one public proxy | Preserves codebase separation while keeping the operator model simple | ✓ Good |
| Today mutations persist current state plus append-only mutation history | Needed reversible quantity flows, provenance, and consistent analytics | ✓ Good |
| v1.1 focuses on whole-app UI/UX polish instead of new product capabilities | The shipped foundation was stable; the biggest remaining gap was trust and presentation quality | ✓ Good |
| `teach-impeccable` becomes the persistent design reference for future frontend work | The project needed a repeatable design language rather than isolated page styling | ✓ Good |
| v1.2 focuses on bilingual access rather than new domain capability | The highest leverage was widening usability for the shipped product instead of changing semantics again | ✓ Good |
| Localization uses browser default plus manual switching on one shared route structure | Covers first-run usability and explicit control without introducing account-model expansion | ✓ Good |
| User-entered habit data and API payload contracts stay untouched by localization | Lower risk than mutating user-authored data or AI-facing contracts | ✓ Good |
| `/api/docs` localizes only its explanatory UI while `/api/openapi.json` stays English-only | Keeps developer/operator docs readable without weakening contract trust | ✓ Good |
| Open-source prep should fix safety and publication blockers before optional polish | Public release amplifies security and repository-quality issues more than it rewards additional feature work | ✓ Good |

## Historical Notes

<details>
<summary>Archived milestone notes</summary>

### v1.3 shipped baseline snapshot

- Fixed today undo semantics, weekly-count ranking correctness, and admin-controlled registration behavior.
- Simplified auth and shell polish issues while preserving the shipped bilingual surface.
- Added targeted API and browser regressions around the fixed bug clusters.

### v1.2 planning snapshot

- Establish a shared locale system for Chinese and English.
- Localize product-owned UI and docs while preserving user-entered data.
- Close bilingual regression and layout risk across desktop and mobile.

### v1.1 planning snapshot

- Establish a shared visual language and reusable design primitives across the web app.
- Rebuild auth, dashboard, habits, detail, and API Access around clearer hierarchy and stronger interaction states.
- Improve responsiveness, empty/loading/error states, and perceived quality on both desktop and mobile.

</details>

*Last updated: 2026-03-09 after archiving milestone v1.4 Open Source Readiness*
