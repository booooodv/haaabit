# Quick Task 15 Plan

**Task:** 继续修复 packages/openclaw-plugin 的 OpenClaw env reference object 解析，消除 trim 崩溃并补回归测试
**Date:** 2026-03-15
**Status:** Completed

## Scope

修复 OpenClaw 原生插件对 secret/env reference object 的解析缺口，确保插件启动前总能把多来源配置解析成纯字符串 env map，并保持 `habits_edit` schema 注册稳定性不回归。

## Tasks

1. 把 env 处理拆成“候选来源收集”和“引用对象解析”两层，让 `parsePluginEnv` 只消费最终字符串配置。
2. 消除 `openclaw.ts` 与 `index.ts` 之间重复且可能不一致的 env 处理，并加固启动错误脱敏逻辑。
3. 补足 OpenClaw 引用对象、包装值、缺值报错和 schema/entry 稳定性的回归测试并重新验证。
