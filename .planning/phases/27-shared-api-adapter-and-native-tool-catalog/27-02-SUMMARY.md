---
phase: 27-shared-api-adapter-and-native-tool-catalog
plan: 02
subsystem: native-read-tools
tags: [openclaw, read-tools, habits, today, stats, shared-runtime]
requires:
  - phase: 27-shared-api-adapter-and-native-tool-catalog
    provides: Host-neutral runtime seam plus native handler injection path
provides:
  - real native read handlers for habits, today summary, and stats overview
  - plugin-side read regression coverage against the shared runtime seam
  - preserved MCP read behavior while shared code is reused
affects: [phase-27, phase-28, openclaw, read-tools]
tech-stack:
  added: [plugin read tool regression tests]
  patterns: [shared read operations, adapted native data payloads]
key-files:
  created: [packages/openclaw-plugin/test/read-tools.test.ts]
  modified: [packages/mcp/src/tools/habits.ts, packages/mcp/src/tools/today.ts, packages/mcp/src/tools/stats.ts, packages/openclaw-plugin/src/native-handlers.ts, packages/openclaw-plugin/test/tool-registration.test.ts]
key-decisions:
  - "Read operations now reuse the same endpoint paths, schema parsing, and summaries across both MCP and OpenClaw-native surfaces."
  - "Native read results use adapted structured data (`today`, `stats`) instead of leaking raw API wrapper objects."
  - "Read coverage landed before mutations so the shared seam could be proven on the lower-risk surface first."
patterns-established:
  - "Per-surface tool modules should expose host-neutral operations first and host-specific serializers second."
requirements-completed: [OCP-02, SHRD-01, SHRD-03]
duration: ~15min
completed: 2026-03-11
---

# Phase 27 Plan 02: Native Read Tools Summary

**The OpenClaw plugin now executes the shipped Haaabit read tools directly against the API through the shared runtime seam**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Refactored habits/today/stats read logic to expose host-neutral operations reused by both MCP and the native plugin.
- Implemented native read handlers for `habits_list`, `habits_get_detail`, `today_get_summary`, and `stats_get_overview`.
- Added plugin-side read tests that pin endpoint parity, adapted data shapes, and native registration continuity.

## Task Commits

No task commits were created in this workspace session. Phase 27 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/test/read-tools.test.ts` - Native read handler regression coverage.
- `packages/mcp/src/tools/habits.ts` - Shared read operations for `habits_list` and `habits_get_detail`.
- `packages/mcp/src/tools/today.ts` - Shared read operation for `today_get_summary`.
- `packages/mcp/src/tools/stats.ts` - Shared read operation for `stats_get_overview`.
- `packages/openclaw-plugin/src/native-handlers.ts` - Native read result adaptation and success/error envelopes.

## Decisions Made
- Kept the native read payload thin and structured (`ok`, `summary`, `data`) while deferring final envelope hardening to Phase 28.
- Reused the existing summary wording from MCP-side logic instead of inventing OpenClaw-specific read summaries.
- Preserved the shipped top-level tool names and adapter behavior for `today` and `stats`.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/read-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-read.test.ts test/tools/today-stats-read.test.ts`

## Next Plan Readiness

- The shared runtime seam is now proven on real native reads and ready for the higher-risk mutation surface.

---
*Phase: 27-shared-api-adapter-and-native-tool-catalog*
*Completed: 2026-03-11*
