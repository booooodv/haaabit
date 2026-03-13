# Quick Task 11: 修复 Haaabit OpenClaw 插件构建产物对 zod 的运行时依赖，确保 OpenClaw 可直接加载

**Date:** 2026-03-13
**Status:** Completed

## Goal

修复 `@haaabit/openclaw-plugin` 构建产物仍然在运行时解析 `zod` 的问题，让 OpenClaw 直接加载 `dist/index.js` 时不再出现 `Cannot find module 'zod'`，并保持 `openclaw.plugin.json`、`package.json`、plugin id 的一致性。

## Tasks

### Task 1
- files: [packages/openclaw-plugin/tsup.config.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/tsup.config.ts), [packages/openclaw-plugin/package.json](/Users/finn/code/haaabit/packages/openclaw-plugin/package.json)
- action: 调整构建配置，停止把 `zod` 作为 external 运行时依赖导出，确保发布产物可独立被 OpenClaw 发现和加载。
- verify: 构建后的 `dist/index.js` 不再包含对 `zod` 的裸模块导入。
- done: 插件加载不依赖宿主环境额外提供 `zod`。

### Task 2
- files: [packages/openclaw-plugin/test/plugin-manifest.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/plugin-manifest.test.ts), [packages/openclaw-plugin/test/verification-smoke.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/verification-smoke.test.ts)
- action: 补充回归测试，约束 OpenClaw manifest/package 元数据继续一致，并验证构建入口不会再外部引用 `zod`。
- verify: 测试能直接卡住 `Cannot find module 'zod'` 这类回归。
- done: 打包与发布路径具备自动化保障。

### Task 3
- files: [packages/openclaw-plugin/dist/index.js](/Users/finn/code/haaabit/packages/openclaw-plugin/dist/index.js)
- action: 执行 build 和插件测试，确认 OpenClaw 直接加载已构建产物可行。
- verify: `pnpm --filter @haaabit/openclaw-plugin build` 与 `pnpm --filter @haaabit/openclaw-plugin test` 通过，且 `dist/index.js` 不含 `from "zod"`。
- done: 用户更新插件包并重启 OpenClaw 后即可直接加载。
