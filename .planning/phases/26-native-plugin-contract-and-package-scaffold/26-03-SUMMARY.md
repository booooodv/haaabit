---
phase: 26-native-plugin-contract-and-package-scaffold
plan: 03
subsystem: runtime-config-and-startup-diagnostics
tags: [openclaw, plugin, config, env, diagnostics, redaction]
requires:
  - phase: 26-native-plugin-contract-and-package-scaffold
    provides: Native plugin scaffold plus native tool registration shell
provides:
  - strict parsing for `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`
  - structured startup/config errors with token redaction
  - bootstrap activation that fails before registration when runtime config is bad
affects: [phase-26, phase-27, openclaw, runtime, diagnostics]
tech-stack:
  added: [zod-backed env validation helpers, native plugin error envelope]
  patterns: [fail-fast env validation, redaction-safe startup errors]
key-files:
  created: [packages/openclaw-plugin/src/config/env.ts, packages/openclaw-plugin/src/errors.ts, packages/openclaw-plugin/test/config/env.test.ts, packages/openclaw-plugin/test/plugin-startup-errors.test.ts]
  modified: [packages/openclaw-plugin/src/index.ts, packages/mcp/src/server/create-server.ts, packages/mcp/test/server/stdio-read-integration.test.ts]
key-decisions:
  - "The native plugin runtime contract is exactly `HAAABIT_API_URL` plus `HAAABIT_API_TOKEN`."
  - "Startup errors are returned in a host-neutral structured shape rather than MCP-specific wrappers."
  - "Existing `packages/mcp` typings were tightened so workspace-wide typecheck remains green after adding the new plugin package."
patterns-established:
  - "New host integrations should fail before any API call when env shape is missing or obviously wrong."
requirements-completed: [SHRD-02]
duration: ~20min
completed: 2026-03-11
---

# Phase 26 Plan 03: Startup Config and Diagnostics Summary

**The native OpenClaw plugin now validates its exact env contract up front and returns redaction-safe startup errors**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added strict parsing for `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`, including malformed URL, whitespace token, email-like token, and URL-like token rejection.
- Added a structured native plugin error type and startup formatter that redact bearer token material before surfacing errors.
- Tightened existing `packages/mcp` typing so the full workspace `pnpm typecheck` gate stays green with the new plugin package in place.

## Task Commits

No task commits were created in this workspace session. Phase 26 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/src/config/env.ts` - Exact env contract parsing and normalization.
- `packages/openclaw-plugin/src/errors.ts` - Native plugin error type, redaction helper, and structured startup payload formatter.
- `packages/openclaw-plugin/src/index.ts` - Bootstrap now validates env before registering tools and wraps unknown startup failures.
- `packages/openclaw-plugin/test/config/env.test.ts` - Env validation coverage.
- `packages/openclaw-plugin/test/plugin-startup-errors.test.ts` - Startup redaction and unknown-error wrapping coverage.
- `packages/mcp/src/server/create-server.ts` - Tightened schema and handler result typings to keep workspace typecheck green.
- `packages/mcp/test/server/stdio-read-integration.test.ts` - Narrow casts for SDK result content indexing under strict TypeScript mode.

## Decisions Made
- Kept config parsing package-local and host-neutral rather than importing MCP-only config wrappers.
- Treated bad runtime config as a startup failure, not a first-tool-call failure.
- Fixed nearby strict-typing regressions in the existing MCP package because the milestone validation contract requires a green workspace typecheck.

## Verification

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/config/env.test.ts test/plugin-startup-errors.test.ts`

## Next Plan Readiness

- Phase 27 can now focus on real API-backed handlers because the plugin package, catalog shell, and startup diagnostics are already stable.

---
*Phase: 26-native-plugin-contract-and-package-scaffold*
*Completed: 2026-03-11*
