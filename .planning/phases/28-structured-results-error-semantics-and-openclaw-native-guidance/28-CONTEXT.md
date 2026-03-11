# Phase 28: Structured Results, Error Semantics, and OpenClaw-native Guidance - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 28 does not add new tool coverage. Phase 27 already gave the native OpenClaw plugin real habits/today/stats handlers on top of the shared Haaabit API runtime. What remains is contract hardening: the native plugin now returns a thin shape like `{ ok, summary, data }` or `{ ok, error }`, but that shape is still an implementation convenience, not a fully locked agent-facing contract.

This phase should formalize that native success/error contract so agents can rely on it, make failure categories explicit enough to distinguish network/auth/not-found/wrong-tool cases, and update operator-facing docs/examples so OpenClaw no longer defaults to the old `skill -> mcporter -> MCP -> API` story.

</domain>

<decisions>
## Implementation Decisions

### Result contract
- Every native plugin tool should return stable structured JSON intended for agent consumption.
- Success responses should not expose raw HTTP response objects or transport wrappers.
- The success shape should stay consistent across read and mutation tools.

### Failure contract
- Native plugin failures should clearly distinguish network/timeout failures, authenticated API failures, not-found targets, and wrong-kind mutation/tool mismatches.
- The error contract should tell the agent whether it needs a different `habitId`, a different tool, or operator intervention.
- Config/startup failures from Phase 26 remain part of the same overall native plugin error story.

### OpenClaw-native guidance
- OpenClaw-facing docs/examples should now prefer the native plugin path first.
- The generic `@haaabit/mcp` path still exists for non-OpenClaw hosts, but it should no longer be the default answer for OpenClaw.
- Operator docs must explain the difference between OpenClaw-native plugin usage and the generic MCP package cleanly.

### Scope boundary
- Phase 28 hardens native response/error semantics and host-facing guidance.
- Phase 29 owns repository verification and migration-confidence proof.
- Do not reopen core handler existence or native package scaffolding unless contract hardening uncovers a blocker.

### Claude's Discretion
- Exact native success envelope field names as long as they are stable, machine-readable, and consistent.
- Exact error category taxonomy so long as it satisfies `RESP-02` and `RESP-03`.
- Exact doc/example file layout for the canonical OpenClaw-native setup story.

</decisions>

<specifics>
## Specific Ideas

- Current native handlers in `packages/openclaw-plugin/src/native-handlers.ts` already centralize success/error returns; that is the right seam for envelope hardening.
- Shared error semantics already exist in `packages/mcp/src/client/error-payload.ts`, but Phase 28 likely needs a more explicit native plugin taxonomy on top of those raw categories.
- Existing docs still point OpenClaw toward `packages/mcp/examples/openclaw.jsonc` and paired MCP runner setup; that guidance now needs a native-first replacement for this host.
- Likely doc touchpoints are `README.md`, `docs/ai-agent-integration.md`, `docs/openclaw-validation-checklist.md`, `docs/openclaw-troubleshooting.md`, and possibly a new example asset under `packages/openclaw-plugin/`.

</specifics>

<deferred>
## Deferred Ideas

- End-to-end repository verification for native plugin loading and real migration confidence
- External-host manual confirmation in a real OpenClaw UI/session
- Generic MCP roadmap work for non-OpenClaw hosts

</deferred>

---
*Phase: 28-structured-results-error-semantics-and-openclaw-native-guidance*
*Context gathered: 2026-03-11 via roadmap, requirements, Phase 27 outputs, and current OpenClaw/MCP documentation review*
