# OpenClaw Validation Checklist

Use this checklist when you want milestone-close confidence that the documented OpenClaw path really works and that the generic MCP client baseline is still green.

This checklist validates the existing canonical setup path. It does not replace [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc), and it does not introduce a second runtime auth model.

## Starting States

### token-ready setup

Use this path if you already have a personal API token.

- Keep using `HAAABIT_API_URL` for the API base URL.
- Keep using `HAAABIT_API_TOKEN` for the personal API token.
- Apply the same values to both the workspace skill layer and the paired MCP runner shown in [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc).

### bootstrap-needed setup

Use this path if you only have account credentials.

1. Run the one-shot helper:

```bash
npx -y @haaabit/mcp bootstrap-token \
  --api-url https://your-haaabit.example.com/api \
  --email you@example.com
```

2. If the helper reports an existing token and asks for `--force`, decide whether rotating the old token is acceptable before continuing.
3. Save the returned personal API token in the same secret store entry that will later resolve to `HAAABIT_API_TOKEN`.
4. After bootstrap succeeds, continue with the normal token-ready setup above.

## Automated Release Gate

Run these commands from the repository root.

### Quick gate

```bash
pnpm verify:openclaw
```

This quick gate verifies:

- strict config parsing for `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`
- startup and bootstrap diagnostics/redaction
- `bootstrap-token` helper behavior
- built `stdio` discovery
- real read and mutation flows through the packaged MCP runtime
- docs/setup/troubleshooting alignment

### Full gate

```bash
pnpm verify:openclaw:full
```

This full gate adds:

- `@haaabit/mcp` build output verification
- the full `@haaabit/mcp` Vitest suite
- the existing API token-auth regression suite

## Checklist Steps

### 1. Validate docs and canonical asset

Confirm the following still point to the same contract:

- [`../packages/mcp/examples/openclaw.jsonc`](../packages/mcp/examples/openclaw.jsonc)
- [`./ai-agent-integration.md`](./ai-agent-integration.md)
- [`./openclaw-troubleshooting.md`](./openclaw-troubleshooting.md)
- workspace skill: [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md)
- repo-local skill: [`../.agents/skills/haaabit-mcp/SKILL.md`](../.agents/skills/haaabit-mcp/SKILL.md)

### 2. Confirm generic MCP client baseline

Run `pnpm verify:openclaw` and confirm the built `stdio` runtime still starts with a valid token and exposes the planned Haaabit tools.

### 3. Confirm one read flow

Repo-local automated evidence already covers a real read flow through the packaged CLI. The flow should demonstrate `today_get_summary` or equivalent built-runtime reads against a live Fastify test app.

### 4. Confirm one safe mutation flow

Repo-local automated evidence already covers a real safe mutation flow through the packaged CLI. The flow should demonstrate a controlled write such as `today_complete` or `today_set_total`, followed by an updated readback.

### 5. Confirm one failure-mode diagnostic

Verify at least one actionable failure path:

- missing `HAAABIT_API_TOKEN`
- wrong credential shape that looks more like an email address or a URL
- `bootstrap-token` requiring `--force` before rotation

Use [`./openclaw-troubleshooting.md`](./openclaw-troubleshooting.md) to confirm the docs route the operator back to the supported fix.

## Real OpenClaw Workspace Checks

The following steps are external-host-only because the real OpenClaw workspace UI and secret store are outside this repository.

### external-host-only checklist

1. Put the workspace skill in the supported OpenClaw discovery path.
2. Configure the paired MCP runner using the same `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` values from the canonical asset.
3. Confirm the skill is visible and that the MCP tools are callable.
4. Run one read flow in the real host, starting with `today_get_summary`.
5. Run one safe mutation flow in the real host, such as `today_complete` or `today_set_total`.
6. Intentionally trigger one failure mode, such as a missing `HAAABIT_API_TOKEN`, and confirm the runtime diagnostics plus troubleshooting guide are actionable.
7. If the host exposes prompts/resources, confirm it can see `haaabit_assistant_workflow` and `haaabit://guides/workflow`. If not, record that prompt/resource support is optional and host-dependent.

## Evidence Notes

When closing verification, record which checks were:

- automated in-repo via `pnpm verify:openclaw`
- automated in-repo via `pnpm verify:openclaw:full`
- external-host-only due to OpenClaw UI or secret-store limitations

That evidence is what allows Phase 25 to mark `VER-01` and `VER-02` complete without reopening setup or auth scope.
