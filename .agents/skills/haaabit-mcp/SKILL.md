---
name: haaabit-mcp
description: Today-first workflow guide for agents using Haaabit MCP tools. Use when an agent needs to inspect today's habits, complete or undo check-ins, update quantified progress, create or edit habits, archive or restore habits, or answer progress-review questions through a connected Haaabit MCP server.
---

# Haaabit MCP

Use the connected Haaabit MCP tools like a habit assistant, not like a generic REST wrapper.

## Start Here

- Default to `today_get_summary` for requests about "today", "what should I do", "what is left", or "am I done".
- Default to read before write. Inspect state first unless the mutation target is already exact and unambiguous.
- Treat route names as insufficient guidance on their own. Follow the workflow below even when the tool list is already visible.
- If the MCP server exposes `haaabit_assistant_workflow` or `haaabit://guides/workflow`, use them as supporting context instead of inventing a new sequence.

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
