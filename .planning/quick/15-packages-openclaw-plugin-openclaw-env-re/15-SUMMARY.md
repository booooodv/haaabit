# Quick Task 15 Summary

**Description:** 继续修复 packages/openclaw-plugin 的 OpenClaw env reference object 解析，消除 trim 崩溃并补回归测试
**Date:** 2026-03-15
**Code Commit:** `c2b368b`

## Root Cause

- 上一版修复已经把 OpenClaw 入口切到了 `dist/openclaw.js`，所以入口兼容链路本身基本接上了。
- 剩余问题不在 entry，而在 env 解析模型仍然过于“扁平”：它只擅长处理 string 和少数 `{ value }` 风格包装值，没有把 OpenClaw 运行时可能传入的 env reference object 当成“一类需要二次解析的值”。
- 结果就是：插件虽然已经拿到了 `api.config.env` / `options.env` 一类容器，但这些容器里的 `HAAABIT_API_URL` / `HAAABIT_API_TOKEN` 仍可能是引用对象而不是最终字符串。如果后续任何路径把它们当作字符串去 `trim()`，就会回到你本地看到的启动崩溃。

## Minimal Patch

1. 把 `parsePluginEnv()` 收缩成只消费最终 `NodeJS.ProcessEnv` string map。
2. 把 “OpenClaw 多来源配置收集 + 引用对象解析” 全部收敛进 `resolvePluginRuntimeEnv()`。
3. 对 env value 增加两层处理：
   - 第一层：识别直接值与包装值，如 `string`、`number`、`boolean`、`{ value }`、`{ currentValue }`、`{ resolved }`、`{ raw }`
   - 第二层：识别 env reference object，如 `{ source: "env", id }`、`{ source: "env", key }`、`{ env }`、`{ name }`，并回退到候选 env / `process.env` 查真实值
4. 去掉 `openclaw.ts` 对 env 的重复预处理，让 wrapper 和 shared bootstrap 走同一套 env 解析。
5. 加固 `formatStartupError()` / `redactSecrets()`，即使传入怪异 env 结构也不再二次异常。

## Modified Files

- `packages/openclaw-plugin/src/config/env.ts`
- `packages/openclaw-plugin/src/openclaw.ts`
- `packages/openclaw-plugin/src/errors.ts`
- `packages/openclaw-plugin/test/config/env.test.ts`
- `packages/openclaw-plugin/test/plugin-bootstrap.test.ts`
- `packages/openclaw-plugin/test/plugin-startup-errors.test.ts`

## Diff

```diff
- export function parsePluginEnv(input: unknown = process.env): NativePluginConfig {
-   const env = flattenPluginEnv(input);
-   const apiUrl = env.HAAABIT_API_URL?.trim();
-   const apiToken = env.HAAABIT_API_TOKEN?.trim();
+ export function parsePluginEnv(env: NodeJS.ProcessEnv = process.env): NativePluginConfig {
+   const apiUrl = readEnvString(env, "HAAABIT_API_URL")?.trim();
+   const apiToken = readEnvString(env, "HAAABIT_API_TOKEN")?.trim();
```

```diff
- export function register(api, options = {}) {
-   return activateHaaabitOpenClawPlugin(api, {
-     ...options,
-     env: resolvePluginRuntimeEnv(api, options),
-   });
- }
+ export function register(api, options = {}) {
+   return activateHaaabitOpenClawPlugin(api, options);
+ }
```

```diff
+ const referencedEnvKey = extractReferencedEnvKey(value);
+ if (referencedEnvKey) {
+   return resolveReferencedEnvValue(referencedEnvKey, context, seenReferences);
+ }
```

## Why This Covers OpenClaw Secret / Env Reference Objects

- 现在插件不再假设 `HAAABIT_API_URL` / `HAAABIT_API_TOKEN` 在第一次读到时就是字符串。
- 如果 OpenClaw 传的是：
  - `{ source: "env", id: "HAAABIT_API_URL" }`
  - `{ source: "env", key: "HAAABIT_API_TOKEN" }`
  - `{ env: "HAAABIT_API_URL" }`
  - `{ name: "HAAABIT_API_TOKEN" }`
  插件会把它识别成 env 引用，再去候选 env 容器和 `process.env` 里找真实值。
- 如果最终还是找不到真实字符串，结果只会是明确的 `MISSING_PLUGIN_ENV`，而不是 JS 运行时的 `undefined.trim` / `trim-related` crash。

## Verification

- `pnpm --filter @haaabit/openclaw-plugin exec tsc --noEmit`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/config/env.test.ts test/plugin-bootstrap.test.ts test/plugin-startup-errors.test.ts test/tool-registration.test.ts test/plugin-manifest.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-write.test.ts`
- `pnpm verify:openclaw`

## Outcome

The native OpenClaw plugin now treats env collection and env value resolution as separate steps, resolves reference objects before config parsing, preserves the earlier `habits_edit` schema fix, and avoids all observed trim-related startup crashes in the repository test surface.
