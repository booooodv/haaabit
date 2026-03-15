# Quick Task 17 Summary

**Description:** 修复 today_get_summary 工具缺少 inputSchema 导致的 AJV 校验错误
**Date:** 2026-03-15
**Code Commit:** `bfa9a85`

## Root Cause

- `packages/mcp/src/tools/today.ts` 里的 `today_get_summary` 是无参只读工具，但工具清单里没有显式提供 `inputSchema`。
- OpenClaw native plugin 注册工具时会把 `tool.inputSchema` 透传为 `parameters`。
- 当 `parameters` 变成 `undefined` 时，宿主侧 AJV 在校验参数 schema 时会报 `schema must be object or boolean`，导致工具调用在执行前失败。

## Minimal Patch

1. 为 `today_get_summary` 添加空对象 schema：`inputSchema: z.object({})`。
2. 增加回归测试，断言 OpenClaw 注册出来的 `today_get_summary.parameters` 是合法 object schema。
3. 重新构建 `@haaabit/openclaw-plugin`，并跑注册测试与真实调用链路测试，确认工具可以正常调用。

## Modified Files

- `packages/mcp/src/tools/today.ts`
- `packages/openclaw-plugin/test/tool-registration.test.ts`

## Why This Fix Works

- `z.object({})` 会被转换成 provider-safe JSON Schema object，而不是 `undefined`。
- OpenClaw 再向 AJV 注册 `today_get_summary` 时拿到的是合法 schema，因此不会再触发 `schema must be object or boolean`。
- `today_get_summary` 仍然保持无参调用方式，兼容现有 handler 和测试调用。

## Verification

- `pnpm --filter @haaabit/openclaw-plugin build`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/tool-catalog.test.ts test/tool-registration.test.ts`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/native-integration.test.ts`

## Outcome

`today_get_summary` 现在会以空对象参数 schema 注册到 OpenClaw，构建通过，注册回归测试通过，真实 native integration 也已验证该工具可正常调用。
