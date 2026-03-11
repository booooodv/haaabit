# OpenClaw Migration

Use this note when moving from the older OpenClaw MCP bridge setup to the native plugin path.

This is a transport migration, not a credential-model migration.

What stays the same:

- `HAAABIT_API_URL`
- `HAAABIT_API_TOKEN`
- optional Haaabit Skill guidance
- `bootstrap-token` as a one-shot helper when you do not already have a personal API token

What changes:

- OpenClaw should load [`@haaabit/openclaw-plugin`](../packages/openclaw-plugin/README.md) directly.
- OpenClaw should stop using the older paired MCP runner as its primary Haaabit runtime.

## Old vs New

### Old OpenClaw bridge path

- workspace Skill or repo-local Skill
- paired MCP runner
- optional mcporter/bridge layer
- Haaabit API

### New native path

- optional Skill guidance
- native OpenClaw plugin
- Haaabit API

## Migration Steps

1. Keep your existing `HAAABIT_API_URL`.
2. Keep your existing `HAAABIT_API_TOKEN`.
3. Remove the older OpenClaw MCP runner block that existed only to make OpenClaw talk to Haaabit.
4. Add the native plugin block from [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc).
5. If your OpenClaw build supports workspace Skills, keep [`../skills/haaabit-mcp/SKILL.md`](../skills/haaabit-mcp/SKILL.md) only as routing guidance, not as transport.
6. Re-run `pnpm verify:openclaw` for the repository gate and `pnpm verify:openclaw:full` for the full native read/write gate.

## If You Only Have Account Credentials

Do not switch to email/password runtime auth.

Instead:

1. Run `npx -y @haaabit/mcp bootstrap-token --api-url <...> --email <...>` once.
2. Store the returned personal API token as `HAAABIT_API_TOKEN`.
3. Continue with the native plugin path.

## What The Repo Can And Cannot Prove

The repository now proves:

- plugin manifest/runtime/bootstrap/env validation
- native tool registration
- one real API-backed native read flow
- one real API-backed native safe mutation flow

The repository does not prove:

- the real OpenClaw UI/plugin loader
- your specific OpenClaw secret store wiring

Those remain external-host-only checks.

## Canonical References

- Native package guide: [`../packages/openclaw-plugin/README.md`](../packages/openclaw-plugin/README.md)
- Native setup asset: [`../packages/openclaw-plugin/examples/openclaw-plugin.jsonc`](../packages/openclaw-plugin/examples/openclaw-plugin.jsonc)
- Validation checklist: [`./openclaw-validation-checklist.md`](./openclaw-validation-checklist.md)
- Troubleshooting: [`./openclaw-troubleshooting.md`](./openclaw-troubleshooting.md)
