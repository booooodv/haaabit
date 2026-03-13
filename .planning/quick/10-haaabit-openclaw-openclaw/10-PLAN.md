# Quick Task 10: 修复 Haaabit OpenClaw 插件发布元数据，确保 OpenClaw 可直接发现加载启用

**Date:** 2026-03-13
**Status:** Completed

## Goal

修复 `@haaabit/openclaw-plugin` 的发布元数据与 manifest 对齐问题，确保 OpenClaw 能直接从已构建产物发现、加载并启用插件，不需要用户再做本地补丁，同时避免因包名、manifest `id`、入口声明不一致导致的 `plugin id mismatch` 或发现失败。

## Tasks

### Task 1
- files: [packages/openclaw-plugin/package.json](/Users/finn/code/haaabit/packages/openclaw-plugin/package.json), [packages/openclaw-plugin/openclaw.plugin.json](/Users/finn/code/haaabit/packages/openclaw-plugin/openclaw.plugin.json), [packages/openclaw-plugin/examples/openclaw-plugin.jsonc](/Users/finn/code/haaabit/packages/openclaw-plugin/examples/openclaw-plugin.jsonc), [packages/openclaw-plugin/README.md](/Users/finn/code/haaabit/packages/openclaw-plugin/README.md)
- action: 补齐 OpenClaw 发现插件所需的包元数据，加入 `openclaw.extensions`、manifest `configSchema`，并统一插件包名、manifest `id` 与文档中的安装/发现提示。
- verify: 构建后的包包含明确入口和一致的 plugin id，不再依赖人工补 metadata。
- done: 发布元数据、示例和说明相互一致。

### Task 2
- files: [packages/openclaw-plugin/test/plugin-manifest.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/plugin-manifest.test.ts), [packages/openclaw-plugin/test/docs-native-openclaw.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/docs-native-openclaw.test.ts), [packages/openclaw-plugin/test/verification-smoke.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/verification-smoke.test.ts)
- action: 更新测试，明确校验 OpenClaw 发布元数据、manifest id 和文档示例的一致性。
- verify: `@haaabit/openclaw-plugin` 的 manifest/docs 相关测试通过。
- done: 回归测试能防止之后再次发布出不可被 OpenClaw 直接发现的包。

### Task 3
- files: [packages/openclaw-plugin/dist/index.js](/Users/finn/code/haaabit/packages/openclaw-plugin/dist/index.js)
- action: 执行构建和目标测试，确认最终产物可被 OpenClaw 直接加载。
- verify: `pnpm --filter @haaabit/openclaw-plugin build` 与相关 `vitest` 通过。
- done: 用户只需安装/更新插件包并重启 OpenClaw。
