# @haaabit/openclaw-plugin

`@haaabit/openclaw-plugin` is the native OpenClaw integration for Haaabit.

Use this package when the host can load OpenClaw plugins directly. It calls the shipped Haaabit API without inserting MCP, mcporter, or another bridge in the middle.

## Runtime Contract

- `HAAABIT_API_URL` - required Haaabit API base URL
- `HAAABIT_API_TOKEN` - required personal API token
- Auth model: bearer token only
- Bootstrap helper: if you only have account credentials, run `npx -y @haaabit/mcp bootstrap-token ...` once, then store the returned personal token as `HAAABIT_API_TOKEN`

Canonical setup asset:

- [`./examples/openclaw-plugin.jsonc`](./examples/openclaw-plugin.jsonc)

## OpenClaw Setup

Use the native plugin first:

1. Install or link `@haaabit/openclaw-plugin` in the OpenClaw plugin environment.
2. Inject `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
3. Load the plugin. It registers the Haaabit `habits_*`, `today_*`, and `stats_get_overview` tools directly.
4. If your OpenClaw build also supports workspace Skills, add [`../../skills/haaabit-mcp/SKILL.md`](../../skills/haaabit-mcp/SKILL.md) as an optional guidance layer. Do not use it as a transport substitute.

This path is native-first. Do not launch `@haaabit/mcp` just to make OpenClaw talk to Haaabit.

## Tool Result Contract

Every successful tool call returns one stable JSON envelope:

```json
{
  "ok": true,
  "toolName": "today_get_summary",
  "summary": "1 still need attention today; 2 of 3 are done. Pending: Read.",
  "data": {
    "today": {
      "totalCount": 3,
      "pendingCount": 1,
      "completedCount": 2
    }
  }
}
```

Every failed tool call returns one stable JSON error envelope:

```json
{
  "ok": false,
  "toolName": "today_set_total",
  "error": {
    "category": "wrong_kind",
    "code": "BAD_REQUEST",
    "message": "This habit can't use today_set_total because it is boolean; use today_complete instead.",
    "hint": "Use today_complete for boolean habits.",
    "retryable": false,
    "resolution": "switch_tool",
    "suggestedTool": "today_complete"
  }
}
```

Expected error categories include:

- `config`
- `startup`
- `timeout`
- `network`
- `auth`
- `validation`
- `wrong_kind`
- `not_found`
- `conflict`
- `upstream`

Agents should branch on `error.category`, `error.resolution`, `error.retryable`, and `error.suggestedTool` instead of parsing prose.

## When To Use MCP Instead

Use [`@haaabit/mcp`](../mcp/README.md) for generic MCP hosts that do not load OpenClaw native plugins.

That package remains the right path for:

- generic MCP clients
- Claude Code / Inspector MCP transport
- one-shot `bootstrap-token`

For cross-host guidance, see [`../../docs/ai-agent-integration.md`](../../docs/ai-agent-integration.md). For OpenClaw-native troubleshooting, see [`../../docs/openclaw-troubleshooting.md`](../../docs/openclaw-troubleshooting.md).
