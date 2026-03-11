---
phase: 26
slug: 26-native-plugin-contract-and-package-scaffold
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `packages/openclaw-plugin/vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/tool-catalog.test.ts test/tool-registration.test.ts test/config/env.test.ts test/plugin-startup-errors.test.ts` |
| **Full suite command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/inventory.test.ts` |
| **Estimated runtime** | ~150 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/tool-catalog.test.ts test/tool-registration.test.ts test/config/env.test.ts test/plugin-startup-errors.test.ts`
- **After every plan wave:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/inventory.test.ts`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 150 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 26-01 | 1 | OCP-03 | contract | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts` | ✅ W0 | ✅ green |
| 26-01-02 | 26-01 | 1 | OCP-01, OCP-03 | build/smoke | `pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts` | ✅ W0 | ✅ green |
| 26-02-01 | 26-02 | 2 | OCP-01 | catalog | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/tool-catalog.test.ts test/tool-registration.test.ts` | ✅ W0 | ✅ green |
| 26-02-02 | 26-02 | 2 | OCP-01, OCP-03 | integration/smoke | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-bootstrap.test.ts test/tool-registration.test.ts` | ✅ W0 | ✅ green |
| 26-03-01 | 26-03 | 3 | SHRD-02 | unit | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/config/env.test.ts` | ✅ W0 | ✅ green |
| 26-03-02 | 26-03 | 3 | SHRD-02 | startup/error | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/config/env.test.ts test/plugin-startup-errors.test.ts` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/openclaw-plugin/package.json` — workspace package metadata
- [x] `packages/openclaw-plugin/openclaw.plugin.json` — native plugin manifest
- [x] `packages/openclaw-plugin/vitest.config.ts` — package-local test config
- [x] `packages/openclaw-plugin/tsup.config.ts` — package-local build config
- [x] `packages/openclaw-plugin/test/` — baseline contract/config smoke tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real OpenClaw workspace can load the local plugin manifest and display the native Haaabit tool catalog without any MCP runner block. | OCP-03 | The real OpenClaw plugin loader/UI is outside this repository harness. | In a real OpenClaw workspace, point the host at the local plugin package, confirm `openclaw.plugin.json` loads, confirm the Haaabit plugin appears, and verify the host does not require a parallel MCP server config just to discover the native tool catalog. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 150s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed on 2026-03-11 after `pnpm typecheck`, `@haaabit/openclaw-plugin` build/tests, and the targeted `@haaabit/mcp` regression suite all ran green.
