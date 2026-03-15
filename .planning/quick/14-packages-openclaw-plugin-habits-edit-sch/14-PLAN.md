# Quick Task 14 Plan

**Task:** 修复 packages/openclaw-plugin 的 habits_edit schema None 与 env trim 崩溃，统一入口和 manifest/exports
**Date:** 2026-03-15
**Status:** In Progress

## Scope

修复 OpenClaw 原生插件在宿主加载时的两类兼容问题：`habits_edit` schema 注册稳定性，以及多来源 env 注入导致的非字符串 `trim` 崩溃。同时统一 OpenClaw 专用入口、manifest 和 package metadata。

## Tasks

1. 为 native plugin 增加 env normalize / flatten，并让入口统一从 `api.config.env`、`options.env`、`options.config.env`、`process.env` 解析运行时配置。
2. 增加 OpenClaw 专用 wrapper 入口并同步 `openclaw.plugin.json`、`package.json`、README 与 manifest 测试，确保宿主加载路径固定走兼容入口。
3. 补齐 schema 与 env 两类回归测试，运行 OpenClaw 验证并记录 quick task 结果。
