# OpenClaw Validation Checklist

Use this checklist when you want confidence that the documented OpenClaw-native path is consistent and that the generic MCP baseline is still available for other hosts.

Canonical OpenClaw-native asset:

- [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)

Generic MCP baseline:

- [`../packages/mcp/README.md`](../packages/mcp/README.md)

## Starting State

Steady-state runtime contract:

- `HAAABIT_API_URL`
- `HAAABIT_API_TOKEN`

If you only have account credentials, run `npx -y @haaabit/mcp bootstrap-token ...` once, then continue with the same env names above.

## Contract Checks

### 1. Confirm the native docs point to one canonical asset

Check that these files all route OpenClaw to the native plugin first:

- [`../packages/openclaw-plugin/README.md`](../packages/openclaw-plugin/README.md)
- [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)
- [`./ai-agent-integration.md`](./ai-agent-integration.md)
- [`./openclaw-troubleshooting.md`](./openclaw-troubleshooting.md)
- [`../README.md`](../README.md)

### 2. Confirm the native result/error contract is documented

Check that package-local docs describe:

- success envelope: `{ ok, toolName, summary, data }`
- failure envelope: `{ ok, toolName, error }`
- machine-branchable error fields such as `category`, `retryable`, `resolution`, and `suggestedTool`

### 3. Confirm generic MCP guidance still exists

Check that [`../packages/mcp/README.md`](../packages/mcp/README.md) still documents the MCP path for non-OpenClaw hosts and for `bootstrap-token`.

## Automated Repository Checks

Current in-repo quick/full gates still prove the generic MCP baseline:

```bash
pnpm verify:openclaw
pnpm verify:openclaw:full
```

At this phase, those commands are still MCP-centric. They do not yet replace real host validation for the native plugin loader.

## Real OpenClaw Host Checks

These remain external-host-only because the repository test harness does not boot the real OpenClaw UI/plugin loader.

1. Load the native plugin using [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc).
2. Inject `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
3. Confirm the host sees Haaabit native tools directly.
4. Run one read flow with `today_get_summary`.
5. Run one safe mutation flow with `today_complete` or `today_set_total`.
6. Trigger one failure and confirm the host returns structured fields like `error.category`, `error.resolution`, and `error.suggestedTool`.

## Evidence Notes

When closing verification, record which checks were:

- automated in-repo via `pnpm verify:openclaw`
- automated in-repo via `pnpm verify:openclaw:full`
- external-host-only for native plugin loading and real OpenClaw execution
