# Phase 26: Native Plugin Contract and Package Scaffold - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 26 starts v1.7 by replacing the OpenClaw `skill -> mcporter -> MCP -> API` chain with a first-party native plugin package. The output of this phase is not full Haaabit domain parity yet. It is the native package contract and runtime scaffold that OpenClaw can load directly, with the right manifest, entrypoints, env contract, and startup diagnostics in place for later phases to fill with real tool behavior.

This phase should not wrap the existing MCP server, spawn `@haaabit/mcp`, or introduce a second copy of Haaabit business logic. It should set the native host contract, package shape, and fail-fast runtime rules so subsequent phases can add the shared API-backed tool implementation cleanly.

</domain>

<decisions>
## Implementation Decisions

### Transport boundary
- The OpenClaw path must become `OpenClaw plugin tool -> Haaabit API`.
- Do not introduce a hidden MCP bridge, mcporter hop, or child process that launches `@haaabit/mcp`.
- Native OpenClaw tool registration should follow the host plugin contract rather than MCP server semantics.

### Package and host contract
- Add a new package at `packages/openclaw-plugin`.
- Treat `openclaw.plugin.json` plus the native plugin entrypoint as the authoritative OpenClaw integration contract.
- The plugin should expose the existing Haaabit habits/today/stats vocabulary rather than inventing an OpenClaw-only tool taxonomy.

### Runtime config
- The native plugin runtime must read only `HAAABIT_API_URL` and `HAAABIT_API_TOKEN`.
- Missing, empty, or malformed config should fail fast with actionable, redaction-safe startup errors.
- The plugin must not accept account credentials or any alternative steady-state auth shape.

### Reuse boundary
- Reuse the existing Haaabit API client, shared contracts/types, and bearer-token auth semantics wherever possible.
- If current MCP package files mix reusable logic with MCP-only wrappers, split the host-neutral parts instead of copying them.
- Keep Haaabit domain truth in the shipped REST API rather than duplicating it in the OpenClaw package.

### Phase boundary
- Phase 26 should establish manifest, package scaffold, registration shell, env validation, and startup diagnostics.
- Full native read/write handler implementation belongs to Phase 27.
- Rich structured result envelopes and mutation-specific failure semantics belong to Phase 28.

### Claude's Discretion
- Exact package name (`@haaabit/openclaw-plugin` is the likely fit).
- Whether host-neutral reuse lands first as extracted modules or thin re-exports.
- Exact test/build config files for the new package as long as they match the monorepo style.

</decisions>

<specifics>
## Specific Ideas

- Reuse candidates already exist in `packages/mcp/src/client/api-client.ts`, `packages/mcp/src/client/errors.ts`, `packages/mcp/src/tools/inventory.ts`, and the per-surface tool modules under `packages/mcp/src/tools/`.
- The current blocker is that those files still mix host-neutral logic with MCP-specific wrappers like `CallToolResult`, `McpServer`, and MCP error/result adapters.
- Phase 26 should prove the OpenClaw-native package can load without any dependency on `@modelcontextprotocol/sdk` runtime bootstrapping.
- The plugin scaffold should make it obvious where Phase 27 will plug in the real habits/today/stats handlers.

</specifics>

<deferred>
## Deferred Ideas

- Full habits/today/stats handler implementation
- Final success/error JSON envelopes for agent consumption
- OpenClaw-native docs migration and operator-facing setup rewrite
- Generic MCP roadmap items such as remote transport or registry metadata

</deferred>

---
*Phase: 26-native-plugin-contract-and-package-scaffold*
*Context gathered: 2026-03-11 via milestone requirements, roadmap, current MCP implementation review, and OpenClaw native plugin contract review*
