---
phase: 27-shared-api-adapter-and-native-tool-catalog
plan: 01
subsystem: shared-runtime-extraction
tags: [openclaw, mcp, shared-runtime, api-client, error-semantics, tool-catalog]
requires:
  - phase: 26-native-plugin-contract-and-package-scaffold
    provides: Native plugin package scaffold, registration seam, env validation, and startup diagnostics
provides:
  - host-neutral error payload seam for Haaabit API failures
  - host-neutral tool catalog, result adapters, and operation runtime aggregation
  - native plugin wiring that uses real shared handlers instead of phase placeholders by default
affects: [phase-27, phase-28, openclaw, mcp, shared-runtime]
tech-stack:
  added: [shared runtime modules under packages/mcp/src/tools and packages/mcp/src/client]
  patterns: [host-neutral runtime seams, MCP serializer as adapter, native handler injection]
key-files:
  created: [packages/mcp/src/client/error-payload.ts, packages/mcp/src/tools/catalog.ts, packages/mcp/src/tools/operation-types.ts, packages/mcp/src/tools/result-adapters.ts, packages/mcp/src/tools/runtime.ts, packages/openclaw-plugin/src/native-handlers.ts, packages/openclaw-plugin/test/shared-runtime.test.ts]
  modified: [packages/mcp/src/client/errors.ts, packages/mcp/src/tools/inventory.ts, packages/openclaw-plugin/src/index.ts, packages/openclaw-plugin/src/register-tools.ts, packages/openclaw-plugin/test/tool-registration.test.ts]
key-decisions:
  - "Shared runtime reuse lands as host-neutral modules inside `packages/mcp/src/` rather than a second duplicated implementation under `packages/openclaw-plugin`."
  - "MCP-specific `CallToolResult` serialization now sits on top of a reusable error payload seam instead of owning all error semantics."
  - "The native plugin now generates real default handlers during activation instead of treating `PHASE_27_PENDING` placeholders as the steady-state path."
patterns-established:
  - "Tool operations should return `{ payload, summary }`, then each host serializes that result for its own transport."
requirements-completed: [SHRD-01, SHRD-03]
duration: ~20min
completed: 2026-03-11
---

# Phase 27 Plan 01: Shared Runtime Extraction Summary

**The native plugin now reuses a host-neutral Haaabit runtime seam instead of a placeholder-only registration path**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Split reusable error semantics out of MCP result serialization through `error-payload.ts`.
- Extracted host-neutral tool catalog, result adapters, and operation aggregation so both MCP and the native plugin can share them.
- Added `native-handlers.ts` and rewired plugin activation so real shared-runtime-backed handlers are the default registration path.

## Task Commits

No task commits were created in this workspace session. Phase 27 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/mcp/src/client/error-payload.ts` - Host-neutral structured error payload mapping.
- `packages/mcp/src/tools/catalog.ts` - Shared tool metadata and vocabulary.
- `packages/mcp/src/tools/result-adapters.ts` - Host-neutral result shape adapters.
- `packages/mcp/src/tools/runtime.ts` - Shared tool operation aggregation.
- `packages/openclaw-plugin/src/native-handlers.ts` - Native handler creation on top of the shared runtime seam.
- `packages/openclaw-plugin/src/index.ts` - Activation now injects real default handlers.
- `packages/openclaw-plugin/src/register-tools.ts` - Registration now requires concrete handlers instead of placeholder fallback.
- `packages/openclaw-plugin/test/shared-runtime.test.ts` - Coverage for host-neutral runtime imports and native error payload mapping.

## Decisions Made
- Kept the shared runtime close to the existing MCP implementation to avoid inventing a separate internal package too early.
- Treated MCP serialization as an adapter layer on top of shared semantics, not the semantic source of truth.
- Made missing native handlers a bootstrap error instead of silently reintroducing a placeholder fallback.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/tool-registration.test.ts test/plugin-bootstrap.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts`

## Next Plan Readiness

- The native plugin is now ready for real read handlers without copying endpoint logic or importing MCP-only result types.

---
*Phase: 27-shared-api-adapter-and-native-tool-catalog*
*Completed: 2026-03-11*
