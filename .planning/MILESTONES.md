# Milestones

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
