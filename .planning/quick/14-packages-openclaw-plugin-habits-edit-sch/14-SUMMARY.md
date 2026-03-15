# Quick Task 14 Summary

**Description:** 修复 packages/openclaw-plugin 的 habits_edit schema None 与 env trim 崩溃，统一入口和 manifest/exports
**Date:** 2026-03-15
**Code Commit:** `e4cd723`

## Root Cause

- `habits_edit` 的源码 schema 虽然已经改成了顶层对象，但 OpenClaw 侧的入口链路和构建 metadata 还没有被固定到一个专门的兼容入口，宿主命中旧入口或旧产物时仍可能重新暴露不稳定的注册路径。
- `parsePluginEnv()` 直接对 `env.HAAABIT_API_URL` / `env.HAAABIT_API_TOKEN` 调 `trim()`，默认假设值一定是字符串；当 OpenClaw 通过 `api.config.env`、`options.config.env` 或 secret-ref 风格对象注入值时，就会抛出 `Cannot read properties of undefined (reading 'trim')` 这一类启动错误。

## What Changed

- Added env normalize / flatten in `packages/openclaw-plugin/src/config/env.ts` so runtime config now merges `options.env`, `options.config.env`, `api.config.env`, and `process.env` in a stable precedence order.
- Added the OpenClaw-specific wrapper entry `packages/openclaw-plugin/src/openclaw.ts`; the wrapper resolves nested env sources first and then calls the shared native plugin bootstrap.
- Updated `packages/openclaw-plugin/openclaw.plugin.json`, `packages/openclaw-plugin/package.json`, and `packages/openclaw-plugin/tsup.config.ts` so the manifest entry, `openclaw.extensions`, and exports all point at the same built wrapper entry: `./dist/openclaw.js`.
- Extended env, bootstrap, manifest, docs, and verification tests so both regressions stay covered: no `habits_edit` schema drift, and no non-string env `trim` crash.

## Modified Files

- `packages/openclaw-plugin/src/config/env.ts`
- `packages/openclaw-plugin/src/index.ts`
- `packages/openclaw-plugin/src/openclaw.ts`
- `packages/openclaw-plugin/src/types.ts`
- `packages/openclaw-plugin/tsup.config.ts`
- `packages/openclaw-plugin/package.json`
- `packages/openclaw-plugin/openclaw.plugin.json`
- `packages/openclaw-plugin/README.md`
- `packages/openclaw-plugin/test/config/env.test.ts`
- `packages/openclaw-plugin/test/plugin-bootstrap.test.ts`
- `packages/openclaw-plugin/test/plugin-manifest.test.ts`
- `packages/openclaw-plugin/test/docs-native-openclaw.test.ts`
- `packages/openclaw-plugin/test/verification-smoke.test.ts`

## Verification

- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/config/env.test.ts test/plugin-bootstrap.test.ts test/plugin-manifest.test.ts test/tool-registration.test.ts test/tool-catalog.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-write.test.ts`
- `pnpm verify:openclaw`

## Outcome

The OpenClaw-native package now resolves env values from the host-compatible shapes that have been observed in the wild, avoids non-string `trim` failures, and publishes one explicit wrapper entry for both manifest loading and `openclaw.extensions` discovery.
