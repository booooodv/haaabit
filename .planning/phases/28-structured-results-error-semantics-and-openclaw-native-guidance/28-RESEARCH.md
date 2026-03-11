# Phase 28: Structured Results, Error Semantics, and OpenClaw-native Guidance - Research

**Researched:** 2026-03-11
**Domain:** Hardening the native plugin's agent-facing contract and moving OpenClaw docs to a native-first setup story
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Native plugin tool results must become stable structured JSON for agent consumption.
- Native failures must distinguish network/auth/not-found/wrong-tool-or-kind scenarios clearly.
- OpenClaw-facing docs/examples should prefer the native plugin path first instead of the old MCP bridge story.
- Generic MCP support remains valid for non-OpenClaw hosts and should not be deleted.

### Claude's Discretion
- Exact success envelope field names
- Exact native error taxonomy
- Exact doc/example file layout for OpenClaw-native setup

### Deferred Ideas (OUT OF SCOPE)
- Full end-to-end migration verification
- External-host-only UI verification
- New tool coverage beyond the existing Phase 27 surface
</user_constraints>

<research_summary>
## Summary

Phase 28 should be planned as three execution slices:

1. **Success envelope hardening**
   Lock one native success JSON envelope for all tools so agents can consume a stable machine-readable shape without scraping text or guessing which fields are present.
2. **Error semantics hardening**
   Map runtime and API failures into explicit native categories with actionable hints, especially for timeout/network failures, wrong-kind mutations, and missing habits.
3. **OpenClaw-native docs/examples**
   Replace the current OpenClaw-default MCP guidance with a native plugin setup story, while keeping MCP docs available as the generic-host path.

**Primary recommendation:** keep result/error hardening at the `packages/openclaw-plugin` seam. The shared runtime should remain transport-neutral, while the native plugin owns the final agent-facing envelope and OpenClaw-specific setup guidance.
</research_summary>

<standards_and_sources>
## Standards and Source Findings

### The current native success shape is useful but not yet a formal contract
`packages/openclaw-plugin/src/native-handlers.ts` currently returns:
- success: `{ ok: true, summary, data }`
- error: `{ ok: false, error }`

That shape is already clean enough to harden, but it is not yet locked by dedicated result-envelope tests or docs. Phase 28 should explicitly codify it or evolve it once in a controlled way, rather than letting later phases drift it implicitly.

### Shared error payloads exist, but native categories still need hardening
`packages/mcp/src/client/error-payload.ts` already centralizes status/code/message/hint derivation. That means Phase 28 does not need to invent all semantics from scratch. What it still needs is:
- a native plugin-facing category taxonomy that agents can branch on reliably,
- explicit treatment of timeout/network failures separate from API validation/auth failures,
- and stable wrong-tool/wrong-kind guidance for agent retries.

### The current docs still frame OpenClaw around the MCP bridge
The repository still points OpenClaw operators to:
- `packages/mcp/examples/openclaw.jsonc`
- paired MCP runner setup
- skill + MCP coordination

That was correct through v1.6, but it is now stale for the native plugin milestone. Phase 28 should add a native plugin example/story and make OpenClaw-native setup the canonical path, while leaving `@haaabit/mcp` docs in place for generic hosts.

### The right separation is host-neutral runtime vs host-facing contract
Phase 27 established a good architecture boundary:
- shared runtime in `packages/mcp/src/...`
- native host contract in `packages/openclaw-plugin`

Phase 28 should preserve that. Do not move envelope/docs concerns down into the shared runtime seam.
</standards_and_sources>

<standard_stack>
## Standard Stack

### Core
| Artifact | Purpose | Why It Fits |
|---------|---------|-------------|
| `packages/openclaw-plugin/src/native-handlers.ts` | Final native success/error envelope seam | Already centralizes every native tool return path. |
| `packages/mcp/src/client/error-payload.ts` | Shared error interpretation layer | Already provides the semantic inputs Phase 28 needs. |
| `packages/openclaw-plugin/test/read-tools.test.ts` | Current native read behavior coverage | Can be extended to pin final success envelope guarantees. |
| `packages/openclaw-plugin/test/mutation-tools.test.ts` | Current native mutation behavior coverage | Can be extended to pin final error semantics. |
| `README.md` + `docs/ai-agent-integration.md` | Canonical operator guidance | Already document the old OpenClaw MCP route and need native-first rewriting. |

### Recommended additions
| Candidate | Why It Helps |
|----------|---------------|
| `packages/openclaw-plugin/test/result-envelope.test.ts` | Pins one consistent success contract across read and mutation tools. |
| `packages/openclaw-plugin/test/error-semantics.test.ts` | Pins native failure categories and actionable hints. |
| `packages/openclaw-plugin/examples/openclaw-plugin.jsonc` or similar | Gives OpenClaw one canonical native setup asset instead of borrowing the MCP example. |
| `packages/openclaw-plugin/README.md` | Lets the native package carry its own host-facing setup truth. |

### Implications
- Phase 28 will likely touch both code and docs.
- The verification contract should include doc smoke checks in addition to runtime tests.
- The generic MCP docs should be preserved but demoted for OpenClaw-specific guidance.
</standard_stack>

<implementation_notes>
## Implementation Notes

### Recommended plan split
- `28-01` should define and lock the native success envelope first so every tool returns one predictable shape.
- `28-02` should harden error semantics second, building on the now-stable success contract.
- `28-03` should update OpenClaw-facing docs/examples last so documentation reflects the final contract rather than a draft.

