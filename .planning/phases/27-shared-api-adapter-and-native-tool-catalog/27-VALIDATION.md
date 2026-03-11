---
phase: 27
slug: 27-shared-api-adapter-and-native-tool-catalog
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `packages/openclaw-plugin/vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/config/env.test.ts` |
| **Full suite command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/config/env.test.ts`
- **After every plan wave:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 27-01 | 1 | SHRD-01 | shared-runtime | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts` | ✅ W0 | ✅ green |
| 27-01-02 | 27-01 | 1 | SHRD-01, SHRD-03 | regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/tool-registration.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts` | ✅ W0 | ✅ green |
| 27-02-01 | 27-02 | 2 | OCP-02 | read-tools | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/read-tools.test.ts` | ✅ W0 | ✅ green |
| 27-02-02 | 27-02 | 2 | OCP-02, SHRD-03 | bootstrap/integration | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/read-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-read.test.ts test/tools/today-stats-read.test.ts` | ✅ W0 | ✅ green |
| 27-03-01 | 27-03 | 3 | OCP-02, SHRD-03 | mutation-tools | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/mutation-tools.test.ts` | ✅ W0 | ✅ green |
| 27-03-02 | 27-03 | 3 | SHRD-01, SHRD-03 | full regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/mutation-tools.test.ts test/read-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-write.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/openclaw-plugin/test/shared-runtime.test.ts` — shared runtime extraction/exposure coverage
- [x] `packages/openclaw-plugin/test/read-tools.test.ts` — native read handler coverage
- [x] `packages/openclaw-plugin/test/mutation-tools.test.ts` — native mutation handler coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real OpenClaw workspace can invoke the newly non-placeholder native handlers after Phase 27 without requiring any MCP runner configuration. | OCP-02 | The real OpenClaw host loader and interactive tool invocation surface are outside the repository harness. | Load the local plugin in a real OpenClaw workspace, set `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`, invoke one read tool and one safe mutation, and confirm the host is talking directly to the API-backed native plugin without an MCP bridge. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed on 2026-03-11 after `pnpm typecheck`, `@haaabit/openclaw-plugin` build/full Vitest, and the targeted `@haaabit/mcp` regression suite all ran green.
