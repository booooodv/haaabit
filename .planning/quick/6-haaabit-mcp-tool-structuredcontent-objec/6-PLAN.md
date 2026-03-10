# Quick Task 6: 改进 @haaabit/mcp tool 返回格式，避免 structuredContent 被压成 [Object]，提供更机器可读 JSON 输出

**Date:** 2026-03-11
**Status:** Complete

## Goal

让 `@haaabit/mcp` 的 tool 返回在 `mcporter call ... --output json/raw` 这类宿主里仍然保持足够机器可读，不再只剩一层人话摘要和被压扁成 `[Object]` 的结构。

## Tasks

### Task 1
- files: [packages/mcp/src/tools/read-results.ts](/Users/finn/code/haaabit/packages/mcp/src/tools/read-results.ts)
- action: 在成功 tool result 中保留原有 `structuredContent`，同时追加稳定 JSON 字符串导出，确保嵌套字段能直接被宿主或脚本读取。
- verify: 对嵌套 payload 序列化后能直接看到 `items[].unit`、`targetValue` 等字段，而不是 `[Object]`。
- done: Haaabit MCP 成功结果默认带上可复制、可解析的机器可读 JSON 视图。

### Task 2
- files: [packages/mcp/test/tools/read-results.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/read-results.test.ts), [packages/mcp/test/tools/habits-read.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/habits-read.test.ts), [packages/mcp/test/tools/habits-write.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/habits-write.test.ts), [packages/mcp/test/tools/today-stats-read.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/today-stats-read.test.ts), [packages/mcp/test/tools/today-write.test.ts](/Users/finn/code/haaabit/packages/mcp/test/tools/today-write.test.ts)
- action: 更新和补充测试，覆盖 `_haaabit_json` 稳定 JSON 字段、content 中追加 JSON 文本块，以及现有读写 tool 的机器可读回归。
- verify: 相关 read/write tool 单测通过。
- done: 新格式有自动化保护，不会再悄悄退回只有“人话 + [Object]”。

### Task 3
- files: [packages/mcp/package.json](/Users/finn/code/haaabit/packages/mcp/package.json)
- action: 将 `@haaabit/mcp` 版本 bump 到 `0.1.4` 并发布 npm。
- verify: `npm view @haaabit/mcp version` 返回 `0.1.4`。
- done: 宿主直接升级 npm 包即可拿到更机器可读的返回格式。
