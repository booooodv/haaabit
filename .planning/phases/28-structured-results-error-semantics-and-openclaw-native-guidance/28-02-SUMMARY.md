---
phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
plan: 02
subsystem: native-error-taxonomy
tags: [openclaw, native-plugin, error-semantics, api-client, mcp]
requires:
  - phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
    plan: 01
    provides: Stable native success envelope and public output-schema contract
provides:
  - stable native error categories and machine-branchable remediation fields
  - shared API client mapping for timeout and network failures
  - MCP/native regression alignment on wrong_kind and not_found semantics
affects: [phase-28, openclaw, native-plugin, mcp, agent-contract]
tech-stack:
  added: [packages/openclaw-plugin/test/error-semantics.test.ts]
  patterns: [error taxonomy, retryable flag, resolution hint, suggestedTool reroute]
key-files:
  created: [packages/openclaw-plugin/test/error-semantics.test.ts]
  modified: [packages/mcp/src/client/api-client.ts, packages/mcp/src/client/error-payload.ts, packages/mcp/src/client/errors.ts, packages/openclaw-plugin/test/shared-runtime.test.ts, packages/openclaw-plugin/test/mutation-tools.test.ts, packages/mcp/test/client/errors.test.ts, packages/mcp/test/tools/mutation-errors.test.ts]
key-decisions:
  - "Timeout and transport failures are first-class categories, not folded into generic unknown failures."
  - "Wrong-kind today mutations are promoted from generic validation to explicit `wrong_kind` semantics."
  - "Machine-branchable fields such as `retryable`, `resolution`, and `suggestedTool` are shared across native and MCP paths."
patterns-established:
  - "Agents should branch on category/resolution/suggestedTool instead of English error prose."
requirements-completed: [RESP-02, RESP-03]
duration: ~25min
completed: 2026-03-11
---

# Phase 28 Plan 02: Native Error Semantics Summary

**The native plugin and shared runtime now expose explicit actionable failure semantics instead of loose validation buckets**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added dedicated native error coverage for timeout, network, auth, not-found, and wrong-kind cases.
- Extended the shared error seam to emit `retryable`, `resolution`, and `suggestedTool`.
- Normalized raw fetch failures into structured API errors so native handlers return stable JSON instead of transport exceptions.

## Task Commits

No task commits were created in this workspace session. Phase 28 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/mcp/src/client/api-client.ts` - Wraps network failures as structured `NETWORK_ERROR` API errors.
- `packages/mcp/src/client/error-payload.ts` - Central error taxonomy with actionable metadata.
- `packages/mcp/src/client/errors.ts` - MCP serializer now preserves richer error fields.
- `packages/openclaw-plugin/test/error-semantics.test.ts` - Native taxonomy coverage.
- `packages/mcp/test/client/errors.test.ts` - Shared timeout/network semantics coverage.
- `packages/mcp/test/tools/mutation-errors.test.ts` - Wrong-kind and remediation regression coverage.

## Decisions Made
- Kept one shared semantic source in `packages/mcp/src/client/error-payload.ts` so OpenClaw and MCP do not drift.
- Used `wrong_kind` as a distinct category because agents need to reroute tools, not just fix generic input.
- Treated timeout/network/upstream as the only retryable classes by default.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/error-semantics.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/shared-runtime.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/client/errors.test.ts test/tools/mutation-errors.test.ts`

## Next Plan Readiness

- The native plugin contract is now sharp enough to document as the canonical OpenClaw path.

---
*Phase: 28-structured-results-error-semantics-and-openclaw-native-guidance*
*Completed: 2026-03-11*
