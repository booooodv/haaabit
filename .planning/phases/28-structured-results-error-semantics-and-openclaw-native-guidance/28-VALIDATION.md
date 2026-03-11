---
phase: 28
slug: 28-structured-results-error-semantics-and-openclaw-native-guidance
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `packages/openclaw-plugin/vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts` |
| **Full suite command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts`
- **After every plan wave:** Run `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 28-01 | 1 | RESP-01 | envelope | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts` | ✅ | ✅ green |
| 28-01-02 | 28-01 | 1 | RESP-01 | regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/read-tools.test.ts test/mutation-tools.test.ts` | ✅ | ✅ green |
| 28-02-01 | 28-02 | 2 | RESP-02, RESP-03 | error-semantics | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/error-semantics.test.ts` | ✅ | ✅ green |
| 28-02-02 | 28-02 | 2 | RESP-02, RESP-03 | full plugin semantics | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/error-semantics.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/client/errors.test.ts test/tools/mutation-errors.test.ts` | ✅ | ✅ green |
| 28-03-01 | 28-03 | 3 | VER-02 | doc/example smoke | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/docs-native-openclaw.test.ts` | ✅ | ✅ green |
| 28-03-02 | 28-03 | 3 | VER-02, RESP-01 | docs + runtime regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/docs-native-openclaw.test.ts test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/openclaw-plugin/test/result-envelope.test.ts` — native success envelope coverage
- [x] `packages/openclaw-plugin/test/error-semantics.test.ts` — native error semantics coverage
- [x] `packages/openclaw-plugin/test/docs-native-openclaw.test.ts` — OpenClaw-native docs/example smoke coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real OpenClaw workspace follows the new native-first docs and can understand the documented response/error contract without falling back to the MCP bridge story. | VER-02 | The actual OpenClaw host UI and plugin loading experience remain external to the repository harness. | In a real OpenClaw workspace, follow the new native plugin setup asset and docs only, confirm the host can load the plugin, and verify the operator no longer needs the old paired MCP runner story for this host. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed on 2026-03-11 after targeted and full regression commands stayed green
