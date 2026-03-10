# AI Agent Integration / AI 机器人接入

This guide explains how a robot or AI agent should connect to Haaabit's MCP server and Skill layer.

本指南说明机器人或 AI agent 应该如何接入 Haaabit 的 MCP 服务与 Skill 层。

## MCP vs Skill

- `MCP` provides real callable tools such as `today_get_summary`, `today_complete`, `habits_edit`, and `stats_get_overview`.
- `Skill` teaches a Skill-aware agent how to use those tools safely, for example today-first routing, read-before-write sequencing, and ambiguity handling.
- A generic MCP client usually connects only to the MCP server.
- A Skill-aware agent should connect MCP first and then load the matching Haaabit guidance layer.

In this repository:

- MCP package: [`@haaabit/mcp`](../packages/mcp/README.md)
- OpenClaw workspace skill: [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md)
- Repo-local agent skill: [`../.agents/skills/haaabit-mcp/SKILL.md`](../.agents/skills/haaabit-mcp/SKILL.md)
- Canonical OpenClaw setup asset: [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc)
- MCP guidance prompt: `haaabit_assistant_workflow`
- MCP guidance resource: `haaabit://guides/workflow`

## The OpenClaw Contract

Treat OpenClaw integration as three separate layers that must agree on the same Haaabit contract.

### OpenClaw workspace skill discovery

- OpenClaw-style workspace skill discovery should use [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md).
- That file exists to make the Haaabit workflow visible from the documented workspace `skills/` path.
- It does not provide the Haaabit tools by itself.

### MCP server configuration

- Haaabit's real tools still come from `@haaabit/mcp`.
- Pair OpenClaw with an MCP-capable runner or bridge that launches `npx -y @haaabit/mcp`.
- Reuse the shipped guidance identifiers `haaabit_assistant_workflow` and `haaabit://guides/workflow` instead of inventing an OpenClaw-only tool vocabulary.

### Env/secret injection

- Use the same steady-state env contract everywhere: `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
- Keep the skill layer, the paired MCP runner, and your secret store pointed at the same personal API token.
- If you only have account credentials, run `bootstrap-token` once to mint the personal API token that OpenClaw should inject afterward.
- If OpenClaw can see the skill but the tools still do not work, the missing piece is usually MCP server configuration or missing env/secret injection, not the skill text itself.

## Recommended Connection Order

1. Configure the workspace-facing Haaabit skill from `skills/haaabit-mcp/SKILL.md`.
2. If you only have account credentials, run `bootstrap-token` first and save the returned personal API token into the secret store that OpenClaw will reuse.
3. Connect the paired MCP-capable runner or bridge so it can launch `@haaabit/mcp` with `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
4. If that runner supports MCP prompts/resources, load `haaabit_assistant_workflow` or read `haaabit://guides/workflow`.
5. Then use the Haaabit skill for today-first, read-before-write behavior.

This gives the agent both execution ability and workflow guidance.

## Canonical OpenClaw Setup Asset

Use [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc) as the canonical example.

It intentionally includes:

- a `skills.entries."haaabit-mcp"` block for the workspace skill layer
- an `mcpServers.haaabit` block for the paired MCP runtime layer
- the exact Haaabit env names `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`
- the shipped guidance names `haaabit_assistant_workflow` and `haaabit://guides/workflow`

That split is deliberate. OpenClaw can see the skill without automatically providing the MCP transport, so Haaabit documents both halves together.

For symptom-driven fixes, see [OpenClaw Troubleshooting](./openclaw-troubleshooting.md). For the milestone-close verification path, see [OpenClaw Validation Checklist](./openclaw-validation-checklist.md).

## Choose the Right Integration Pattern

### 1. Generic MCP client

Use this when the robot supports MCP but does not understand repo-local Skills.

- Connect `@haaabit/mcp` using the config in [`../packages/mcp/README.md`](../packages/mcp/README.md).
- Prefer the built-in MCP guidance prompt/resource for routing behavior.
- Do not expect the client to read `SKILL.md` automatically.

### 2. OpenClaw-style host

Use this when the host can discover workspace skills but the real Haaabit tools still need to come from a separate MCP-capable runner or bridge.

- Use [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md) for workspace skill discovery.
- Use [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc) as the canonical paired setup example.
- If needed, run `bootstrap-token` before setup and then store the returned token as `HAAABIT_API_TOKEN`.
- Keep the same `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` in both layers.
- Use [OpenClaw Troubleshooting](./openclaw-troubleshooting.md) if the skill appears but the tools do not, if `HAAABIT_API_TOKEN` is missing, or if `bootstrap-token` warns about rotation.

### 3. Repo-local Skill-aware agent with MCP

This is the recommended setup for Codex/Claude-style agents operating inside this repository.

- Connect `@haaabit/mcp`.
- Load `haaabit_assistant_workflow` or `haaabit://guides/workflow` when supported.
- Invoke `$haaabit-mcp` for the strongest today-first behavior.
- Remember that `.agents/skills/haaabit-mcp/SKILL.md` is repo-local agent guidance, while `skills/haaabit-mcp/SKILL.md` is the OpenClaw workspace discovery surface.

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
- Assuming every host that can see a `SKILL.md` file also knows how to launch Haaabit's MCP server.
- Connecting only the Skill without MCP and expecting real mutations to work.
- Reusing different secret names across the skill layer and the MCP runtime layer.

## Recommended Answer for "Why does OpenClaw see the skill but not the tools?"

Short version:

- The skill is only the workflow layer.
- The real Haaabit tools still come from `@haaabit/mcp`.
- Keep the workspace skill, the paired MCP runner, and env/secret injection aligned through [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc).
