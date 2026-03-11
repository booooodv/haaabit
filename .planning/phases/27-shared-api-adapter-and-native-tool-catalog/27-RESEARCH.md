# Phase 27: Shared API Adapter and Native Tool Catalog - Research

**Researched:** 2026-03-11
**Domain:** Reusing the shipped Haaabit API/client/contracts stack to power native OpenClaw tool handlers
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace the native plugin placeholders with real Haaabit API-backed handlers.
- Reuse the shipped API client, contracts/types, auth semantics, and tool vocabulary.
- Keep the OpenClaw package native; no MCP forwarding or hidden bridge.
- Keep Haaabit domain truth in the shipped API rather than copying business rules into `packages/openclaw-plugin`.

### Claude's Discretion
- Exact shared-runtime file layout
- Whether reuse lands as extraction or exposure/re-export from existing modules
- Exact temporary native return shape before Phase 28 hardens the final envelope

### Deferred Ideas (OUT OF SCOPE)
- Final native success/error envelope design
- OpenClaw docs migration
- End-to-end migration verification
</user_constraints>

<research_summary>
## Summary

Phase 27 should be planned as three execution slices:

1. **Shared runtime extraction/exposure**
   Pull the reusable API client, error semantics, and tool-operation metadata out of MCP-only wrappers so the plugin can call the same runtime without importing `CallToolResult` or MCP serializers.
2. **Native read tools**
   Replace placeholder handlers for `habits_list`, `habits_get_detail`, `today_get_summary`, and `stats_get_overview` with real API-backed handlers built on the shared runtime seam.
3. **Native mutation tools**
   Replace placeholder handlers for `habits_add`, `habits_edit`, `habits_archive`, `habits_restore`, `today_complete`, `today_set_total`, and `today_undo` with real API-backed handlers using the same auth and endpoint semantics as the MCP package.

**Primary recommendation:** do not write a second implementation of Haaabit operations in the OpenClaw package. Instead, extract or expose one host-neutral runtime layer that both MCP and OpenClaw-native code can use, then let the plugin adapt that layer to the native host contract.
</research_summary>

<standards_and_sources>
## Standards and Source Findings

### The current API client is already reusable
`packages/mcp/src/client/api-client.ts` is host-neutral today:
- it owns URL normalization,
- bearer token injection,
- timeout handling,
- JSON/text response parsing,
- and conversion of HTTP failures into `HaaabitApiError`.

This is exactly the runtime seam the plugin should reuse.

### The current error layer is only partially reusable
`packages/mcp/src/client/errors.ts` contains two different concerns:
- reusable error data and semantic mapping (`HaaabitApiError`, status/code inspection),
- MCP-only serialization (`CallToolResult`, `toMcpErrorResult`, `buildMachineReadableToolResult`).

Phase 27 should split or expose the reusable core without pulling MCP result types into the native plugin.

### The current tool modules already encode the correct API behavior
`packages/mcp/src/tools/habits.ts`, `today.ts`, and `stats.ts` already know:
- which endpoint each tool calls,
- which request schema to parse,
- which response schema to parse,
- and which concise summary text to generate.

That logic should stay single-sourced. The main missing seam is that these handlers currently return MCP tool results instead of a host-neutral operation result.

### The plugin registration seam is already ready
Phase 26 gave `packages/openclaw-plugin/src/register-tools.ts` an explicit `handlers` injection point and pinned the native tool catalog. That means Phase 27 does not need to redesign registration. It only needs to provide real handlers that match the existing tool names and schemas.

### The highest-risk drift is duplication
If OpenClaw read/write handlers are implemented by rewriting request logic directly in `packages/openclaw-plugin`, the repo will immediately have two copies of:
- endpoint routing,
- input parsing,
- response parsing,
- summary wording,
- and error mapping assumptions.

That would violate both `SHRD-01` and `SHRD-03`.
</standards_and_sources>

<standard_stack>
## Standard Stack

### Core
| Artifact | Purpose | Why It Fits |
|---------|---------|-------------|
| `packages/mcp/src/client/api-client.ts` | Shared API transport and auth | Already host-neutral and battle-tested in the shipped MCP path. |
| `packages/mcp/src/contracts/*` | Shared input/output schemas | Already the current tool source of truth for habits/today/stats payloads. |
| `packages/mcp/src/tools/habits.ts` | Habit tool operations and summaries | Already contains the real endpoint and summary behavior. |
| `packages/mcp/src/tools/today.ts` | Today tool operations and summaries | Already contains correct today endpoint semantics. |
| `packages/mcp/src/tools/stats.ts` | Stats tool operations and summaries | Already contains the real stats endpoint behavior. |
| `packages/openclaw-plugin/src/register-tools.ts` | Native registration seam | Already ready to accept real handler implementations. |

### Validation
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `pnpm typecheck` | Catch shared-runtime drift across packages | After every plan |
| `pnpm --filter @haaabit/openclaw-plugin exec vitest run ...` | Native plugin contract/runtime regression coverage | After every task |
| `pnpm --filter @haaabit/openclaw-plugin build` | Prove native package still emits after shared extraction | After every wave |
| `pnpm --filter @haaabit/mcp exec vitest run ...` | Guard the existing MCP package while shared seams move | After shared-runtime and handler work |

### Implications
- Phase 27 should touch both `packages/mcp` and `packages/openclaw-plugin`.
- Shared runtime extraction should happen before native read/write implementation.
- Existing MCP tests are part of the safety net because shared code will move or be re-exported.
</standard_stack>

