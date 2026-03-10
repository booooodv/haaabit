# @haaabit/mcp

`@haaabit/mcp` is a generic `stdio` MCP server for Haaabit. It exposes the full personal-token-compatible `habits`, `today`, and `stats` API surface to MCP clients without adding a second auth flow.

This package is usable today with generic MCP clients and operators. It stays thin on purpose: it connects to an existing Haaabit API, reuses the shipped REST contracts, and expects the same personal API token you already use elsewhere.

## What You Need

- A running Haaabit API base URL, for example `https://your-haaabit.example.com/api`
- A personal API token created from the Haaabit web UI
- Node.js 20+

Runtime configuration:

- `HAAABIT_API_URL` — required
- `HAAABIT_API_TOKEN` — required
- `--api-url` — optional CLI override for `HAAABIT_API_URL`
- `--timeout` — optional request timeout in milliseconds

## Generic MCP Client Setup

Use this shape first in any MCP client that supports `command` / `args` / `env` server configuration:

```json
{
  "mcpServers": {
    "haaabit": {
      "command": "npx",
      "args": ["-y", "@haaabit/mcp"],
      "env": {
        "HAAABIT_API_URL": "https://your-haaabit.example.com/api",
        "HAAABIT_API_TOKEN": "your-personal-api-token"
      }
    }
  }
}
```

Optional timeout override:

```json
{
  "mcpServers": {
    "haaabit": {
      "command": "npx",
      "args": ["-y", "@haaabit/mcp", "--timeout", "15000"],
      "env": {
        "HAAABIT_API_URL": "https://your-haaabit.example.com/api",
        "HAAABIT_API_TOKEN": "your-personal-api-token"
      }
    }
  }
}
```

If your client can inject environment variables but prefers flags for URLs, `--api-url` is also supported.

## Claude Code Example

For Claude Code, use the same `stdio` server shape in your MCP configuration:

```json
{
  "mcpServers": {
    "haaabit": {
      "command": "npx",
      "args": ["-y", "@haaabit/mcp", "--timeout", "15000"],
      "env": {
        "HAAABIT_API_URL": "https://your-haaabit.example.com/api",
        "HAAABIT_API_TOKEN": "your-personal-api-token"
      }
    }
  }
}
```

Claude Code MCP reference: [docs.anthropic.com/en/docs/claude-code/mcp](https://docs.anthropic.com/en/docs/claude-code/mcp)

## MCP Inspector Example

For manual probing and debugging, launch the server through MCP Inspector:

```bash
HAAABIT_API_URL="https://your-haaabit.example.com/api" \
HAAABIT_API_TOKEN="your-personal-api-token" \
npx -y @modelcontextprotocol/inspector npx -y @haaabit/mcp
```

Inspector reference: [modelcontextprotocol.io/docs/tools/inspector](https://modelcontextprotocol.io/docs/tools/inspector)

## Tool Surface

All tools use the authenticated Haaabit API behind the scenes and return structured data that matches the existing contracts.

| Tool | Route | Description |
|------|-------|-------------|
| `habits_list` | `GET /habits` | List the user's habits so you can identify a target before editing, archiving, or summarizing by name, category, kind, or status. |
| `habits_add` | `POST /habits` | Create a new habit definition when the user explicitly wants to add a habit, recurrence rule, target, or category. |
| `habits_get_detail` | `GET /habits/:habitId` | Read one habit's full configuration, stats, and history before non-trivial edits or when the user asks for deep detail about that habit. |
| `habits_edit` | `PATCH /habits/:habitId` | Change an existing habit's settings after you have identified the correct habit and confirmed the user wants to modify it. |
| `habits_archive` | `POST /habits/:habitId/archive` | Archive a habit only when the user explicitly wants to shelve it without losing history. |
| `habits_restore` | `POST /habits/:habitId/restore` | Restore an archived habit only when the user explicitly wants it active again. |
| `today_get_summary` | `GET /today` | Read today's canonical checklist first when the user asks what is due, what remains, or whether today is already complete. |
| `today_complete` | `POST /today/complete` | Mark a boolean habit complete for today only when the user clearly asks to check off a specific today item. |
| `today_set_total` | `POST /today/set-total` | Set today's numeric progress for a quantified habit when the user gives a concrete amount, total, or measurement for today. |
| `today_undo` | `POST /today/undo` | Undo today's latest mutation only when the user explicitly asks to revert or correct the most recent today action. |
| `stats_get_overview` | `GET /stats/overview` | Read high-level analytics when the user wants a progress review, trend summary, or overall habit health snapshot. |

## AI Guidance

Besides the tool catalog, the MCP server now exposes a small workflow layer for hosts that support MCP prompts and resources:

- Prompt: `haaabit_assistant_workflow`
- Resource: `haaabit://guides/workflow`
- Purpose: teach a today-first, read-before-write tool sequence so hosts do not have to infer safe mutation behavior from route names alone

Recommended usage:

1. Start with `today_get_summary` for anything about today's checklist or next actions.
2. Use `habits_list` / `habits_get_detail` to identify the correct habit before editing or archiving.
3. Mutate only on explicit user intent; if multiple habits could match, clarify before calling a write tool.
4. Use `stats_get_overview` for review and trend questions, optionally pairing it with `today_get_summary` for concrete next steps.

If your agent platform supports repo-local Skills, Haaabit also ships [`.agents/skills/haaabit-mcp`](../../.agents/skills/haaabit-mcp/SKILL.md), which wraps the same workflow into a project-level Skill.

For a broader explanation of when to connect MCP only, when Skill-aware agents should also load `$haaabit-mcp`, and how to explain this to robot operators, see [AI Agent Integration / AI 机器人接入](../../docs/ai-agent-integration.md).

The `haaabit-mcp` Skill is documented as a bilingual trigger layer for Skill-aware agents. Typical requests include:

- `What should I do today?` / `今天该做什么？`
- `What habits are still left today?` / `今天还剩哪些习惯没做？`
- `Mark reading as done.` / `帮我把阅读打卡。`
- `Undo the last check-in.` / `撤销刚才的打卡。`
- `How am I doing this week?` / `我这周做得怎么样？`

## Notes

- This package does not support browser-session or admin-only routes.
- This package currently targets local `stdio` MCP usage, not remote Streamable HTTP transport.
- The package version is still `0.x`, but the generic-client flow above is intended for real use now.
