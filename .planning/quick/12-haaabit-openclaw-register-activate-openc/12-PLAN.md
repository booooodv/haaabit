# Quick Task 12: 修复 Haaabit OpenClaw 插件缺少 register/activate 导出，确保 OpenClaw 直接加载 dist 入口

**Date:** 2026-03-13
**Status:** Completed

## Goal

修复 `@haaabit/openclaw-plugin` 构建产物缺少 OpenClaw 可识别插件入口导出的问题，让 `dist/index.js` 显式提供 `register(api)` / `activate(api)` 入口并完成 Haaabit tools 注册，同时保持现有 `package.json`、`openclaw.plugin.json`、`configSchema` 与 plugin id 一致。

## Tasks

### Task 1
- files: [packages/openclaw-plugin/src/index.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/src/index.ts), [packages/openclaw-plugin/src/types.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/src/types.ts)
- action: 在插件入口层新增 OpenClaw 直接可识别的 `register(api)` 和 `activate(api)` 导出，并复用现有 Haaabit tool 注册逻辑。
- verify: 入口函数被调用时能注册完整工具集，不破坏现有 `activateHaaabitOpenClawPlugin` helper。
- done: 构建产物显式暴露 OpenClaw 期望的入口导出。

### Task 2
- files: [packages/openclaw-plugin/test/plugin-bootstrap.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/plugin-bootstrap.test.ts), [packages/openclaw-plugin/test/plugin-manifest.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/plugin-manifest.test.ts)
- action: 增加回归测试，覆盖源码入口和构建产物入口都导出 `register` / `activate`，且它们能注册 Haaabit tools。
- verify: 测试能直接卡住 `missing register/activate export` 回归。
- done: OpenClaw 入口契约具备自动化保障。

### Task 3
- files: [packages/openclaw-plugin/dist/index.js](/Users/finn/code/haaabit/packages/openclaw-plugin/dist/index.js)
- action: 重新构建并执行插件测试，确认 `dist/index.js` 能被 OpenClaw 直接加载。
- verify: `pnpm --filter @haaabit/openclaw-plugin build` 与 `pnpm --filter @haaabit/openclaw-plugin test` 通过，构建产物导出 `register` / `activate`。
- done: OpenClaw 不再报 `missing register/activate export`。
