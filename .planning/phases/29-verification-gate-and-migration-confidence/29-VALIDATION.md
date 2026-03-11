---
phase: 29
slug: 29-verification-gate-and-migration-confidence
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `packages/openclaw-plugin/vitest.config.ts` |
| **Quick run command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/config/env.test.ts test/tool-registration.test.ts test/docs-native-openclaw.test.ts test/verification-smoke.test.ts` |
| **Full suite command** | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/plugin-startup-errors.test.ts test/config/env.test.ts test/tool-registration.test.ts test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/native-integration.test.ts test/docs-native-openclaw.test.ts test/verification-smoke.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` |
| **Estimated runtime** | ~240 seconds |

---

## Sampling Rate

- **After every task commit:** Run the smallest targeted test for the artifact introduced by that task
- **After every plan wave:** Run the plan-specific command from the plan file
- **Before milestone close:** Full suite must be green
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 29-01 | 1 | VER-01 | verification smoke | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/verification-smoke.test.ts` | ✅ | ✅ green |
| 29-01-02 | 29-01 | 1 | VER-01 | root gate regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/config/env.test.ts test/tool-registration.test.ts test/docs-native-openclaw.test.ts test/verification-smoke.test.ts` | ✅ | ✅ green |
| 29-02-01 | 29-02 | 2 | VER-01 | native integration | `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/native-integration.test.ts` | ✅ | ✅ green |
| 29-02-02 | 29-02 | 2 | VER-01 | full native + MCP regression | `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/plugin-startup-errors.test.ts test/config/env.test.ts test/tool-registration.test.ts test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/native-integration.test.ts test/docs-native-openclaw.test.ts test/verification-smoke.test.ts && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/openclaw-plugin/test/verification-smoke.test.ts` — repo-level native verification gate coverage
- [x] `packages/openclaw-plugin/test/native-integration.test.ts` — real API-backed native read/write verification
- [x] migration note artifact in docs — explicit OpenClaw bridge-to-plugin operator handoff

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real OpenClaw workspace can load the native plugin, run one read, run one safe mutation, and follow the migration notes without falling back to the older MCP bridge story. | VER-01 | The real OpenClaw UI/plugin-loader and secret store remain outside the repository harness. | In a real OpenClaw workspace, follow the native plugin setup asset plus migration notes, confirm the host loads the plugin, execute one read and one safe mutation, and record any host-specific caveats. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 240s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed on 2026-03-11 after native quick/full gates and root release scripts stayed green
