---
phase: 29-verification-gate-and-migration-confidence
plan: 01
subsystem: native-verification-gate
tags: [openclaw, native-plugin, verification, release-gate]
requires:
  - phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
    provides: Native runtime contract, docs, and agent-facing success/error semantics
provides:
  - native-plugin-focused repository verification gate
  - root OpenClaw verification scripts aligned to the native plugin story
  - one aggregated native smoke test for manifest/bootstrap/env/registration/docs
affects: [phase-29, openclaw, native-plugin, verification, package-json]
tech-stack:
  added: [packages/openclaw-plugin/test/verification-smoke.test.ts]
  patterns: [native-first verification, script alignment, aggregated smoke coverage]
key-files:
  created: [packages/openclaw-plugin/test/verification-smoke.test.ts]
  modified: [package.json, packages/openclaw-plugin/test/docs-native-openclaw.test.ts, docs/openclaw-validation-checklist.md]
key-decisions:
  - "Root `verify:openclaw` now proves the native plugin path instead of relying on MCP-only evidence."
  - "Quick verification stays focused on manifest/bootstrap/env/registration/docs while preserving targeted MCP regressions."
  - "Real API-backed native read/write verification remains in the full/native integration layer, not the quick smoke gate."
patterns-established:
  - "OpenClaw verification scripts should mention `@haaabit/openclaw-plugin` explicitly."
requirements-completed: [VER-01]
duration: ~15min
completed: 2026-03-11
---

# Phase 29 Plan 01: Native Verification Gate Summary

**The repository now has a native-plugin-first OpenClaw verification gate instead of an MCP-only proxy**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `verification-smoke.test.ts` to aggregate native manifest/bootstrap/env/registration/docs expectations.
- Repointed `pnpm verify:openclaw` and `pnpm verify:openclaw:full` to native plugin evidence first.
- Kept targeted MCP/shared-runtime regressions in the verification scripts so the reused seam still stays covered.

## Task Commits

No task commits were created in this workspace session. Phase 29 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/test/verification-smoke.test.ts` - Native verification smoke layer.
- `package.json` - Root `verify:openclaw` scripts now target the native plugin path.
- `packages/openclaw-plugin/test/docs-native-openclaw.test.ts` - Doc smoke now checks verification-gate alignment.
- `docs/openclaw-validation-checklist.md` - Verification docs now describe the native-plugin-first release gate.

## Decisions Made
- Kept the public `verify:openclaw` script names stable and changed their meaning to match the native plugin story already documented.
- Left quick verification free of real API-backed native integration to keep it fast and focused.
- Preserved MCP regression coverage where it still protects the shared runtime seam.

## Verification

- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/verification-smoke.test.ts`
- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/plugin-startup-errors.test.ts test/config/env.test.ts test/tool-registration.test.ts test/docs-native-openclaw.test.ts test/verification-smoke.test.ts`
- `pnpm verify:openclaw`

## Next Plan Readiness

- The repository verification gate is now ready to absorb real API-backed native integration evidence in Plan 02.

---
*Phase: 29-verification-gate-and-migration-confidence*
*Completed: 2026-03-11*
