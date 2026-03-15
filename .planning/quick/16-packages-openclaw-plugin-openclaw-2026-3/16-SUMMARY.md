# Quick Task 16 Summary

**Description:** 修复 packages/openclaw-plugin 对 OpenClaw 2026.3.x 新版 registerTool API 的兼容性
**Date:** 2026-03-15
**Code Commit:** `00fc09c`

## Root Cause

- 插件当前仍按旧版三参 API 注册工具：`api.registerTool(name, schema, handler)`。
- OpenClaw 2026.3.x 已经切到对象式注册：`api.registerTool({ name, description, parameters, async execute(...) { ... } }, opts)`。
- 因为注册层签名已经不兼容，插件在启动/注册阶段就会失败；之前看到的 env / trim 错误容易被误判成主因，但这次检查后确认，真正的兼容断点在 `register-tools.ts`。

## Minimal Patch

1. 更新 `OpenClawPluginApi` 类型定义，改成对象式 `registerTool(tool, options?)`。
2. 把 `register-tools.ts` 从旧三参调用改成对象式注册。
3. 在 `execute` 中继续调用现有 `OpenClawToolHandler`，保持原来的 native handler 语义不变。
4. 将 native handler 的 envelope 包装成新版 OpenClaw 结果：
   - `content`: 文本摘要
   - `details`: 原始机器可读结果对象
5. 调整测试，把所有从 `mock.calls` 里按旧三参拿 handler 的地方改成使用注册对象里的 `execute()`。

## Modified Files

- `packages/openclaw-plugin/src/register-tools.ts`
- `packages/openclaw-plugin/src/types.ts`
- `packages/openclaw-plugin/test/tool-registration.test.ts`
- `packages/openclaw-plugin/test/result-envelope.test.ts`
- `packages/openclaw-plugin/test/plugin-bootstrap.test.ts`
- `packages/openclaw-plugin/test/read-tools.test.ts`
- `packages/openclaw-plugin/test/mutation-tools.test.ts`
- `packages/openclaw-plugin/test/native-integration.test.ts`

## Diff

```diff
- api.registerTool(
-   tool.name,
-   {
-     description: tool.description,
-     inputSchema: tool.inputSchema,
-     outputSchema: tool.outputSchema,
-   },
-   handler,
- );
+ api.registerTool({
+   name: tool.name,
+   description: tool.description,
+   parameters: tool.inputSchema,
+   async execute(input) {
+     const result = await handler(input);
+     return {
+       content: [{ type: "text", text: formatContentText(result) }],
+       details: result,
+     };
+   },
+ });
```

```diff
- registerTool: (name, registration, handler) => void
+ registerTool: (tool, options?) => void
```

## Why This Fix Works

- 它直接命中了 OpenClaw 2026.3.x 的 API 变化，而不是继续围绕 env 层做误修。
- `parameters` 继续使用我们已经修好的 provider-safe object schema，所以不会回归 `habits_edit` 的 schema 问题。
- `execute()` 里仍复用现有 native handlers，因此工具名、请求行为、错误语义都保持不变。
- `details` 继续保留原始 envelope，现有机器可读结果不会丢失，只是在外面补了 OpenClaw 需要的 `content`。

## Verification

- `pnpm --filter @haaabit/openclaw-plugin exec tsc --noEmit`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/tool-registration.test.ts test/result-envelope.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/native-integration.test.ts test/plugin-bootstrap.test.ts`
- `pnpm verify:openclaw`

## Outcome

The native plugin now registers `habits_*`, `today_*`, and `stats_*` tools through the OpenClaw 2026.3.x object-style API, returns `content/details` from `execute`, and keeps the previously-fixed schema behavior intact.
