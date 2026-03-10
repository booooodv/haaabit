# AI Agent Integration / AI 机器人接入

This guide explains how a robot or AI agent should connect to Haaabit's MCP server and Skill layer.

本指南说明机器人或 AI agent 应该如何接入 Haaabit 的 MCP 服务与 Skill 层。

## MCP vs Skill

- `MCP` provides real callable tools such as `today_get_summary`, `today_complete`, `habits_edit`, and `stats_get_overview`.
- `Skill` teaches a Skill-aware agent how to use those tools safely, for example today-first routing, read-before-write sequencing, and ambiguity handling.
- A generic MCP client usually connects only to the MCP server.
- A Skill-aware agent should connect MCP first and then load the repo-local Skill.

In this repository:

- MCP package: [`@haaabit/mcp`](../packages/mcp/README.md)
- Repo-local Skill: [`.agents/skills/haaabit-mcp`](../.agents/skills/haaabit-mcp/SKILL.md)
- MCP guidance prompt: `haaabit_assistant_workflow`
- MCP guidance resource: `haaabit://guides/workflow`

## Recommended Connection Order

1. Connect the MCP server so the agent can call the real Haaabit tools.
2. If the host supports MCP prompts/resources, load `haaabit_assistant_workflow` or read `haaabit://guides/workflow`.
3. If the agent also supports repo-local Skills, invoke `$haaabit-mcp`.

This gives the agent both execution ability and workflow guidance.

## Choose the Right Integration Pattern

### 1. Generic MCP client

Use this when the robot supports MCP but does not understand repo-local Skills.

- Connect `@haaabit/mcp` using the config in [`packages/mcp/README.md`](../packages/mcp/README.md).
- Prefer the built-in MCP guidance prompt/resource for routing behavior.
- Do not expect the client to read `SKILL.md` automatically.

### 2. Skill-aware agent without MCP

This setup is usually not enough.

- The agent may understand the workflow from the Skill.
- But it cannot actually read or mutate Haaabit data without MCP tools.
- Prefer MCP plus Skill together.

### 3. Skill-aware agent with MCP

This is the recommended setup.

- Connect `@haaabit/mcp`.
- Load `haaabit_assistant_workflow` or `haaabit://guides/workflow` when supported.
- Invoke `$haaabit-mcp` for the strongest today-first behavior.

## Example MCP Configuration

Use the same base MCP server config across hosts that support local `stdio` MCP servers:

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

## Skill-Aware Agent Usage

If your agent supports repo-local Skills and is operating in this repository, use prompts like:

```text
$haaabit-mcp 今天该做什么？
$haaabit-mcp 帮我把阅读打卡。
$haaabit-mcp 撤销刚才的打卡。
$haaabit-mcp How am I doing this week?
```

## Typical Trigger Phrases

The `haaabit-mcp` Skill is intentionally bilingual. Typical user requests include:

- `What should I do today?` / `今天该做什么？`
- `What habits are still left today?` / `今天还剩哪些习惯没做？`
- `Mark reading as done.` / `帮我把阅读打卡。`
- `Set water to 1800 ml today.` / `把喝水记录到 1800 ml。`
- `Undo the last check-in.` / `撤销刚才的打卡。`
- `Change reading to 20 pages every day.` / `把阅读改成每天 20 页。`
- `Archive my meditation habit.` / `归档我的冥想习惯。`
- `How am I doing this week?` / `我这周做得怎么样？`

## Common Mistakes

- Treating Skill as if it were a transport protocol. It is not; MCP is the transport/tool layer.
- Assuming every MCP client reads repo-local `SKILL.md` files. Most do not.
- Connecting only the Skill without MCP and expecting real mutations to work.
- Connecting MCP and assuming the host will automatically choose the right tool sequence without guidance.

## Recommended Answer for "How does my robot connect skills?"

Short version:

- If your robot only supports MCP, connect `@haaabit/mcp` and use the MCP prompt/resource guidance.
- If your robot supports Skills too, connect MCP first and then invoke `$haaabit-mcp`.
- If you tell Haaabit which host you use, you can write host-specific setup instructions on top of this guide.
