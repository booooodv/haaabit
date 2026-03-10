---
name: haaabit-mcp
description: Today-first workflow for agents using Haaabit MCP tools. Use when a request mentions today's habits or uses phrases such as what to do today, remaining tasks, check-ins, marking a habit done, logging numeric progress, undoing a mistaken check-in, creating or editing a habit, archiving or restoring a habit, or reviewing progress, streaks, and stats; also trigger on Chinese requests such as 今天该做什么, 今天还剩什么, 打卡, 完成习惯, 记录进度, 撤销打卡, 新建习惯, 修改习惯, 归档习惯, 恢复习惯, 统计, or 本周表现 through a connected Haaabit MCP server.
---

# Haaabit MCP

Use the connected Haaabit MCP tools like a habit assistant, not like a generic REST wrapper.

## Start Here

- Default to `today_get_summary` for requests about "today", "what should I do", "what is left", "am I done", or Chinese variants like "今天该做什么", "今天还剩什么", and "今天做完了吗".
- Default to read before write. Inspect state first unless the mutation target is already exact and unambiguous.
- Treat route names as insufficient guidance on their own. Follow the workflow below even when the tool list is already visible.
- If the MCP server exposes `haaabit_assistant_workflow` or `haaabit://guides/workflow`, use them as supporting context instead of inventing a new sequence.

## Trigger Examples

Use this skill for requests like:

- "What should I do today?"
- "What habits are still left today?"
- "Mark reading as done."
- "Set water to 1800 ml today."
- "Undo the last check-in."
- "Change reading to 20 pages every day."
- "Archive my meditation habit."
- "How am I doing this week?"
- "今天该做什么？"
- "今天还剩哪些习惯没做？"
- "帮我把阅读打卡。"
- "把喝水记录到 1800 ml。"
- "撤销刚才的打卡。"
- "把阅读改成每天 20 页。"
- "归档我的冥想习惯。"
- "我这周做得怎么样？"

## Tool Routing

### Today flow

- Use `today_get_summary` to orient yourself before proposing actions.
- Use `today_complete` only for a boolean habit the user explicitly wants to check off today.
- Use `today_set_total` only when the user gives a concrete numeric amount for today's quantified habit.
- Use `today_undo` only when the user explicitly asks to revert the latest today action.

### Habit management flow

- Use `habits_list` to find the right habit by name, category, kind, or status.
- Use `habits_get_detail` before non-trivial edits or when the user asks for detailed habit context.
- Use `habits_add` when the user wants to create a new habit definition.
- Use `habits_edit` only after the target habit is clearly identified.
- Use `habits_archive` or `habits_restore` only on explicit user intent.

### Review flow

- Use `stats_get_overview` for trend, review, and overall habit-health questions.
- Pair `stats_get_overview` with `today_get_summary` when the user wants both analytics and today's concrete next steps.

## Mutation Safety

- Clarify first if multiple habits could match the user's wording.
- Do not guess between similarly named habits.
- Prefer one safe mutation over batching several speculative ones.
- After any successful write, summarize the affected habit and the refreshed today state when relevant.
- Do not dump raw JSON unless the user asks for raw output.

## Response Style

- Answer in natural language first.
- Keep the user oriented around today's checklist, progress, and next action.
- Mention why you chose a tool when that helps build trust, especially before mutations.
- Surface blockers plainly: ambiguous habit target, missing quantity, or request that exceeds the exposed tool surface.
