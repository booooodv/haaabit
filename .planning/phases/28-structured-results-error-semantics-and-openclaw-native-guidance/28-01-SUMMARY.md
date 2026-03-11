---
phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
plan: 01
subsystem: native-success-envelope
tags: [openclaw, native-plugin, structured-json, success-envelope]
requires:
  - phase: 27-shared-api-adapter-and-native-tool-catalog
    provides: Real API-backed native handlers and shared runtime seam
provides:
  - stable native success envelope for every tool
  - native output schemas that describe the real success contract
  - dedicated envelope regression coverage for read and mutation tools
affects: [phase-28, openclaw, native-plugin, agent-contract]
tech-stack:
  added: [packages/openclaw-plugin/test/result-envelope.test.ts]
  patterns: [stable success envelope, zod-wrapped output schema, explicit toolName metadata]
key-files:
  created: [packages/openclaw-plugin/test/result-envelope.test.ts]
  modified: [packages/openclaw-plugin/src/native-handlers.ts, packages/openclaw-plugin/src/tool-catalog.ts, packages/openclaw-plugin/src/types.ts, packages/openclaw-plugin/test/read-tools.test.ts, packages/openclaw-plugin/test/mutation-tools.test.ts, packages/openclaw-plugin/test/tool-registration.test.ts, packages/openclaw-plugin/test/tool-catalog.test.ts]
key-decisions:
  - "Success responses stay host-native and explicit as `{ ok, toolName, summary, data }`."
  - "The success envelope is enforced at the plugin boundary rather than pushed back into the shared runtime seam."
  - "Native tool output schemas now describe the envelope instead of the bare adapted payload."
patterns-established:
  - "Agents can branch on `toolName` and `data` without scraping `summary`."
requirements-completed: [RESP-01]
duration: ~20min
completed: 2026-03-11
---

# Phase 28 Plan 01: Native Success Envelope Summary

**Every native OpenClaw tool now returns one explicit success shape instead of tool-specific bare payloads**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Locked the native success contract to `{ ok: true, toolName, summary, data }`.
- Wrapped native output schemas so registration now advertises the actual success envelope.
- Added envelope coverage that pins both read and mutation tools to the same machine-readable shape.

## Task Commits

No task commits were created in this workspace session. Phase 28 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/src/types.ts` - Native success/error result types and success-envelope schema helper.
- `packages/openclaw-plugin/src/native-handlers.ts` - Success payloads now include stable `toolName`.
- `packages/openclaw-plugin/src/tool-catalog.ts` - Native output schemas now describe the wrapped success contract.
- `packages/openclaw-plugin/test/result-envelope.test.ts` - Dedicated envelope regression coverage.
- `packages/openclaw-plugin/test/read-tools.test.ts` - Read tools asserted against the locked envelope.
- `packages/openclaw-plugin/test/mutation-tools.test.ts` - Mutation tools asserted against the locked envelope.

## Decisions Made
- Kept `summary` top-level for operator readability but made `toolName` and `data` the stable machine-facing fields.
- Avoided changing the shared runtime operation return shape; the envelope remains an OpenClaw-native boundary concern.
- Tightened schema registration so future drift is caught before a host consumes the wrong shape.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/tool-catalog.test.ts`

## Next Plan Readiness

- Native success outputs are now stable enough for error taxonomy hardening and documentation.

---
*Phase: 28-structured-results-error-semantics-and-openclaw-native-guidance*
*Completed: 2026-03-11*
