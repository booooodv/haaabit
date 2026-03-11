# AI Agent Integration / AI 机器人接入

This guide explains which Haaabit integration surface to use for each host.

本指南说明不同 host 应该使用哪一种 Haaabit 接入面。

## Integration Surfaces

Haaabit ships three separate layers. Do not mix up their roles.

- `@haaabit/openclaw-plugin`: native OpenClaw plugin tools. This is the default path for OpenClaw.
- `@haaabit/mcp`: generic MCP server for hosts that speak MCP but do not load OpenClaw plugins.
- `haaabit-mcp` Skill: optional workflow guidance layer. It teaches routing and payload choice. It is not transport.

In this repository:

- Native OpenClaw package: [`../packages/openclaw-plugin/README.md`](../packages/openclaw-plugin/README.md)
- Canonical OpenClaw-native asset: [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)
- Generic MCP package: [`../packages/mcp/README.md`](../packages/mcp/README.md)
- Workspace skill: [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md)
- Repo-local skill: [`../.agents/skills/haaabit-mcp/SKILL.md`](../.agents/skills/haaabit-mcp/SKILL.md)

## OpenClaw Native Plugin

Use the native plugin first for OpenClaw.

Runtime contract:

- `HAAABIT_API_URL`
- `HAAABIT_API_TOKEN`

Canonical setup asset:

- [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)

Native result contract:

- success: `{ ok: true, toolName, summary, data }`
- failure: `{ ok: false, toolName, error }`

Native failure fields are meant for agents:

- `error.category`
- `error.retryable`
- `error.resolution`
- `error.suggestedTool`

Recommended connection order:

1. Ensure you already have a personal API token.
2. If not, run `bootstrap-token` once through [`@haaabit/mcp`](../packages/mcp/README.md).
3. Load `@haaabit/openclaw-plugin`.
4. Inject `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
5. Optionally add the Haaabit Skill if your OpenClaw build also supports workspace Skills.

Do not route OpenClaw through `skill -> mcporter -> MCP -> API` as the primary path anymore.

## Generic MCP Hosts

Use [`@haaabit/mcp`](../packages/mcp/README.md) when the host:

- supports MCP
- does not load OpenClaw native plugins
- needs `bootstrap-token`
- wants MCP prompts/resources such as `haaabit_assistant_workflow` and `haaabit://guides/workflow`

This remains the correct path for generic MCP clients, Claude Code MCP, and Inspector.

## Skills

Use the Haaabit Skill only as guidance.

- Workspace skill for OpenClaw-style discovery: [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md)
- Repo-local skill for Codex/Claude-style agents: [`../.agents/skills/haaabit-mcp/SKILL.md`](../.agents/skills/haaabit-mcp/SKILL.md)

The Skill helps the agent:

- default to `today_get_summary`
- pick `today_complete` vs `today_set_total`
- avoid ambiguous mutations
- ask the minimum clarifying question when payload is incomplete

The Skill does not create callable tools by itself.

## Choose The Right Pattern

### 1. OpenClaw host

Use the native plugin:

- start with [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)
- keep `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` in the plugin runtime
- add the Skill only if you want extra routing guidance

### 2. Generic MCP client

Use [`@haaabit/mcp`](../packages/mcp/README.md):

- connect the MCP server
- optionally load `haaabit_assistant_workflow` or `haaabit://guides/workflow`
- do not expect `SKILL.md` discovery unless the host explicitly supports it

### 3. Repo-local skill-aware agent

Inside this repository, agents can combine:

- MCP transport via [`@haaabit/mcp`](../packages/mcp/README.md)
- workflow guidance via `$haaabit-mcp`

This remains useful for Codex/Claude-style repo agents even though OpenClaw itself now has a native plugin path.

## Typical Trigger Phrases

The `haaabit-mcp` Skill is intentionally bilingual. Common requests include:

- `What should I do today?` / `今天该做什么？`
- `What habits are still left today?` / `今天还剩哪些习惯没做？`
- `Mark reading as done.` / `帮我把阅读打卡。`
- `Set water to 1800 ml today.` / `把喝水记录到 1800 ml。`
- `Undo the last check-in.` / `撤销刚才的打卡。`
- `How am I doing this week?` / `我这周做得怎么样？`

## Common Mistakes

- Treating the Skill as if it were the transport layer
- Using MCP as the default OpenClaw path when the native plugin is available
- Reusing account credentials in place of `HAAABIT_API_TOKEN`
- Ignoring `error.category` and `error.resolution` and branching on prose instead

## Short Answer: "Why should OpenClaw use the native plugin now?"

- It removes the extra MCP bridge hop.
- It keeps the same Haaabit API/auth contract.
- It returns stable JSON envelopes directly suited for agents.
- It leaves `@haaabit/mcp` available for every other host that still needs MCP.
