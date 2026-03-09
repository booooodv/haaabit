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
| `habits_list` | `GET /habits` | List habits for the authenticated user. |
| `habits_add` | `POST /habits` | Create a habit for the authenticated user. |
| `habits_get_detail` | `GET /habits/:habitId` | Get full habit detail including stats and trends. |
| `habits_edit` | `PATCH /habits/:habitId` | Update an existing habit. |
| `habits_archive` | `POST /habits/:habitId/archive` | Archive a habit while preserving its history. |
| `habits_restore` | `POST /habits/:habitId/restore` | Restore an archived habit. |
| `today_get_summary` | `GET /today` | Get the canonical today summary. |
| `today_complete` | `POST /today/complete` | Complete a boolean habit for today. |
| `today_set_total` | `POST /today/set-total` | Set today's total for a quantified habit. |
| `today_undo` | `POST /today/undo` | Undo today's latest mutation. |
| `stats_get_overview` | `GET /stats/overview` | Get overview analytics for the authenticated user. |

## Notes

- This package does not support browser-session or admin-only routes.
- This package currently targets local `stdio` MCP usage, not remote Streamable HTTP transport.
- The package version is still `0.x`, but the generic-client flow above is intended for real use now.
