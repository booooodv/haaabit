# Quick Task 6 Summary

**Description:** 改进 @haaabit/mcp tool 返回格式，避免 structuredContent 被压成 [Object]，提供更机器可读 JSON 输出
**Date:** 2026-03-11
**Code Commit:** `ffc0bb4`
**Published Version:** `0.1.4`

## What Changed

- Updated `packages/mcp/src/tools/read-results.ts` so every successful tool result now keeps the original `structuredContent`, adds a stable `_haaabit_json` field containing pretty-printed JSON, and appends the same JSON blob as a second text content entry.
- This means hosts that flatten nested objects in raw output can still expose a fully readable payload without losing fields like `targetValue`, `unit`, nested `items`, or today/stats detail objects.
- Expanded tests across read and write tool suites to assert both the human summary text and the machine-readable JSON payload path.
- Bumped and published `@haaabit/mcp` from `0.1.3` to `0.1.4`.

## Verification

- `pnpm --filter @haaabit/mcp exec vitest run test/tools/read-results.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/server/stdio-read-integration.test.ts test/server/stdio-mutation-integration.test.ts`
- `npm view @haaabit/mcp version`
  - Result: `0.1.4`

## Outcome

Haaabit MCP tool responses are now dual-purpose: the first text block remains concise for humans, while `_haaabit_json` and the appended JSON text block give machine-oriented hosts a stable, nested, copyable representation of the full result payload.
