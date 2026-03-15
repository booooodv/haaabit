# Quick Task 16 Plan

**Task:** 修复 packages/openclaw-plugin 对 OpenClaw 2026.3.x 新版 registerTool API 的兼容性
**Date:** 2026-03-15
**Status:** In Progress

## Scope

把 native OpenClaw 插件从旧三参 `registerTool(name, schema, handler)` 切到新版对象式 `registerTool({ ... })`，同时保持现有工具名、schema 和 handler 语义不变。

## Tasks

1. 更新 OpenClaw plugin API 类型与 `register-tools.ts`，改用对象式 tool registration 并在 `execute` 中包装现有 handler 输出为 `content/details`。
2. 调整注册/读写/结果相关测试，覆盖 `habits_*`、`today_*`、`stats_*` 工具都能按新版 API 成功注册和执行。
3. 运行 OpenClaw 相关测试与验证门，确认不回归之前的 schema 修复。