### Success envelope strategy
- Prefer one stable top-level shape for both reads and mutations.
- Preserve a human-readable summary field, but make machine-readable data the primary contract.
- Avoid embedding raw HTTP status, headers, or transport-specific wrappers in success cases.

### Error strategy
- Separate categories at least along:
  - config/startup
  - network/timeout
  - auth/upstream rejection
  - validation
  - not_found
  - wrong_kind_or_wrong_tool (or an equivalent explicit category)
- Keep hints actionable and short.
- Preserve enough source information that agents can retry safely without scraping strings.

### Docs strategy
- Add one native OpenClaw setup asset and one native package/setup reference.
- Update top-level docs so:
  - OpenClaw -> native plugin first
  - generic hosts -> `@haaabit/mcp`
- Update troubleshooting and validation docs so they no longer assume OpenClaw always needs a paired MCP runner.
</implementation_notes>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Hardening result fields in tests but not docs
**What goes wrong:** Agents inside the repo see one contract, operators read another.
**How to avoid:** Plan docs/example updates in the same phase as contract hardening.

### Pitfall 2: Letting error categories stay stringly and ad hoc
**What goes wrong:** Agents still have to parse messages like "Only quantified habits can use set-total" instead of a stable category/code.
**How to avoid:** Lock category/code/hint expectations in dedicated native error-semantics tests.

### Pitfall 3: Rewriting all docs as if MCP is obsolete
**What goes wrong:** The repo loses clear guidance for generic non-OpenClaw hosts.
**How to avoid:** Make docs host-specific: OpenClaw-native first, MCP generic second.

### Pitfall 4: Moving envelope logic into the shared runtime seam
**What goes wrong:** Host-neutral code becomes contaminated with OpenClaw-specific output decisions.
**How to avoid:** Keep final serialization/envelope choices inside `packages/openclaw-plugin`.

### Pitfall 5: Treating summary text as the machine contract
**What goes wrong:** The JSON is present but incomplete, and agents still rely on text.
**How to avoid:** Plan for tests that assert machine fields are sufficient without reading `summary`.
</common_pitfalls>

## Validation Architecture

Phase 28 has four main risk surfaces:

1. **Envelope drift**: read and mutation tools may keep returning slightly different success shapes.
2. **Error drift**: wrong-kind, not-found, timeout, and auth failures may still be too message-dependent for agents.
3. **Doc drift**: the code may become native-first while the docs still route OpenClaw through MCP.
4. **Regression drift**: hardening the native plugin contract must not break the Phase 27 shared runtime or current handler coverage.

Recommended validation stack:

- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts`
- `pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts`
- doc smoke checks for the native example and top-level OpenClaw guidance

Recommended quick command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin exec vitest run test/result-envelope.test.ts test/error-semantics.test.ts test/read-tools.test.ts test/mutation-tools.test.ts test/plugin-bootstrap.test.ts test/tool-registration.test.ts
```

Recommended full command:
```bash
pnpm typecheck && pnpm --filter @haaabit/openclaw-plugin build && pnpm --filter @haaabit/openclaw-plugin exec vitest run && pnpm --filter @haaabit/mcp exec vitest run test/client/api-client.test.ts test/client/errors.test.ts test/tools/habits-read.test.ts test/tools/habits-write.test.ts test/tools/today-stats-read.test.ts test/tools/today-write.test.ts test/tools/mutation-errors.test.ts
```

Planner implications:
- `28-01` should land before `28-02` because error semantics should align with the final top-level response contract.
- `28-02` should land before docs so operator guidance can describe the final behavior, not an intermediate taxonomy.
- `28-03` should include doc/example smoke coverage so OpenClaw-native guidance cannot silently regress.

<open_questions>
## Remaining Open Questions

- Whether the final success envelope should keep `summary` as a top-level field or move it into a more explicit `meta` section.
- Whether wrong-kind failures deserve a distinct category separate from generic validation.

Neither question blocks planning because the phase goal is to lock one stable answer, not to preserve the current ambiguity.
</open_questions>

<sources>
## Sources

### Internal (HIGH confidence)
- `/Users/finn/code/haaabit/.planning/phases/28-structured-results-error-semantics-and-openclaw-native-guidance/28-CONTEXT.md`
- `/Users/finn/code/haaabit/.planning/ROADMAP.md`
- `/Users/finn/code/haaabit/.planning/REQUIREMENTS.md`
- `/Users/finn/code/haaabit/.planning/STATE.md`
- `/Users/finn/code/haaabit/.planning/phases/27-shared-api-adapter-and-native-tool-catalog/27-VERIFICATION.md`
- `/Users/finn/code/haaabit/packages/openclaw-plugin/src/native-handlers.ts`
- `/Users/finn/code/haaabit/packages/openclaw-plugin/test/read-tools.test.ts`
- `/Users/finn/code/haaabit/packages/openclaw-plugin/test/mutation-tools.test.ts`
- `/Users/finn/code/haaabit/packages/mcp/src/client/error-payload.ts`
- `/Users/finn/code/haaabit/README.md`
- `/Users/finn/code/haaabit/docs/ai-agent-integration.md`
- `/Users/finn/code/haaabit/docs/openclaw-validation-checklist.md`
- `/Users/finn/code/haaabit/docs/openclaw-troubleshooting.md`
- `/Users/finn/code/haaabit/packages/mcp/README.md`
- `/Users/finn/code/haaabit/packages/mcp/examples/openclaw.jsonc`
</sources>

---
*Research complete: 2026-03-11*
