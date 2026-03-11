---
phase: 26-native-plugin-contract-and-package-scaffold
plan: 01
subsystem: openclaw-plugin-packaging
tags: [openclaw, plugin, manifest, bootstrap, tsup, vitest]
requires:
  - phase: 25-openclaw-release-verification-and-doc-hardening
    provides: OpenClaw-facing integration baseline and repo packaging conventions
provides:
  - native `packages/openclaw-plugin` workspace package scaffold
  - `openclaw.plugin.json` manifest and bootstrap activation entrypoint
  - package-local build/test config with smoke coverage against MCP fallback
affects: [phase-26, openclaw, plugin, packaging]
tech-stack:
  added: [openclaw.plugin.json, tsup, vitest]
  patterns: [native-plugin-bootstrap, no-mcp-fallback contract tests]
key-files:
  created: [packages/openclaw-plugin/package.json, packages/openclaw-plugin/openclaw.plugin.json, packages/openclaw-plugin/src/index.ts, packages/openclaw-plugin/tsup.config.ts, packages/openclaw-plugin/vitest.config.ts, packages/openclaw-plugin/test/plugin-manifest.test.ts, packages/openclaw-plugin/test/plugin-bootstrap.test.ts]
  modified: [packages/openclaw-plugin/tsconfig.json, pnpm-lock.yaml]
key-decisions:
  - "The new OpenClaw path ships as a first-class workspace package instead of wrapping the existing MCP runtime."
  - "Bootstrap tests explicitly forbid `@haaabit/mcp`, `mcporter`, and subprocess-based fallback paths."
  - "The package contract stays thin in Phase 26; real API-backed handlers are deferred."
patterns-established:
  - "OpenClaw-native packaging is validated with manifest/bootstrap smoke tests before handler implementation expands."
requirements-completed: [OCP-01, OCP-03]
duration: ~20min
completed: 2026-03-11
---

# Phase 26 Plan 01: Native Plugin Contract and Package Scaffold Summary

**Haaabit now ships a first-class OpenClaw plugin package scaffold with a native manifest, bootstrap entrypoint, and build/test surface**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Added `packages/openclaw-plugin` as a real workspace package with package metadata, `openclaw.plugin.json`, and a native activation entrypoint.
- Added package-local `tsup` and `vitest` config so the plugin builds and tests like a first-class monorepo package.
- Locked the native contract with smoke tests that fail if the bootstrap path starts mentioning `@haaabit/mcp`, `mcporter`, or subprocess fallback.

## Task Commits

No task commits were created in this workspace session. Phase 26 work is being finalized as one atomic phase commit after summaries and verification artifacts are written.

## Files Created/Modified
- `packages/openclaw-plugin/package.json` - Package metadata, scripts, exports, and runtime expectations.
- `packages/openclaw-plugin/openclaw.plugin.json` - OpenClaw-native manifest contract.
- `packages/openclaw-plugin/src/index.ts` - Activation entrypoint for the native plugin bootstrap.
- `packages/openclaw-plugin/tsup.config.ts` - Package-local build config.
- `packages/openclaw-plugin/vitest.config.ts` - Package-local test config.
- `packages/openclaw-plugin/test/plugin-manifest.test.ts` - Manifest shape smoke coverage.
- `packages/openclaw-plugin/test/plugin-bootstrap.test.ts` - Bootstrap/fallback regression coverage.
- `packages/openclaw-plugin/tsconfig.json` - TypeScript boundary widened enough to typecheck shared vocabulary imports cleanly.
- `pnpm-lock.yaml` - Workspace lockfile updated so the new package's dependencies are installed.

## Decisions Made
- Kept the native plugin contract host-facing and minimal rather than importing a speculative OpenClaw SDK package.
- Required the package to be buildable/testable immediately instead of leaving it as an untracked scaffold.
- Accepted a monorepo-local type boundary change to support shared vocabulary reuse without cloning metadata.

## Verification

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts`
- `pnpm --filter @haaabit/openclaw-plugin build`

## Next Plan Readiness

- The native package scaffold is stable enough for Plan 02 to wire the Haaabit tool catalog and registration shell.

---
*Phase: 26-native-plugin-contract-and-package-scaffold*
*Completed: 2026-03-11*
