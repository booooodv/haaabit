# Quick Task 1: 修掉 @haaabit/mcp npm 发布后的 CLI/bin 问题，并补发可验证版本

**Date:** 2026-03-09
**Status:** Complete

## Goal

让 `@haaabit/mcp` 的发布产物能被通用 MCP client 通过 `npx`/`dlx` 正常拉起，并用无 manifest 警告的发布路径补发 patch 版本。

## Tasks

### Task 1
- files: [packages/mcp/src/server/create-server.ts](/Users/finn/code/haaabit/packages/mcp/src/server/create-server.ts), [packages/mcp/tsup.config.ts](/Users/finn/code/haaabit/packages/mcp/tsup.config.ts), [packages/mcp/package.json](/Users/finn/code/haaabit/packages/mcp/package.json)
- action: 去掉 bundle 对 `../../package.json` 的运行时依赖，把包名和版本在构建时注入到 CLI/server 元数据里；同时保留独立可发布的 `dist` 边界。
- verify: `pnpm --filter @haaabit/mcp build` 后，`rg "package.json" packages/mcp/dist` 无命中。
- done: 产物不再引用包外 `package.json`。

### Task 2
- files: [packages/mcp/README.md](/Users/finn/code/haaabit/packages/mcp/README.md), [.planning/quick/1-haaabit-mcp-npm-cli-bin/1-SUMMARY.md](/Users/finn/code/haaabit/.planning/quick/1-haaabit-mcp-npm-cli-bin/1-SUMMARY.md)
- action: 重新打包并验证 tarball 可被 `pnpm dlx`/`npm install` 启动，再把版本 bump 到 patch，并通过 `pnpm publish` 发版。
- verify: tarball 本地 `pnpm dlx <tgz>` 能启动到配置校验；`pnpm publish --dry-run` 无 npm `bin` auto-correct 警告；正式 publish 成功。
- done: patch 版本已发布且可验证运行。
