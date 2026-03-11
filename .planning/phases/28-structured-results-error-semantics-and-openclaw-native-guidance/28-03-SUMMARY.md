---
phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
plan: 03
subsystem: native-openclaw-docs
tags: [openclaw, docs, native-plugin, operator-guidance]
requires:
  - phase: 28-structured-results-error-semantics-and-openclaw-native-guidance
    plan: 02
    provides: Final native success/error contract and machine-readable taxonomy
provides:
  - package-local OpenClaw-native setup docs and example asset
  - native-first repo docs for OpenClaw while preserving generic MCP guidance
  - doc smoke coverage that guards against drift back to MCP-first OpenClaw setup
affects: [phase-28, openclaw, docs, README, operator-guidance]
tech-stack:
  added: [packages/openclaw-plugin/README.md, packages/openclaw-plugin/examples/openclaw-plugin.jsonc, packages/openclaw-plugin/test/docs-native-openclaw.test.ts]
  patterns: [native-first host guidance, canonical setup asset, doc smoke tests]
key-files:
  created: [packages/openclaw-plugin/README.md, packages/openclaw-plugin/examples/openclaw-plugin.jsonc, packages/openclaw-plugin/test/docs-native-openclaw.test.ts]
  modified: [README.md, docs/ai-agent-integration.md, docs/openclaw-validation-checklist.md, docs/openclaw-troubleshooting.md, packages/openclaw-plugin/package.json, packages/mcp/README.md]
key-decisions:
  - "OpenClaw docs now point at the native plugin first; MCP remains documented as the generic-host path."
  - "Package-local native docs include the final success/error envelope so operators and agents see the same contract."
  - "The old OpenClaw MCP story is retained only as historical/generic-host guidance, not the default path for this host."
patterns-established:
  - "Every host-facing doc should point OpenClaw to the plugin asset before mentioning MCP."
requirements-completed: [VER-02]
duration: ~25min
completed: 2026-03-11
---

# Phase 28 Plan 03: Native OpenClaw Docs Summary

**The repo now tells one native-first OpenClaw story while keeping generic MCP guidance intact**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added package-local native plugin docs and a canonical OpenClaw-native setup asset.
- Rewrote root and host-facing docs so OpenClaw defaults to `@haaabit/openclaw-plugin` instead of the older MCP bridge path.
- Added doc smoke tests to guard against drifting back to MCP-first OpenClaw guidance.

## Task Commits

No task commits were created in this workspace session. Phase 28 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/README.md` - Native plugin runtime, result/error contract, and setup guide.
- `packages/openclaw-plugin/examples/openclaw-plugin.jsonc` - Canonical OpenClaw-native setup asset.
- `packages/openclaw-plugin/test/docs-native-openclaw.test.ts` - Documentation smoke coverage.
- `README.md` - Root native-first OpenClaw guidance.
- `docs/ai-agent-integration.md` - Host selection guidance updated for native plugin default.
- `docs/openclaw-validation-checklist.md` - Validation now anchored on the native plugin asset.
- `docs/openclaw-troubleshooting.md` - Symptom matrix updated to native plugin failures and structured error categories.

## Decisions Made
- Documented MCP as still supported and necessary for generic hosts plus `bootstrap-token`, but not as the default OpenClaw runtime.
- Kept the Haaabit Skill as optional guidance for hosts that support it instead of deleting that workflow layer.
- Added explicit success/error envelope examples so docs match the runtime contract.

## Verification

- `pnpm typecheck`
- `pnpm --filter @haaabit/openclaw-plugin build`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/docs-native-openclaw.test.ts test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`

## Next Plan Readiness

- Phase 29 can now focus on verification and migration confidence instead of rewriting stale guidance.

---
*Phase: 28-structured-results-error-semantics-and-openclaw-native-guidance*
*Completed: 2026-03-11*