<implementation_notes>
## Implementation Notes

### Recommended plan split
- `27-01` should isolate or expose host-neutral API client, error-core, and tool-operation seams so OpenClaw code can import them without MCP result types.
- `27-02` should implement the native read tools first because they are lower risk and validate the shared-runtime seam before mutations.
- `27-03` should implement native mutations second because they rely on the same runtime plus more failure-path coverage.

### Shared-runtime strategy
- Keep `HaaabitApiClient` as the single request transport.
- Separate `HaaabitApiError` and reusable error classification/hint derivation from MCP result serialization.
- Prefer a host-neutral operation result shape such as `{ payload, summary }` or `{ data, summary }` inside the shared seam, then let each host serialize it.
- Reuse existing route/path decisions and summary functions from the current MCP tool modules instead of restating them in the plugin package.

### Native handler strategy
- `packages/openclaw-plugin` should build a real handler map and pass it into `registerTools(...)`.
- Read tools should cover:
  - `habits_list`
  - `habits_get_detail`
  - `today_get_summary`
  - `stats_get_overview`
- Mutation tools should cover:
  - `habits_add`
  - `habits_edit`
  - `habits_archive`
  - `habits_restore`
  - `today_complete`
  - `today_set_total`
  - `today_undo`

### Test strategy
- Add package-local plugin tests that prove each native handler:
  - calls the correct API path/method through the shared client,
  - preserves the intended tool vocabulary,
  - returns structured data rather than placeholder failures,
  - and still registers through the existing native plugin bootstrap.
- Keep targeted MCP tests in the full suite to catch regressions while shared seams move.
</implementation_notes>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Reusing schemas but rewriting handler logic
**What goes wrong:** The plugin technically imports shared types but still duplicates endpoint paths, request bodies, and summary behavior.
**How to avoid:** Extract or expose one host-neutral operation layer and make both hosts consume it.

### Pitfall 2: Pulling MCP types into the plugin
**What goes wrong:** `packages/openclaw-plugin` imports `CallToolResult`, `buildMachineReadableToolResult`, or other MCP-only helpers just to share code.
**How to avoid:** Split the reusable error/runtime core from MCP serialization first.

### Pitfall 3: Mixing Phase 28 concerns into Phase 27
**What goes wrong:** Handler implementation stalls because result-envelope design and full error taxonomy are being redesigned early.
**How to avoid:** Keep Phase 27 on real API-backed execution with a thin structured native return shape; save final envelope hardening for Phase 28.

### Pitfall 4: Breaking the shipped MCP path while extracting shared seams
**What goes wrong:** The plugin starts working, but existing MCP tests fail because shared modules were moved carelessly.
**How to avoid:** Keep targeted MCP regression tests in the full validation command and preserve the current public MCP behavior.

### Pitfall 5: Leaving registration tied to placeholders
**What goes wrong:** Shared runtime extraction lands, but the native plugin still boots with `PHASE_27_PENDING`.
**How to avoid:** Make each plan replace concrete placeholder groups, not just expose helper modules.
</common_pitfalls>

## Validation Architecture

Phase 27 has four main risk surfaces:

1. **Shared-runtime drift**: extracting reusable logic may break the existing MCP package or accidentally keep MCP-only types in the plugin path.
2. **Read-handler parity**: native read tools must call the same endpoints and parse the same schemas as the shipped MCP tools.
3. **Mutation-handler parity**: native mutation tools must preserve the same request semantics and direct API behavior as the shipped MCP tools.
4. **Bootstrap continuity**: the native plugin must continue to register and activate through the Phase 26 bootstrap seam after real handlers replace placeholders.

Recommended validation stack:

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/config/env.test.ts`
- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`

Recommended quick command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/shared-runtime.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts test/config/env.test.ts
```

Recommended full command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts
```

Planner implications:
- `27-01` must land first because the native plugin cannot safely reuse the shipped runtime until MCP-only wrappers are separated.
- `27-02` should prove the read path before mutations widen the failure surface.
- `27-03` can then replace the remaining placeholders with real write handlers on the same shared seam.

<open_questions>
## Remaining Open Questions

- Whether the cleanest shared seam is a new host-neutral module under `packages/mcp/src/` or a slightly higher shared location. This does not block planning as long as duplication is avoided.
- Whether the temporary native success payload should be normalized in Phase 27 or only minimally structured before Phase 28 hardens it. This also does not block planning.
</open_questions>

<sources>
## Sources

### Internal (HIGH confidence)
- `/Users/finn/code/haaabit/.planning/phases/27-shared-api-adapter-and-native-tool-catalog/27-CONTEXT.md`
- `/Users/finn/code/haaabit/.planning/ROADMAP.md`
- `/Users/finn/code/haaabit/.planning/REQUIREMENTS.md`
- `/Users/finn/code/haaabit/.planning/STATE.md`
- `/Users/finn/code/haaabit/.planning/phases/26-native-plugin-contract-and-package-scaffold/26-RESEARCH.md`
- `/Users/finn/code/haaabit/packages/mcp/src/client/api-client.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/client/errors.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/contracts/habits.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/contracts/checkins.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/contracts/today.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/contracts/stats.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/tools/habits.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/tools/today.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/tools/stats.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/tools/inventory.ts`
- `/Users/finn/code/haaabit/packages/openclaw-plugin/src/index.ts`
- `/Users/finn/code/haaabit/packages/openclaw-plugin/src/register-tools.ts`
- `/Users/finn/code/haaabit/CLAUDE.md`
</sources>

---
*Research complete: 2026-03-11*
