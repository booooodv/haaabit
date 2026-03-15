# Quick Task 13 Plan

**Task:** 修复 OpenClaw 安装插件后 habits_edit schema 变成 None 导致 Invalid schema 报错
**Date:** 2026-03-15
**Status:** In Progress

## Scope

修复 `habits_edit` 在 OpenClaw 原生插件注册时导出为顶层 `allOf`、缺少 `type: "object"` 的问题，并补充回归测试与 quick task 记录。

## Tasks

1. 调整 `habits_edit` 的输入 schema 组合方式，确保导出的 JSON Schema 顶层是对象并保留 `habitId` + 可编辑字段约束。
2. 为 OpenClaw 工具目录和注册路径补充回归断言，防止顶层 schema 重新退化成 `allOf`。
3. 运行 OpenClaw 相关测试，确认 `habits_edit` 可注册且 quick task 文档完整。
