# Haaabit

## What This Is

Haaabit is a self-hostable habit tracking web app for individual users that is designed AI-first rather than UI-first. It gives users a clear view of today's habits, history, and statistics, while exposing reliable backend capabilities so an AI assistant can query what should be done today and mark habits complete on the user's behalf.

## Core Value

Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Provide a usable web interface for viewing today's habits, completed habits, history, and core statistics.
- [ ] Let users create, edit, archive, and manually check in habits with flexible frequency and target definitions.
- [ ] Expose stable REST API endpoints so AI assistants can query today's pending/completed habits, habit details, and statistics, and update check-in state.
- [ ] Support standard account login for self-hosted personal use without adding unnecessary operational complexity.
- [ ] Make self-hosted deployment straightforward with Docker-first setup and clear project documentation.

### Out of Scope

- AI-driven reminder scheduling or autonomous reminder loops — external AI systems should handle reminder orchestration.
- Built-in email reminder workflows in v1 — email service integration is not part of the initial release scope.
- Team collaboration and multi-user workspace features — v1 is focused on personal self-use.
- MCP as a first-phase deliverable — v1 prioritizes stable REST API first, with MCP added in a later phase.

## Context

The project is intended to be open source and self-hostable. It serves two audiences at once: the end user who needs a clean habit tracking interface, and the AI assistant that needs dependable access to habit state and statistics. The user already has a drafted requirements document that emphasizes Docker deployment, API clarity, and future MCP support. The product should be designed around AI use cases first, then reflected coherently in the frontend and data model rather than treating AI integration as a secondary add-on.

## Constraints

- **Product scope**: Personal self-use first — avoid designing v1 around team workflows or broad SaaS complexity.
- **AI integration**: REST API is required in v1; MCP can come later — the initial delivery must make AI querying and check-in actions dependable before expanding the integration surface.
- **Authentication**: Standard registration/login is in scope — the system should support normal user accounts instead of only a single hardcoded admin flow.
- **Deployment**: Self-hosted and Docker-friendly — setup should be practical for users running the app on their own infrastructure.
- **Open source**: Future public release expected — repository structure, docs, and dependencies should stay contributor-friendly.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first habit state access is the main priority | The user explicitly wants AI to know what must be done today and to mark completion accurately | — Pending |
| Reminder orchestration stays outside the app | External AI systems can handle loops/reminders; the app should focus on clean data and actions | — Pending |
| v1 targets individual self-hosting before team scenarios | Narrowing scope keeps the first release useful and deployable without extra product complexity | — Pending |
| v1 ships REST before MCP | Stable API behavior is the foundation; MCP can build on top later | — Pending |
| Email reminder features are excluded from v1 | The user deprioritized email for the initial release | — Pending |

---
*Last updated: 2026-03-07 after initialization*
