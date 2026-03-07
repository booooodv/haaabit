# Haaabit

## What This Is

Haaabit is a shipped, self-hostable habit tracking product for individual users that is designed AI-first rather than UI-first. It gives users a clean web surface for today's habits, history, and analytics, while exposing reliable backend capabilities so an AI assistant can query what should be done today and mark habits complete on the user's behalf.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Current State

- **Shipped milestone:** v1.0 on 2026-03-07
- **Delivered surfaces:** protected web app, habit management/detail views, overview analytics, bearer-authenticated REST API, OpenAPI JSON/docs, and Docker-first self-host deployment
- **Current stack:** Next.js 16, Fastify, Better Auth, Prisma with SQLite/libsql, Vitest, Playwright, Docker Compose, and Caddy
- **Accepted tech debt:** one stale browser regression around first-habit onboarding, brittle dashboard SSR error handling around today/overview fetches, slightly imprecise self-host health wording, and partial Phase 1 Nyquist metadata
- **Planning status:** v1.0 archived on 2026-03-08; next milestone not defined yet

## Requirements

### Validated

- ✓ Provide a usable web interface for viewing today's habits, completed habits, history, and core statistics — v1.0
- ✓ Let users create, edit, archive, and manually check in habits with flexible frequency and target definitions — v1.0
- ✓ Expose stable REST API endpoints so AI assistants can query today's pending/completed habits, habit details, and statistics, and update check-in state — v1.0
- ✓ Support standard account login for self-hosted personal use without adding unnecessary operational complexity — v1.0
- ✓ Make self-hosted deployment straightforward with Docker-first setup and clear project documentation — v1.0

### Active

- [ ] Add an MCP surface that wraps the same domain capabilities already proven through the REST API.
- [ ] Expand AI-facing insights with richer interruption analysis and habit-risk/coaching signals.
- [ ] Decide whether reminder-related email configuration becomes a supported operator feature or stays outside the product boundary.
- [ ] Retire the accepted v1 tech debt before a broader public release push.

### Out of Scope

- AI-driven reminder scheduling or autonomous reminder loops — external AI systems should handle reminder orchestration.
- Team collaboration and multi-user workspace features — v1 is focused on personal self-use.
- Multi-tenant SaaS operations — the shipped architecture is intentionally self-host-first and operator-simple.

## Context

The v1.0 codebase now covers the full personal self-host workflow end to end: auth, first-habit onboarding, daily execution, editing/archive/detail views, account analytics, AI REST access, and Docker-first deployment. The product serves two audiences at once: the end user who needs a coherent habit-tracking interface, and the AI assistant that needs dependable access to habit state and statistics. The next milestone can build on a stable, documented API and a verified self-host runtime instead of still proving the foundation.

## Constraints

- **Product scope**: Personal self-use first — avoid designing v1 around team workflows or broad SaaS complexity.
- **AI integration**: REST is the proven base; MCP should reuse the same domain semantics instead of forking behavior.
- **Authentication**: Standard registration/login is in scope — the system should support normal user accounts instead of only a single hardcoded admin flow.
- **Deployment**: Self-hosted and Docker-friendly — setup should be practical for users running the app on their own infrastructure.
- **Open source**: Future public release expected — repository structure, docs, and dependencies should stay contributor-friendly.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first habit state access is the main priority | The user wanted AI to know what must be done today and act on it accurately | ✓ Good — delivered through today/stats APIs and task-oriented actions |
| Reminder orchestration stays outside the app | External AI systems can own loops and scheduling while the product focuses on dependable data/actions | ✓ Good — kept scope tight and preserved the core value |
| v1 targets individual self-hosting before team scenarios | Narrowing scope keeps the first release useful and deployable without SaaS complexity | ✓ Good — allowed the whole v1 surface to ship in one milestone |
| v1 ships REST before MCP | Stable API behavior is the foundation; MCP can build on top later | ✓ Good — bearer auth, contracts, and docs are now the integration baseline |
| Web and API remain separate services behind one public proxy | Preserves codebase separation while keeping the operator model simple | ✓ Good — Compose + Caddy stack verified through clean install and upgrade rehearsal |
| Today mutations persist current state plus append-only mutation history | Needed reversible quantity flows, provenance, and consistent analytics | ✓ Good — complete/set-total/undo semantics stayed trustworthy across phases |
| Dashboard overview stays above today in the same app shell | Preserves information architecture while keeping analytics tied to execution | ✓ Good — browser verification proved the same-page overview/today loop |

## Next Milestone Goals

- Add MCP access on top of the existing habit/today/stats capabilities without duplicating business logic.
- Deepen AI-facing interpretation with richer interruption, risk, and coaching-oriented read models.
- Decide whether reminder-related email delivery belongs in the next milestone or should remain external.
- Eliminate the remaining v1 technical debt before a broader public/open-source push.

---
*Last updated: 2026-03-08 after v1.0 milestone archival*
