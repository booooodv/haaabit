# Quick Task 7: 统一 @haaabit/mcp 工具返回格式，让客户端稳定读取人话摘要 + 完整机器可读 JSON

**Date:** 2026-03-11
**Status:** Complete

## Goal

统一 `@haaabit/mcp` 的工具结果格式，让通用 MCP 客户端和 CLI 都能同时拿到简短摘要与完整机器可读 JSON，不再依赖宿主如何打印对象，也不再只剩一段摘要。

## Tasks

### Task 1
- files: [packages/mcp/src/tools/read-results.ts](/Users/finn/code/haaabit/packages/mcp/src/tools/read-results.ts), [packages/mcp/src/client/errors.ts](/Users/finn/code/haaabit/packages/mcp/src/client/errors.ts)
- action: 抽出统一的机器可读返回构造器，让成功结果和错误结果都同时包含 `content[0].text` 摘要、`content[1].text` 的完整 JSON 字符串，以及 `structuredContent._haaabit_json`。
- verify: `content[1].text` 与 `_haaabit_json` 都能直接 `JSON.parse(...)`，且不含 markdown/code fence/`[Object]`。
- done: 客户端既能看摘要，也能稳定恢复完整 payload。

### Task 2
- files: [packages/mcp/src/server/create-server.ts](/Users/finn/code/haaabit/packages/mcp/src/server/create-server.ts), [packages/mcp/test/server/stdio-read-integration.test.ts](/Users/finn/code/haaabit/packages/mcp/test/server/stdio-read-integration.test.ts), [packages/mcp/test/tools/read-results.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/read-results.test.ts), [packages/mcp/test/tools/mutation-errors.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/mutation-errors.test.ts)
- action: 让 MCP 注册的 output schema 接受 `_haaabit_json`，并补回归测试覆盖 `habits_list`、`habits_get_detail`、`today_get_summary` 等命令在 stdio 路径下的 JSON 恢复能力。
- verify: stdio integration 能从 `structuredContent._haaabit_json` 和 `content[1].text` 解析出 `unit`、`targetValue` 等字段。
- done: 通用 MCP host 和 CLI 路径都遵循同一套返回约定。

### Task 3
- files: [packages/mcp/package.json](/Users/finn/code/haaabit/packages/mcp/package.json)
- action: 版本递增到 `0.1.6` 并发布 npm。
- verify: `npm view @haaabit/mcp version` 返回 `0.1.6`。
- done: 用户可直接通过 npm 包获取这套统一返回格式。
