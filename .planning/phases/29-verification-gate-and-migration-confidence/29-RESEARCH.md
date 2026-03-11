# Phase 29 Research

**Date:** 2026-03-11
**Phase:** 29 Verification Gate and Migration Confidence

## What Exists Already

- `packages/openclaw-plugin` now has solid contract/unit coverage:
  - manifest/bootstrap/env tests
  - tool catalog/registration tests
  - result envelope tests
  - error semantics tests
  - docs smoke tests
- Root docs already point OpenClaw to `packages/openclaw-plugin/examples/openclaw-plugin.jsonc`.
- Root `verify:openclaw` and `verify:openclaw:full` scripts still exercise the older MCP package and docs smoke suite.
- Existing MCP stdio integration tests already know how to:
  - boot the real Fastify API test app
  - create a user
  - mint a personal API token
  - run one real read flow and one safe mutation flow

## Main Gaps

1. No repository-level verification script currently proves the native plugin path.
2. No real API-backed integration test currently invokes the OpenClaw-native handlers through plugin registration.
3. Migration guidance from the older OpenClaw MCP bridge path to the native plugin path is implied, but not yet captured as an explicit close-out artifact.

## Recommended Split

### Plan 29-01: Native verification gate

Best scope:

- repoint or expand root `verify:openclaw` scripts to include native plugin checks
- add one package-level verification smoke test for manifest/runtime/env/registration/docs alignment
- keep MCP regression coverage available, but stop treating it as the only OpenClaw verification truth

Why first:

- this establishes the release gate the milestone should end on
- later real integration work can plug directly into that gate

### Plan 29-02: Real native integration + migration notes

Best scope:

- add a real API-backed native plugin integration test using `activateHaaabitOpenClawPlugin(...)`
- collect registered handlers from a fake OpenClaw host API and call them directly
- prove one read and one safe mutation through the native plugin boundary
- capture migration notes from the old OpenClaw MCP setup to the new native plugin setup

Why second:

- it depends on the verification gate from Plan 29-01
- it provides the final evidence and operator handoff the milestone needs

## Recommended Technical Approach

### Native integration harness

Use:

- `apps/api/test/helpers/app.ts`
- the existing token issuance pattern from `packages/mcp/test/server/stdio-read-integration.test.ts`
- a fake `registerTool(name, registration, handler)` collector

Then:

1. activate the plugin against a real API URL/token
2. collect the registered native handlers
3. call a read handler and assert the native success envelope
4. call a safe mutation handler and assert updated native state

This is the strongest in-repo proof available without the real OpenClaw UI.

### Migration notes

Best likely output:

- a short dedicated migration note or a clearly separated section in existing OpenClaw docs

Must cover:

- remove the OpenClaw MCP runner block
- add the native plugin block
- keep the same `HAAABIT_API_URL` / `HAAABIT_API_TOKEN`
- keep `bootstrap-token` only as a one-shot helper
- optionally keep the Haaabit Skill as guidance, not transport

## Planning Implications

- Phase 29 should remain only 2 plans.
- Both plans should stay tightly scoped to verification/migration confidence.
- Verification commands in `29-VALIDATION.md` should include native plugin tests first and MCP regressions second.

---

*Research complete: 2026-03-11*
