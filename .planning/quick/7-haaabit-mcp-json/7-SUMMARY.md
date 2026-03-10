# Quick Task 7 Summary

**Description:** 统一 @haaabit/mcp 工具返回格式，让客户端稳定读取人话摘要 + 完整机器可读 JSON
**Date:** 2026-03-11
**Code Commit:** `004e229`
**Published Version:** `0.1.6`

## What Changed

- Unified success and error tool results around one machine-readable contract: `content[0].text` stays as the short human summary, `content[1].text` now carries the full JSON string, and `structuredContent._haaabit_json` mirrors that same JSON string.
- Switched the JSON export to plain `JSON.stringify(data)` so the machine-readable payload is valid single-line JSON, ready for direct `JSON.parse(...)` in CLIs and generic MCP hosts.
- Updated the MCP registration path so output schemas explicitly accept `_haaabit_json`, which keeps the field intact across stdio tool calls instead of dropping it during schema validation.
- Added read-path regression coverage proving that `habits_list`, `habits_get_detail`, and `today_get_summary` preserve nested fields such as `unit` and `targetValue` in both `structuredContent._haaabit_json` and `content[1].text`.
- Bumped and prepared the package for npm publication as `@haaabit/mcp@0.1.6`.

## Verification

- `pnpm --filter @haaabit/mcp build`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/read-results.test.ts test/tools/mutation-errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/server/stdio-read-integration.test.ts test/server/stdio-mutation-integration.test.ts`
- `npm view @haaabit/mcp version`
  - Expected after publish: `0.1.6`

## Outcome

Haaabit MCP tools now return one stable dual-layer format for both humans and agents: concise summaries remain easy to read, while full machine-readable JSON is always available through `_haaabit_json` and the second text block even when a host would otherwise print nested objects as `[Object]`.
