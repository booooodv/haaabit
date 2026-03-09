# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.5 — MCP Integration

**Shipped:** 2026-03-09
**Phases:** 4 | **Plans:** 11 | **Sessions:** session-spanning

### What Was Built
- A standalone `packages/mcp` package that can be published as `@haaabit/mcp` and launched by generic MCP clients over local `stdio`.
- Full MCP tool coverage for the personal-token-compatible habits, today, and stats API surface, including both read and write flows.
- Centralized MCP-facing error semantics layered on top of the existing REST API behavior.
- Package-local README/operator docs plus a release gate that verifies package metadata, docs alignment, built stdio runtime, and upstream API parity.

### What Worked
- Keeping MCP as a thin adapter over the existing REST API and `@haaabit/contracts` avoided semantic drift and kept implementation fast.
- Built-artifact stdio integration tests gave high-confidence runtime proof without needing a separate integration harness.
- Splitting the milestone into foundation, read surface, mutation surface, and release shaping kept sequencing clear.

### What Was Inefficient
- Phase 20 and Phase 21 needed retroactive `VERIFICATION.md` reconstruction during milestone closeout to satisfy the audit workflow.
- `.planning/` being ignored in git meant archive artifacts had to be force-added explicitly during milestone archival.

### Patterns Established
- MCP work should continue to reuse shared contracts and API semantics rather than introducing adapter-local business rules.
- Release-ready package work benefits from docs smoke tests that assert against real package metadata and inventory, not only prose review.
- Milestone closeout should happen only after both audit and per-phase verification artifacts are present.

### Key Lessons
1. If a milestone depends on archived planning artifacts, keep phase verification docs current during execution instead of reconstructing them at the end.
2. For publishable packages, treat README examples as executable contract surface and test them accordingly.
3. If `.planning/` remains ignored, milestone archive steps must explicitly account for force-adding the files that should persist in git history.

### Cost Observations
- Model mix: not tracked in repository artifacts
- Sessions: session-spanning
- Notable: once the MCP contract shape was locked, the remaining work moved quickly because tests and API parity already existed

---

## Milestone: v1.4 — Open Source Readiness

**Shipped:** 2026-03-09
**Phases:** 3 | **Plans:** 7 | **Sessions:** 1

### What Was Built
- Hashed API-token storage with legacy-token migration and metadata-only reads.
- Password-free auth draft persistence plus safer API Access token reveal behavior.
- Publication-safe repository baseline with ignore coverage, MIT licensing, shared hygiene cleanup, and a green API/web release gate.

### What Worked
- Keeping the milestone narrow avoided scope drift and let security/repository risks close quickly.
- Phase-level summaries and verification reports were sufficient to finish implementation and release gating in one pass.

### What Was Inefficient
- The milestone reached archival without a dedicated `v1.4` audit file, which forced acceptance of a no-audit archival note.
- The release-gate browser suite exposed one stale expectation late, during milestone closure instead of earlier in plan execution.

### Patterns Established
- Open-source readiness work should prefer narrow, behavior-preserving cleanups validated by existing regression boundaries.
- Final release gates need both API and browser evidence before milestone closure.

### Key Lessons
1. If a milestone is meant to archive cleanly, run milestone audit before archival rather than relying only on phase verification.
2. Browser release-gate assertions should encode current domain rules carefully when setup data depends on rolling dates such as “yesterday.”

### Cost Observations
- Model mix: not tracked in repository artifacts
- Sessions: 1
- Notable: one focused cleanup/release milestone can close quickly when scope is strictly limited and regressions already exist

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.5 | session-spanning | 4 | Added a publishable MCP package and tightened the archive/audit discipline around milestone closeout |
| v1.4 | 1 | 3 | Shifted from feature expansion to public-release hygiene and release gating |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.5 | MCP 46 green + API 7 green at closeout, plus focused quick suites | Not formally tracked | 1 new workspace package (`packages/mcp`) |
| v1.4 | API 75 green + Playwright 18 green at closeout | Not formally tracked | 2 shared internal helper modules |

### Top Lessons (Verified Across Milestones)

1. Narrow milestones with explicit regression boundaries ship faster and more cleanly than mixed “cleanup + expansion” scopes.
2. Planning artifacts need the same verification discipline as code, or archival quality degrades even when implementation quality is high.
3. Thin adapter packages are easiest to ship when existing contracts, auth model, and integration tests are already stable.
