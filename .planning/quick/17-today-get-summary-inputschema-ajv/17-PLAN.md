# Quick Task 17 Plan

**Task:** 修复 today_get_summary 工具缺少 inputSchema 导致的 AJV 校验错误
**Date:** 2026-03-15
**Status:** In Progress

## Scope

为 `today_get_summary` 补齐空输入 schema，避免 OpenClaw 在注册/调用该只读工具时把 `undefined` 传给 AJV，从而触发 `schema must be object or boolean`。

## Tasks

1. 在 `packages/mcp/src/tools/today.ts` 为 `today_get_summary` 添加空的 `inputSchema`，保持现有读接口和输出契约不变。
2. 增加 OpenClaw 插件侧回归测试，断言 `today_get_summary` 注册出来的 `parameters` 是合法 object schema，而不是 `undefined`。
3. 重新构建 `@haaabit/openclaw-plugin`，并运行覆盖 `today_get_summary` 注册与真实调用路径的测试，确认不再出现 AJV schema 报错。
