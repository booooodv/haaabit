---
phase: 26-native-plugin-contract-and-package-scaffold
plan: 02
subsystem: native-tool-registration
tags: [openclaw, plugin, tools, catalog, registration]
requires:
  - phase: 26-native-plugin-contract-and-package-scaffold
    provides: Native plugin package scaffold, manifest, bootstrap entrypoint, and package-local test/build tooling
provides:
  - host-native Haaabit tool catalog surface for OpenClaw
  - direct `api.registerTool(...)` wiring for habits/today/stats tools
  - explicit placeholder handlers that defer API execution to Phase 27 without routing through MCP
affects: [phase-26, phase-27, openclaw, tools]
tech-stack:
  added: [native registration shell]
  patterns: [shared vocabulary reuse, explicit phase-deferred handlers]
key-files:
  created: [packages/openclaw-plugin/src/types.ts, packages/openclaw-plugin/src/tool-catalog.ts, packages/openclaw-plugin/src/register-tools.ts, packages/openclaw-plugin/test/tool-catalog.test.ts, packages/openclaw-plugin/test/tool-registration.test.ts]
  modified: [packages/openclaw-plugin/src/index.ts]
key-decisions:
  - "The OpenClaw-native package exposes the existing Haaabit tool names instead of creating host-specific aliases."
  - "Registration stays native even before real API handlers land; placeholder handlers return explicit structured `PHASE_27_PENDING` errors."
  - "Shared vocabulary reuse is anchored on the shipped inventory metadata rather than duplicated naming tables."
patterns-established:
  - "Catalog registration and handler implementation can evolve independently as long as tool names and schemas stay pinned."
requirements-completed: [OCP-01, OCP-03]
duration: ~15min
completed: 2026-03-11
---

# Phase 26 Plan 02: Native Tool Catalog and Registration Summary

**The OpenClaw plugin now registers the shipped Haaabit habits/today/stats vocabulary directly through a native tool API**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added a native tool catalog builder that mirrors the shipped Haaabit vocabulary, descriptions, and schema surfaces.
- Added a registration layer that calls `api.registerTool(...)` for every catalog entry without spawning or proxying the MCP server.
- Added explicit deferred handlers so discovery/registration is usable now while API-backed execution waits for Phase 27.

## Task Commits

No task commits were created in this workspace session. Phase 26 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/src/types.ts` - Lightweight host-native plugin and tool types.
- `packages/openclaw-plugin/src/tool-catalog.ts` - Haaabit tool catalog mapping for the native plugin surface.
- `packages/openclaw-plugin/src/register-tools.ts` - Native registration wiring plus deferred placeholder handlers.
- `packages/openclaw-plugin/src/index.ts` - Activation now builds the catalog and registers the native tool surface.
- `packages/openclaw-plugin/test/tool-catalog.test.ts` - Vocabulary/schema alignment coverage.
- `packages/openclaw-plugin/test/tool-registration.test.ts` - Native registration and placeholder handler coverage.

## Decisions Made
- Kept placeholder handlers structured and explicit instead of no-op handlers or hidden MCP proxies.
- Preserved the existing top-level Haaabit tool names so the host-native path stays aligned with the already-shipped agent guidance.
- Reused the shipped vocabulary surface rather than inventing a second OpenClaw-only contract.

## Verification

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/tool-catalog.test.ts test/tool-registration.test.ts test/plugin-bootstrap.test.ts`

## Next Plan Readiness

- Registration and catalog surfaces are now stable enough for Plan 03 to harden startup config and error behavior.

---
*Phase: 26-native-plugin-contract-and-package-scaffold*
*Completed: 2026-03-11*
