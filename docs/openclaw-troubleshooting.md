# OpenClaw Troubleshooting

Use this guide when the documented Haaabit OpenClaw setup still does not work after you copied [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc).

This is a troubleshooting guide, not a second primary setup path. The supported runtime contract is still:

- `HAAABIT_API_URL`
- `HAAABIT_API_TOKEN`
- optional MCP guidance names `haaabit_assistant_workflow` and `haaabit://guides/workflow`

If you only have account credentials, run `bootstrap-token` first and then return to the normal runtime contract above.

## Symptom Matrix

| Symptom | What it usually means | Supported fix |
|---------|------------------------|---------------|
| `skill visible, tools missing` | OpenClaw found `skills/haaabit-mcp/SKILL.md`, but no MCP runner is actually launching `@haaabit/mcp` | Re-check the `mcpServers.haaabit` block in [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc) and confirm the runner or bridge really starts `npx -y @haaabit/mcp`. |
| Startup says `HAAABIT_API_TOKEN` is missing | The steady-state runtime did not receive the token env at all | Put the personal API token into the secret store entry that resolves to `HAAABIT_API_TOKEN`; do not replace it with an email or password. |
| Startup says the token `looks more like an email address` or `looks more like a URL` | The wrong credential shape was injected into `HAAABIT_API_TOKEN` | Keep the API URL in `HAAABIT_API_URL` and inject a personal API token into `HAAABIT_API_TOKEN` instead. |
| You only have email/password credentials | You are still before the supported runtime step | Run `npx -y @haaabit/mcp bootstrap-token --api-url <...> --email <...>` once, then store the returned personal API token as `HAAABIT_API_TOKEN`. |
| `bootstrap-token` warns about rotating an existing token | The account already has a personal token and reset/rotation is the only way to recover a new plaintext token | Decide whether rotation is acceptable; if yes, re-run with `--force` and update every consumer that still depends on the old token. |
| Prompts/resources do not appear | The host or bridge may not expose MCP prompts/resources even though the tools work | Keep using the same tools and workspace/repo-local skills. Prompt/resource support is recommended, not required, and the canonical names remain `haaabit_assistant_workflow` and `haaabit://guides/workflow`. |

## Decision Points

### 1. The skill shows up, but Haaabit tools do not

This almost always means the workflow layer is connected but the transport layer is not.

Checklist:

1. Confirm OpenClaw is reading `skills/haaabit-mcp/SKILL.md`.
2. Confirm the paired MCP runner or bridge is configured with `mcpServers.haaabit`.
3. Confirm that runner really launches `npx -y @haaabit/mcp`.
4. Confirm both the skill-facing env block and the MCP runner env block resolve to the same `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` values.

## 2. The runtime rejects the token value

The Haaabit runtime is intentionally strict here.

- `HAAABIT_API_URL` should be your API base URL such as `https://your-haaabit.example.com/api`.
- `HAAABIT_API_TOKEN` should be a personal API token, not an email address, not a URL, and not an account password.
- If the startup diagnostic says the value `looks more like an email address` or `looks more like a URL`, fix the secret mapping instead of trying alternate env names.

## 3. You only have account credentials and no token yet

That is a setup problem, not a runtime mode.

Use the one-shot helper:

```bash
npx -y @haaabit/mcp bootstrap-token \
  --api-url https://your-haaabit.example.com/api \
  --email you@example.com
```

After success:

1. Save the returned personal API token in the secret store used by OpenClaw.
2. Put that token into `HAAABIT_API_TOKEN`.
3. Go back to the normal runtime setup from [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc).

## 4. `bootstrap-token` says rotation needs `--force`

This is expected when the account already has a token. Haaabit does not reveal existing plaintext personal tokens, so bootstrapping a fresh usable token may rotate the old one.

Only continue with `--force` if you are ready to replace the previous token everywhere it is used.

## 5. Prompt/resource support is missing

Prompt/resource support depends on the MCP host or bridge.

- Tools still come from `@haaabit/mcp`.
- Workflow guidance still comes from `skills/haaabit-mcp/SKILL.md` or `.agents/skills/haaabit-mcp/SKILL.md`.
- Prompts/resources are optional helpers, not a second runtime contract.

## Canonical References

- Package setup guide: [`../packages/mcp/README.md`](../packages/mcp/README.md)
- Cross-host integration guide: [`./ai-agent-integration.md`](./ai-agent-integration.md)
- Validation checklist: [`./openclaw-validation-checklist.md`](./openclaw-validation-checklist.md)
- Canonical asset: [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc)
- Workspace skill: [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md)
- Repo-local skill: [`../.agents/skills/haaabit-mcp/SKILL.md`](../.agents/skills/haaabit-mcp/SKILL.md)
