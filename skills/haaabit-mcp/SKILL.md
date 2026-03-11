---
name: haaabit-mcp
description: OpenClaw workspace skill for choosing the correct Haaabit MCP tool and payload with minimal ambiguity.
metadata:
  openclaw:
    primaryEnv: HAAABIT_API_TOKEN
    requires:
      env:
        - HAAABIT_API_URL
        - HAAABIT_API_TOKEN
---

# Haaabit MCP

Route Haaabit requests by intent. Pick the narrowest correct tool. Do not infer payload shape from read responses.

This skill does not provide tools by itself. Connect the Haaabit MCP server first, or use a runner that launches `@haaabit/mcp` with the same `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`. If you only have account credentials, run `bootstrap-token` first.

## Connection Order

1. Connect the Haaabit MCP server.
2. If prompts/resources exist, load `haaabit_assistant_workflow` or read `haaabit://guides/workflow`.
3. Then follow this skill.

## Fast Router

Use this mapping first:

- Ask what is left today, what to do today, whether today is complete, or input is only `OK` / `好` / `✅` -> `today_get_summary`
- Check off a yes/no habit for today -> `today_complete`
- Record a numeric amount for today -> `today_set_total`
- Revert the latest today mutation -> `today_undo`
- Find a habit by name/type/status before editing or when target is not exact -> `habits_list`
- Inspect one habit before a non-trivial edit -> `habits_get_detail`
- Create a new habit -> `habits_add`
- Edit an existing habit -> `habits_edit`
- Archive or restore a habit -> `habits_archive` / `habits_restore`
- Ask for trends, weekly progress, totals, review -> `stats_get_overview`

## Today Rules

Follow the shortest safe rule set:

- Default to `today_get_summary` for any today-oriented request.
- For ultra-short inputs like `✅`, read first with `today_get_summary`.
- Skip the read and write directly only when all of these are true:
  - The user clearly wants a mutation now.
  - The habit target is unique and unambiguous.
  - Required payload is complete.
- If any of those fail, read first.

Write routing:

- Boolean habit, explicit check-off -> `today_complete`
- Quantity habit, explicit numeric amount -> `today_set_total`
- Explicit revert / undo -> `today_undo`

After a successful today write, summarize the affected habit. Refresh today state when the user asked about today or when the write changes what is left.

## Ambiguity Rules

Do not guess on these cases:

- Multiple habits could match the same name -> ask which one
- User says "record" / "add" / "done" but the habit kind is unknown -> read first
- Quantity habit but no amount is provided -> ask for the number
- Edit request without a clear field to change -> ask which field
- Archive/restore request without an exact habit target -> list habits first

Preferred clarification style:

- Ask for the minimum missing fact only
- If there are duplicate names, disambiguate with category, kind, or status
- If the user gives a vague today mutation, use `today_get_summary` first, then continue

## Payload Patterns

Use minimal valid payloads. Treat field names below as patterns, not a license to mirror read responses.

### `today_complete`

Use for boolean habits only.

```json
{
  "habitId": "habit_123"
}
```

### `today_set_total`

Use for quantity habits only.

```json
{
  "habitId": "habit_456",
  "total": 3
}
```

If the user says "add 1 cup" but the tool expects today's final total, do not invent an increment payload. Read first or ask one clarifying question.

### `today_undo`

Use only for explicit revert of the latest today action.

```json
{}
```

### `habits_add`

Creation input and read output may be asymmetric. Do not copy fields from `habits_get_detail` or `habits_list` back into `habits_add`.

Minimum boolean habit example:

```json
{
  "name": "Read 20 min",
  "kind": "boolean"
}
```

Minimum quantity habit example:

```json
{
  "name": "Drink water",
  "kind": "quantity",
  "unit": "cup"
}
```

If the API/tool schema exposes stricter required fields, follow that schema. Still do not back-port response-only fields such as ids, derived stats, timestamps, streaks, or nested read models into create payloads.

### `habits_edit`

Identify the habit first. Send only the fields the user wants to change.

```json
{
  "habitId": "habit_123",
  "name": "Read 30 min"
}
```

### `habits_archive` / `habits_restore`

Do not call until the habit target is exact.

```json
{
  "habitId": "habit_123"
}
```

## Common Routes

Map natural language directly:

- "今天该做什么" / "what's left today" / `✅` -> `today_get_summary`
- "把阅读打卡" / "mark reading done" -> `today_complete` if the habit is known boolean, otherwise read first
- "喝水记 3 杯" / "set water to 3" -> `today_set_total`
- "撤销刚才的打卡" / "undo that" -> `today_undo`
- "帮我新建一个习惯：冥想" -> `habits_add`
- "把阅读改成 30 分钟" -> `habits_edit`
- "把旧的跑步习惯归档" -> `habits_archive`
- "恢复之前归档的阅读" -> `habits_restore`
- "我这周做得怎么样" / "show my stats" -> `stats_get_overview`

## Operating Rules

- Prefer exact tool selection over generic "today-first" narration.
- Read before write unless the mutation is exact, unique, and complete.
- Use `habits_list` to resolve names before edit/archive/restore.
- Use `habits_get_detail` before complex edits.
- For mixed requests like "今天还剩什么，顺便看看这周表现", call `today_get_summary` and `stats_get_overview`.

## Host Notes

- OpenClaw discovers this skill at `skills/haaabit-mcp/SKILL.md`.
- Repo-local wrappers such as `.agents/skills/haaabit-mcp/SKILL.md` may mirror this file, but this path is the primary OpenClaw entrypoint.
- The paired setup asset lives at `packages/mcp/examples/openclaw.jsonc`.
