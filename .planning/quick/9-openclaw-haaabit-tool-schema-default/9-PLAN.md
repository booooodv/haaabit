# Quick Task 9: 修复 OpenClaw Haaabit 插件 tool schema default 导致注册失败

**Date:** 2026-03-13
**Status:** Completed

## Goal

修复 `@haaabit/openclaw-plugin` 向 OpenClaw/provider 注册工具时直接暴露 Zod schema 的问题，确保注册层输出的是 provider-safe JSON Schema，不包含 `default` 等会导致函数工具注册失败的字段，同时保持现有 handler 的运行时解析与 API payload 语义不变。

## Tasks

### Task 1
- files: [packages/openclaw-plugin/src/tool-catalog.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/src/tool-catalog.ts), [packages/openclaw-plugin/src/register-tools.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/src/register-tools.ts), [packages/openclaw-plugin/src/types.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/src/types.ts)
- action: 在 OpenClaw 插件的工具目录/注册链路加入一个独立的 schema 转换层，把共享 `toolInventory` 的 Zod schema 转成纯 JSON Schema，并递归移除 provider 不兼容的注解字段。
- verify: `habits_list`、`today_complete`、`stats_get_overview` 等注册对象不再暴露 Zod 实例，且 schema 中不存在 `default`。
- done: 插件源码层面完成 provider-safe schema 输出，运行时 handler 保持原样。

### Task 2
- files: [packages/openclaw-plugin/test/tool-catalog.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/tool-catalog.test.ts), [packages/openclaw-plugin/test/tool-registration.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/tool-registration.test.ts), [packages/openclaw-plugin/test/result-envelope.test.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/test/result-envelope.test.ts)
- action: 调整原有把 `inputSchema` / `outputSchema` 当成 Zod 实例的测试，并新增 provider-safe 断言，覆盖递归清除 `default` 和保留必要结构约束。
- verify: OpenClaw 插件测试通过，并能证明目标工具注册 schema 已清洗。
- done: 测试覆盖本次回归点，避免以后再次把 Zod 原样注册出去。

### Task 3
- files: [packages/openclaw-plugin/package.json](/Users/finn/code/haaabit/packages/openclaw-plugin/package.json), [packages/openclaw-plugin/dist/index.js](/Users/finn/code/haaabit/packages/openclaw-plugin/dist/index.js), [packages/openclaw-plugin/dist/index.d.ts](/Users/finn/code/haaabit/packages/openclaw-plugin/dist/index.d.ts)
- action: 运行 `build` 和目标测试，确认构建产物已经包含修复后的 provider-safe schema 转换逻辑。
- verify: `pnpm --filter @haaabit/openclaw-plugin exec vitest run ...` 和 `pnpm --filter @haaabit/openclaw-plugin build` 通过。
- done: 用户重启 OpenClaw 后无需额外 monkey patch 即可加载插件。
