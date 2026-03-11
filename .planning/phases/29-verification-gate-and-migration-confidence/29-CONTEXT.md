# Phase 29: Verification Gate and Migration Confidence - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 29 closes the v1.7 milestone by proving the native OpenClaw plugin path is verifiable in-repo and that operators can migrate from the older OpenClaw MCP bridge story without guesswork.

The phase should not reopen plugin runtime design, tool coverage, or result/error contract shape. Those were completed in Phases 26-28.

The remaining gap is verification:

- current root `verify:openclaw` scripts are still MCP-centric
- the repo has good unit/contract tests for `packages/openclaw-plugin`, but no milestone-level native verification gate
- real OpenClaw UI/plugin-loader checks remain external-host-only, so the repo needs the strongest possible native in-repo proxy

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions

- Keep `@haaabit/openclaw-plugin` as the canonical OpenClaw runtime path.
- Keep `@haaabit/mcp` as the generic-host path and one-shot `bootstrap-token` helper.
- Treat real OpenClaw UI/plugin loading as external-host-only; do not pretend the repository can boot the real host.
- Use repository-native verification to prove manifest/runtime loading, env validation, tool registration, and at least one real API-backed read + safe mutation through the native plugin boundary.
- Preserve the existing Haaabit API test-helper seam instead of inventing a second fake backend.
- Capture migration notes from the older OpenClaw MCP setup to the native plugin path before closing the milestone.

### Claude's Discretion

- Whether to keep `verify:openclaw` / `verify:openclaw:full` names and repoint them to native coverage, or add a small companion script while preserving the public names.
- Whether migration notes live in a dedicated doc or are folded into the existing OpenClaw checklist/troubleshooting docs.
- Exact shape of the fake OpenClaw host harness, as long as it proves native registration + invocation against the real API app.

</decisions>

<specifics>
## Specific Ideas

- Reuse `apps/api/test/helpers/app.ts` and token issuance helpers like the existing MCP stdio integration tests already do.
- Exercise the native path through `activateHaaabitOpenClawPlugin(...)` plus a fake `registerTool(...)` collector, not through MCP transport.
- Verify a read flow starting with `today_get_summary` or `habits_list`.
- Verify a safe mutation flow such as `today_complete` or `today_set_total`, followed by readback/asserted refreshed state.
- Upgrade the root verification scripts so `pnpm verify:openclaw` reflects the native plugin story the docs now describe.

</specifics>

<deferred>
## Deferred Ideas

- Real OpenClaw UI/session automation
- Renaming or deleting the generic MCP package/scripts beyond what is needed for native verification clarity
- Additional host integrations beyond OpenClaw

</deferred>

---

*Phase: 29-verification-gate-and-migration-confidence*
*Context gathered: 2026-03-11*
