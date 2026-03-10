# Quick Task 5: 修复 @haaabit/mcp 0.1.2 发布包 CLI 启动即退出导致标准 MCP host Connection closed

**Date:** 2026-03-11
**Status:** Complete

## Goal

修复 `@haaabit/mcp` 发布包在真实 npm / npx / bin shim 启动场景下会直接退出的问题，让标准 `stdio` MCP host 能稳定完成 initialize、tools/list 和实际 tool call。

## Tasks

### Task 1
- files: [packages/mcp/src/cli.ts](/Users/finn/code/haaabit/packages/mcp/src/cli.ts)
- action: 修正 CLI 入口执行判定，避免 `import.meta.url` 与 npm bin shim / symlink 路径比较失败导致 `main()` 不执行；同时确保 stdio server 在启动后会持续存活到 stdin 真正关闭。
- verify: 通过 symlink/bin shim 方式启动 `dist/cli.js` 时，进程不会在未握手前直接退出。
- done: 发布包 CLI 能以标准 MCP server 方式常驻，host 不再只看到 `Connection closed`。

### Task 2
- files: [packages/mcp/test/server/cli.test.ts](/Users/finn/code/haaabit/packages/mcp/test/server/cli.test.ts)
- action: 补一组回归测试，覆盖 symlinked bin shim 的 direct-exec 判定与 built CLI 通过 shim 路径启动后保持存活。
- verify: `pnpm --filter @haaabit/mcp exec vitest run test/server/cli.test.ts` 通过，且新增测试在旧实现上会暴露回归。
- done: 这类 npm 发布入口回归以后有自动化防线。

### Task 3
- files: [packages/mcp/package.json](/Users/finn/code/haaabit/packages/mcp/package.json)
- action: 递增 `@haaabit/mcp` 版本到 `0.1.3`，发布 npm 包，并记录 quick task artifacts 与 `STATE.md`。
- verify: `npm view @haaabit/mcp version` 返回 `0.1.3`。
- done: 用户可以直接通过 `npx -y @haaabit/mcp` 获取修复后的发布包。
