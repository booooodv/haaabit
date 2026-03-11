# Requirements: Haaabit

**Defined:** 2026-03-11
**Core Value:** Let AI accurately understand what the user needs to do today and reliably complete habit check-ins on the user's behalf.

## v1.7 Requirements

Requirements for the v1.7 `OpenClaw Native Plugin` milestone.

### Native OpenClaw Plugin Surface

- [x] **OCP-01**: OpenClaw can load one native Haaabit plugin package and see callable habits, today, and stats tools without requiring a separate MCP runner, bridge, or mcporter hop.
- [x] **OCP-02**: The native OpenClaw plugin exposes the same intent coverage as the shipped Haaabit tool surface so agents can still read today state, manage habits, and review stats through one consistent tool vocabulary.
- [x] **OCP-03**: Haaabit ships the plugin manifest and runtime entrypoints required for a fresh OpenClaw session to register the tools reliably.

### Shared API Runtime and Auth Reuse

- [x] **SHRD-01**: The OpenClaw plugin reuses the existing Haaabit API client, shared contracts/types, and bearer-token auth semantics instead of copying business logic or schema definitions into a second OpenClaw-only implementation.
- [x] **SHRD-02**: The plugin reads `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` from environment variables and fails fast with explicit startup errors when either value is missing, empty, or malformed for runtime use.
- [x] **SHRD-03**: The OpenClaw-native transport layer stays thin, with all habit/today/stats domain behavior still enforced by the shipped Haaabit API.

### Structured Results and Failure Semantics

- [x] **RESP-01**: Every native plugin tool returns structured JSON intended for agent consumption rather than exposing raw HTTP response objects or transport-specific wrappers.
- [x] **RESP-02**: Network and upstream API failures return structured errors that clearly distinguish connectivity/timeouts from authenticated API rejections.
- [x] **RESP-03**: Missing habit targets and wrong-kind mutations return clear structured errors that tell the agent whether it needs a different `habitId` or a different tool.

### Verification and Operator Readiness

- [ ] **VER-01**: v1.7 includes repository verification for plugin manifest/runtime loading, environment validation, and at least one read flow plus one safe mutation flow through the native OpenClaw plugin path.
- [x] **VER-02**: Haaabit ships one canonical OpenClaw-native setup path and updates docs/examples so operators do not default back to the old `skill -> mcporter -> MCP -> API` route for this host.

## Future Requirements

### MCP and Host Expansion

- **MCPX-01**: The generic `@haaabit/mcp` package continues evolving for non-OpenClaw hosts, including remote transport and registry publication follow-through.
- **HOST-01**: Additional native host integrations can reuse the same shared API/client layer once the OpenClaw-native package contract is proven.

### Product Expansion

- **NOTF-01**: Operator can configure outbound email delivery for reminder-related workflows.
- **NOTF-02**: System can send reminder emails based on user-configured rules.
- **VISX-01**: User can switch to a fully supported dark theme with parity across all core surfaces.
- **PROD-01**: User can move faster through the app with deeper keyboard-first productivity features.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting Haaabit business rules inside the OpenClaw package | v1.7 changes transport and host integration, not the source of domain truth |
| Replacing or deleting the generic `@haaabit/mcp` package for all hosts | The immediate problem is OpenClaw's native tool path, not removing MCP for other clients |
| Introducing a new auth model beyond `HAAABIT_API_URL` plus personal API token | The runtime credential model is already established and should stay stable |
| Shipping remote MCP transport or registry metadata as part of this milestone | Those remain valid backlog items, but they widen scope away from the native OpenClaw path |
| New habit/product semantics unrelated to OpenClaw-native tooling | The milestone is about host transport and tool delivery, not expanding the product domain |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OCP-01 | Phase 26 | Complete |
| OCP-02 | Phase 27 | Complete |
| OCP-03 | Phase 26 | Complete |
| SHRD-01 | Phase 27 | Complete |
| SHRD-02 | Phase 26 | Complete |
| SHRD-03 | Phase 27 | Complete |
| RESP-01 | Phase 28 | Complete |
| RESP-02 | Phase 28 | Complete |
| RESP-03 | Phase 28 | Complete |
| VER-01 | Phase 29 | Pending |
| VER-02 | Phase 28 | Complete |

**Coverage:**
- v1.7 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after Phase 28 completed native result/error hardening and docs migration*
