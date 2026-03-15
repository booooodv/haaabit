# Quick Task 13 Summary

**Description:** 修复 OpenClaw 安装插件后 habits_edit schema 变成 None 导致 Invalid schema 报错
**Date:** 2026-03-15
**Code Commit:** `27158f3`

## What Changed

- Refactored the editable habit field schema into a reusable strict object so `habits_edit` no longer combines `habitId` with patch fields through a top-level `zod.and()` intersection.
- Rebuilt `editHabitToolInputSchema` as one strict object with required `habitId` plus editable fields, preserving the "at least one editable field" guard while exporting a provider-safe top-level `type: "object"` schema.
- Added OpenClaw regression assertions so the native tool catalog and registration path must expose `habits_edit` with top-level `type: "object"` and no top-level `allOf`.
- Documented the exact OpenClaw startup symptom in the troubleshooting guide so operators can map the error to this schema regression quickly.

## Verification

- `pnpm --filter @haaabit/openclaw-plugin exec tsx -e 'import { createToolCatalog } from "./src/tool-catalog.ts"; const tool = createToolCatalog().find((t) => t.name === "habits_edit"); console.log(JSON.stringify(tool?.inputSchema, null, 2));'`
- `pnpm --filter @haaabit/openclaw-plugin exec vitest run test/tool-catalog.test.ts test/tool-registration.test.ts`
- `pnpm --filter @haaabit/mcp exec vitest run test/tools/habits-write.test.ts`
- `pnpm verify:openclaw`

## Outcome

OpenClaw now sees `habits_edit` as a valid object-typed function schema with required `habitId`, so the plugin no longer fails registration with `type: "None"` for this tool.
