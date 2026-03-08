# Haaabit

## What This Is

Haaabit is a shipped, self-hostable habit tracking product for individual users that is designed AI-first rather than UI-first. It now combines a calm, polished web surface for daily execution, history, analytics, and API access with a stable backend that lets an AI assistant query what should be done today and complete habit check-ins on the user's behalf.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Current State

- **Shipped milestones:** v1.0 on 2026-03-07 and v1.1 on 2026-03-08
- **Delivered surfaces:** trust-forward auth, Today-first dashboard, habits management/detail views, API Access, accessibility-gated polish, bearer-authenticated REST API, OpenAPI JSON/docs, and Docker-first self-host deployment
- **Current stack:** Next.js 16, Fastify, Better Auth, Prisma with SQLite/libsql, Vitest, Playwright, Docker Compose, and Caddy
- **Frontend baseline:** shared design tokens, typography, primitives, overlays, responsive shell grammar, and reduced-motion-safe interaction patterns are now established across the web app
- **Accepted tech debt:** v1.1 archive-time debt is mostly planning metadata: empty summary `requirements_completed` arrays, stale Phase 11 validation metadata, and a PROJECT narrative that needed archive-time refresh
- **Planning status:** no active milestone; ready to define the next roadmap

## Next Milestone Goals

- Define the next milestone with `$gsd-new-milestone`.
- Decide whether the next step should deepen UI/platform quality or expand product scope.
- Highest-value known candidates:
  - dark-mode parity and broader theming options
  - personalization or keyboard-shortcut productivity affordances
  - MCP and richer AI-side integrations built on the existing REST semantics
  - reminder-email configuration and delivery workflows

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

### Active

- [ ] Define the next milestone goals and roadmap.

### Out of Scope

- AI-driven reminder scheduling or autonomous reminder loops — external AI systems should handle reminder orchestration.
- Team collaboration and multi-user workspace features — the product remains focused on personal self-use.
- Multi-tenant SaaS operations — the architecture is still intentionally self-host-first and operator-simple.
- Passkeys, OAuth providers, or auth-model expansion — keep the auth model simple unless a future milestone deliberately reopens it.
- New habit semantics or recurrence-rule expansion — preserve stable domain behavior unless a future milestone requires it.

## Context

The product now spans two shipped milestones. v1.0 proved the personal self-host workflow end to end: auth, onboarding, daily execution, habit management, analytics, AI REST access, and Docker-first deployment. v1.1 then rebuilt the full web surface around one calmer design language, one shell/state grammar, and an explicit accessibility release gate. The next meaningful product decision is no longer “can this ship?” but “which future capability deserves to be the next milestone?”

## Constraints

- **Product scope**: Personal self-use first — avoid designing around team workflows or SaaS complexity unless a future milestone reopens them.
- **AI integration**: REST is the proven base; MCP should reuse the same domain semantics instead of forking behavior.
- **Authentication**: Standard registration/login remains the baseline until a later milestone explicitly broadens auth scope.
- **Deployment**: Self-hosted and Docker-friendly — setup should stay practical for users running the app on their own infrastructure.
- **Open source**: Future public release expected — repository structure, docs, and dependencies should stay contributor-friendly.
- **Theme**: Light mode first — only expand theme scope when it becomes an explicit milestone goal.
- **Design source of truth**: `CLAUDE.md` design context plus `teach-impeccable` guidance — future frontend work should reuse one persistent aesthetic baseline.
- **Contract stability**: Existing habit semantics, AI REST contracts, and self-host operator model should remain stable unless a future milestone intentionally reopens them.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first habit state access is the main priority | The user wanted AI to know what must be done today and act on it accurately | ✓ Good — delivered through today/stats APIs and task-oriented actions |
| Reminder orchestration stays outside the app | External AI systems can own loops and scheduling while the product focuses on dependable data/actions | ✓ Good — kept scope tight and preserved the core value |
| v1 targets individual self-hosting before team scenarios | Narrowing scope keeps the first release useful and deployable without SaaS complexity | ✓ Good — allowed the whole v1 surface to ship in one milestone |
| v1 ships REST before MCP | Stable API behavior is the foundation; MCP can build on top later | ✓ Good — bearer auth, contracts, and docs are now the integration baseline |
| Web and API remain separate services behind one public proxy | Preserves codebase separation while keeping the operator model simple | ✓ Good — Compose + Caddy stack verified through clean install and upgrade rehearsal |
| Today mutations persist current state plus append-only mutation history | Needed reversible quantity flows, provenance, and consistent analytics | ✓ Good — complete/set-total/undo semantics stayed trustworthy across milestones |
| v1.1 focuses on whole-app UI/UX polish instead of new product capabilities | The shipped foundation was stable; the biggest remaining gap was trust and presentation quality | ✓ Good — delivered a coherent polished product without changing core contracts |
| `teach-impeccable` becomes the persistent design reference for future frontend work | The project needed a repeatable design language rather than isolated page styling | ✓ Good — shared tokens/primitives/shell grammar now anchor the frontend baseline |
| v1.1 should be light-mode first and calm/refined in tone | The target users needed clarity and trust more than visual novelty | ✓ Good — the shipped surface now has a consistent, calm, readable light-mode identity |

## Historical Notes

<details>
<summary>v1.1 planning snapshot</summary>

### Milestone Goal

Rework the shipped v1 product surface into a calm, refined, whole-app experience without changing the core habit model or AI contracts.

### Original v1.1 target themes

- Establish a shared visual language and repeatable design primitives across the web app.
- Rebuild auth, dashboard, habits, detail, and API Access around clearer hierarchy and stronger interaction states.
- Improve responsiveness, empty/loading/error states, and perceived quality on both desktop and mobile.
- Use the `teach-impeccable` design context as the persistent standard for future frontend work.

</details>

---
*Last updated: 2026-03-08 after v1.1 milestone*
