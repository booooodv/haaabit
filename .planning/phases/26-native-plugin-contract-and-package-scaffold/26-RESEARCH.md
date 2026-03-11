# Phase 26: Native Plugin Contract and Package Scaffold - Research

**Researched:** 2026-03-11
**Domain:** OpenClaw-native plugin contract, package scaffold, and direct Haaabit API runtime reuse
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The OpenClaw path must become a native plugin path, not another MCP wrapper.
- The new package should live at `packages/openclaw-plugin`.
- Runtime config must stay `HAAABIT_API_URL` plus `HAAABIT_API_TOKEN`.
- The plugin must reuse existing Haaabit API/auth/contracts logic rather than duplicate business rules.
- Errors for missing config, network failures, missing habits, and type mismatches must become clear structured failures over the milestone.

### Claude's Discretion
- Exact package/build/test file layout
- Exact reuse boundary between `packages/mcp` and the new plugin package
- How much of the native tool catalog is registered in Phase 26 versus implemented in Phase 27

### Deferred Ideas (OUT OF SCOPE)
- Full native tool logic
- Final result envelope design
- Broader docs migration
- Remote MCP transport or registry work
</user_constraints>

<research_summary>
## Summary

Phase 26 should be planned as three tightly scoped plans:

1. **Native contract and package scaffold**
   Establish `packages/openclaw-plugin` as a first-class workspace package with `openclaw.plugin.json`, native bootstrap entrypoints, build/test config, and a smoke-tested plugin contract that does not spawn or embed MCP.
2. **Native tool catalog shell**
   Register the Haaabit habits/today/stats tool names and schemas through the OpenClaw-native registration surface using shared metadata rather than copied definitions. If real handlers are deferred to Phase 27, use explicit placeholder handlers that stay native and do not route through MCP.
3. **Env validation and startup diagnostics**
   Add strict env parsing plus redaction-safe startup errors around `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`, with tests that prove the plugin fails fast before any API calls when config is wrong.

**Primary recommendation:** keep Phase 26 focused on host contract and scaffold only. The key output is a native package that OpenClaw can load directly and that later phases can fill with real API-backed tool behavior.
</research_summary>

<standards_and_sources>
## Standards and Source Findings

### OpenClaw-native plugin contract is separate from MCP
Official OpenClaw plugin guidance for 2026 shows the native plugin path is based on a plugin manifest file (`openclaw.plugin.json`) and native tool registration via `api.registerTool(...)`. That means the plugin should integrate directly with the host's plugin API, not by wrapping an MCP server or translating OpenClaw calls through an MCP transport layer.

### Current Haaabit code already has reusable API/runtime primitives
The current MCP package is already thin over the shipped REST API:
- `packages/mcp/src/client/api-client.ts` is a host-neutral bearer-authenticated API client with timeout handling.
- `packages/mcp/src/client/errors.ts` contains a reusable `HaaabitApiError` core, but the result adapters currently terminate in MCP-specific `CallToolResult`.
- `packages/mcp/src/tools/inventory.ts` and the surface files under `packages/mcp/src/tools/` already centralize Haaabit tool names, route mapping, schemas, and summaries.

This is the right reuse seam, but not all of it is host-neutral yet.

### The main reuse problem is host-specific wrapping, not missing business logic
Today the reusable parts are mixed with MCP-only concepts:
- `createServer()` uses `McpServer` directly.
- tool handlers currently return MCP `CallToolResult`
- error conversion currently ends in `toMcpErrorResult(...)`

That means Phase 26 should define where the host-neutral layer starts. The safest near-term path is:
- keep API client and core error type reusable,
- extract or expose a host-neutral tool catalog/shape,
- keep MCP adapters in `packages/mcp`,
- let `packages/openclaw-plugin` register tools natively against the same shared metadata.

### Phase 26 should not overreach into full tool implementation
The roadmap intentionally splits this work:
- Phase 26: package contract, registration shell, env validation
- Phase 27: actual native read/write handlers backed by shared API logic
- Phase 28: result envelopes, richer error semantics, docs/default path

So Phase 26 should stop after the plugin is native, loadable, and structurally ready.
</standards_and_sources>

<standard_stack>
## Standard Stack

### Core
| Artifact | Purpose | Why It Fits |
|---------|---------|-------------|
| `packages/openclaw-plugin/openclaw.plugin.json` | Native plugin manifest | Required by the OpenClaw-native path and clearly separates the host contract from MCP. |
| `packages/openclaw-plugin/src/index.ts` | Native plugin bootstrap/registration entry | Central place to wire `api.registerTool(...)` and startup validation. |
| `packages/openclaw-plugin/package.json` | Workspace package metadata | Lets the plugin build/test/package like the rest of the monorepo. |
| `packages/openclaw-plugin/test/plugin-manifest.test.ts` | Contract smoke coverage | Locks manifest shape and prevents MCP fallback regressions. |
| `packages/openclaw-plugin/test/plugin-bootstrap.test.ts` | Native bootstrap smoke coverage | Ensures the plugin registers through the OpenClaw-native surface instead of spawning another runtime. |
| `packages/openclaw-plugin/test/config/env.test.ts` | Startup env validation | Verifies exact env names and actionable diagnostics. |
| `packages/mcp/src/client/api-client.ts` | Reusable API client seam | Already speaks the real Haaabit API and is not inherently MCP-only. |
| `packages/mcp/src/client/errors.ts` | Core API error semantics | The `HaaabitApiError` core is reusable once separated from MCP result formatting. |

