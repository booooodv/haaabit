# Phase 27: Shared API Adapter and Native Tool Catalog - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 27 turns the Phase 26 native OpenClaw plugin scaffold into a real API-backed tool surface. The goal is not to redesign Haaabit behavior or invent a second OpenClaw-only contract. The goal is to reuse the shipped Haaabit API client, contracts, auth semantics, and tool vocabulary so `packages/openclaw-plugin` can execute the same habits/today/stats operations directly against the real Haaabit API.

This phase should replace the current `PHASE_27_PENDING` placeholders with real handlers. It should do that by extracting or exposing host-neutral runtime seams from the current MCP implementation, not by copying request logic, route knowledge, or business validation into the plugin package.

</domain>

<decisions>
## Implementation Decisions

### Reuse boundary
- Reuse the existing Haaabit API client, contracts/types, and bearer-token auth semantics.
- Do not fork tool names, route paths, or input/output schemas for OpenClaw.
- If reusable runtime pieces are currently mixed with MCP-only wrappers, split the host-neutral parts out instead of copying them.

### Native plugin behavior
- `packages/openclaw-plugin` must stay a native OpenClaw package.
- Replace deferred placeholders with real handlers for habits, today, and stats tools.
- Keep tool registration native; do not route execution through `@haaabit/mcp`, `mcporter`, or `McpServer`.

### Domain source of truth
- Haaabit business rules stay in the shipped Haaabit API.
- The plugin should call the same REST endpoints the MCP package already calls.
- Wrong-kind checks, archived-habit conflicts, auth failures, and validation errors should still originate from the API/runtime seam rather than a duplicated plugin-only ruleset.

### Scope boundary
- Phase 27 covers shared runtime extraction/exposure plus real read/write handlers for the native plugin.
- Phase 28 will harden the final native success/error envelope and operator-facing docs.
- Phase 29 will prove end-to-end native plugin behavior and migration confidence.

### Claude's Discretion
- Exact file layout for the shared host-neutral seam.
- Whether the shared runtime is exposed from `packages/mcp` or extracted into a more clearly shared internal module.
- Temporary native return shape used before Phase 28 formalizes the final envelope.

</decisions>

<specifics>
## Specific Ideas

- `packages/mcp/src/client/api-client.ts` is already host-neutral and should be reused directly or re-exported through a shared seam.
- `packages/mcp/src/client/errors.ts` currently mixes reusable `HaaabitApiError` data with MCP-specific `CallToolResult` serialization; that seam likely needs to split.
- `packages/mcp/src/tools/habits.ts`, `today.ts`, and `stats.ts` already know the correct endpoints, schema parsing, and summary wording. Those functions are the best starting point for a shared handler layer, but they currently terminate in MCP result builders.
- `packages/openclaw-plugin/src/register-tools.ts` already accepts explicit handlers. Phase 27 should fill that seam with real implementations instead of changing the plugin contract again.

</specifics>

<deferred>
## Deferred Ideas

- Final native success envelope and error category contract for agents
- OpenClaw-native docs/default-path migration
- Broader MCP/host expansion beyond OpenClaw

</deferred>

---
*Phase: 27-shared-api-adapter-and-native-tool-catalog*
*Context gathered: 2026-03-11 via roadmap, requirements, Phase 26 outputs, and current MCP/native plugin runtime review*
