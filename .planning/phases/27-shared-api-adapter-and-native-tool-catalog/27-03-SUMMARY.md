---
phase: 27-shared-api-adapter-and-native-tool-catalog
plan: 03
subsystem: native-mutation-tools
tags: [openclaw, mutation-tools, habits, today, errors, shared-runtime]
requires:
  - phase: 27-shared-api-adapter-and-native-tool-catalog
    provides: Shared runtime seam and real native read handlers
provides:
  - real native mutation handlers for habit management and today actions
  - plugin-side mutation/error regression coverage
  - preserved MCP mutation semantics while shared error/runtime code is reused
affects: [phase-27, phase-28, openclaw, mutation-tools]
tech-stack:
  added: [plugin mutation regression tests]
  patterns: [shared mutation operations, shared error payloads]
key-files:
  created: [packages/openclaw-plugin/test/mutation-tools.test.ts]
  modified: [packages/mcp/src/client/errors.ts, packages/mcp/src/tools/habits.ts, packages/mcp/src/tools/today.ts, packages/openclaw-plugin/src/native-handlers.ts]
key-decisions:
  - "Native mutation handlers reuse the shared error payload seam so wrong-kind/not-found/auth behavior stays aligned with the shipped MCP path."
  - "Habit and today mutations now share one operation layer rather than duplicating request/summary logic under the plugin package."
  - "Final envelope hardening remains intentionally deferred to Phase 28 even though the mutation surface is now real."
patterns-established:
  - "New host integrations should consume shared mutation operations and structured error payloads instead of rebuilding API semantics."
requirements-completed: [OCP-02, SHRD-01, SHRD-03]
duration: ~20min
completed: 2026-03-11
---

# Phase 27 Plan 03: Native Mutation Tools Summary

**The OpenClaw plugin now performs the full shipped Haaabit mutation surface directly against the API with shared runtime and error semantics**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Exposed host-neutral mutation operations for habits and today actions and reused them from the native plugin.
- Implemented real native handlers for `habits_add`, `habits_edit`, `habits_archive`, `habits_restore`, `today_complete`, `today_set_total`, and `today_undo`.
- Added mutation tests that pin request parity and structured error behavior for missing or wrong-kind targets.

## Task Commits

No task commits were created in this workspace session. Phase 27 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/test/mutation-tools.test.ts` - Native mutation and error regression coverage.
- `packages/mcp/src/tools/habits.ts` - Shared mutation operations for habit management.
- `packages/mcp/src/tools/today.ts` - Shared mutation operations for today actions.
- `packages/mcp/src/client/errors.ts` - MCP serialization now reuses the shared error payload seam.
- `packages/openclaw-plugin/src/native-handlers.ts` - Native mutation success/error handling on the shared runtime.

## Decisions Made
- Kept the API as the source of truth for archived-habit, wrong-kind, and not-found semantics rather than duplicating those rules in the plugin.
- Used one shared error payload mapper for both hosts so failure drift is harder to introduce.
- Replaced the remaining placeholder path entirely instead of leaving partial native no-ops behind.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin build`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-write.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`

## Next Plan Readiness

- Phase 28 can now focus on final native response envelopes, sharper failure categories, and OpenClaw-native docs because basic handler coverage is complete.

---
*Phase: 27-shared-api-adapter-and-native-tool-catalog*
*Completed: 2026-03-11*