### Recommended additions
| Candidate | Why It Helps |
|----------|---------------|
| `packages/openclaw-plugin/src/tool-catalog.ts` | Gives the plugin a host-native view of the existing Haaabit tool inventory without copying schemas or names. |
| `packages/openclaw-plugin/test/tool-registration.test.ts` | Proves the native plugin exposes the intended Haaabit tool catalog and does not hide an MCP subprocess. |
| `packages/openclaw-plugin/src/config/env.ts` | Keeps startup contract isolated and testable before real handler work lands. |

### Implications
- New package setup is necessary in Phase 26.
- Existing API client/error/inventory code should influence the design immediately, even if some extraction lands in Phase 27.
- The plugin should become buildable and testable before real handler logic is introduced.
</standard_stack>

<implementation_notes>
## Implementation Notes

### Recommended plan split
- `26-01` should create the plugin manifest, entrypoint, package metadata, and smoke tests for the OpenClaw-native contract.
- `26-02` should establish the native tool registration shell and shared catalog shape, while keeping the implementation explicitly native and not MCP-backed.
- `26-03` should add strict env parsing, startup diagnostics, and redaction-safe configuration failures.

### Catalog strategy
- Keep Haaabit tool names aligned with the existing habits/today/stats vocabulary.
- Reuse existing schemas and route metadata where practical.
- If actual domain handlers are not ready in Phase 26, return explicit structured "not implemented yet" placeholders that make the deferral visible and do not tunnel through MCP.

### Reuse strategy
- Prefer extraction of host-neutral modules over duplicated copies.
- The most likely near-term split is:
  - shared API client core
  - shared API error core
  - shared tool catalog metadata
  - host-specific result adapters in the MCP package
  - host-specific registration/bootstrap in the OpenClaw plugin package

### Diagnostics strategy
- Config errors should be actionable and reference the exact missing env name.
- Messages must redact token values.
- Startup should fail before any API call if env config is invalid.
</implementation_notes>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Reintroducing MCP as an implementation detail
**What goes wrong:** The plugin "works" only because it spawns `@haaabit/mcp` or mirrors MCP server boot logic.
**How to avoid:** Add smoke tests that fail if the native plugin bootstrap depends on `McpServer`, `mcporter`, or child-process MCP launch.

### Pitfall 2: Copying tool definitions into the new package
**What goes wrong:** OpenClaw and MCP diverge on names, input schemas, or behavior.
**How to avoid:** Plan for a shared catalog seam and prove in tests that the native plugin keeps the existing Haaabit vocabulary.

### Pitfall 3: Mixing reusable error cores with host-specific result adapters
**What goes wrong:** The plugin imports MCP-only result types just to share error handling.
**How to avoid:** Split `HaaabitApiError` and categorization logic from MCP result serialization.

### Pitfall 4: Letting config validation become a runtime-only surprise
**What goes wrong:** Operators only learn about missing env vars after invoking a tool.
**How to avoid:** Make plugin startup validate envs eagerly and return explicit configuration errors before registration completes.

### Pitfall 5: Trying to implement the full native plugin in one phase
**What goes wrong:** Contract, scaffold, handler logic, result envelopes, and docs all collide in Phase 26.
**How to avoid:** Keep Phase 26 on scaffold and diagnostics, then let Phases 27-29 finish the behavior and operator path.
</common_pitfalls>

## Validation Architecture

Phase 26 has five primary risk surfaces:

1. **Native contract fidelity**: the new package must follow the OpenClaw-native manifest/bootstrap model rather than regressing to MCP.
2. **Package readiness**: the plugin must build and test as a first-class workspace package.
3. **Catalog alignment**: native tool registration should stay aligned with the shipped Haaabit habits/today/stats vocabulary.
4. **Config safety**: startup must fail fast for bad `HAAABIT_API_URL` / `HAAABIT_API_TOKEN` input.
5. **Reuse safety**: scaffold work must not break the existing MCP package while shared seams are being introduced.

Recommended validation stack:

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/tool-catalog.test.ts test/tool-registration.test.ts test/config/env.test.ts test/plugin-startup-errors.test.ts`
- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/inventory.test.ts`

Recommended quick command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/plugin-manifest.test.ts test/plugin-bootstrap.test.ts test/tool-catalog.test.ts test/tool-registration.test.ts test/config/env.test.ts test/plugin-startup-errors.test.ts
```

Recommended full command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/inventory.test.ts
```

Planner implications:
- `26-01` should lock the package contract first.
- `26-02` should make native registration and shared catalog seams testable.
- `26-03` should finish startup validation and diagnostics before Phase 27 begins real handler implementation.

<open_questions>
## Remaining Open Questions

- Whether the best reuse path is extracting host-neutral modules into a new shared location immediately or re-exporting them from `packages/mcp` until Phase 27 finishes the split.
- Whether Phase 26 should register full native tool placeholders or only the first subset of tools needed to prove the contract.

Neither question blocks planning because both options preserve the same hard constraints: native OpenClaw plugin contract, no MCP forwarding, and shared API/auth semantics.
</open_questions>
