# Roadmap: Haaabit

## Milestones

- ✅ **v1.0 milestone** — Phases 1-6, 16/16 plans complete, shipped 2026-03-07 and archived 2026-03-08.
  Archive:
  - `milestones/v1.0-ROADMAP.md`
  - `milestones/v1.0-REQUIREMENTS.md`
  - `milestones/v1.0-MILESTONE-AUDIT.md`
- ✅ **v1.1 Impeccable UI Polish** — Phases 7-11, 15/15 plans complete, shipped 2026-03-08 and archived 2026-03-08.
  Archive:
  - `milestones/v1.1-ROADMAP.md`
  - `milestones/v1.1-REQUIREMENTS.md`
  - `milestones/v1.1-MILESTONE-AUDIT.md`
- ✅ **v1.2 Chinese and English Localization** — Phases 12-14, 8/8 plans complete, shipped 2026-03-08 and archived 2026-03-08.
  Archive:
  - `milestones/v1.2-ROADMAP.md`
  - `milestones/v1.2-REQUIREMENTS.md`
  - `milestones/v1.2-MILESTONE-AUDIT.md`
- ✅ **v1.3 Bug Fix Iteration** — shipped in the current code baseline on 2026-03-09; tracked planning archive was not preserved in this repository snapshot.
- ✅ **v1.4 Open Source Readiness** — Phases 15-17, 7/7 plans complete, shipped and archived 2026-03-09.
  Archive:
  - `milestones/v1.4-ROADMAP.md`
  - `milestones/v1.4-REQUIREMENTS.md`
  Notes:
  - No standalone `v1.4-MILESTONE-AUDIT.md` was recorded before archival.
- ✅ **v1.5 MCP Integration** — Phases 18-21, 11/11 plans complete, shipped and archived 2026-03-09.
  Archive:
  - `milestones/v1.5-ROADMAP.md`
  - `milestones/v1.5-REQUIREMENTS.md`
  - `milestones/v1.5-MILESTONE-AUDIT.md`
- ✅ **v1.6 OpenClaw Compatibility** — Phases 22-25, 11/11 plans complete, shipped 2026-03-10 and archived 2026-03-11.
  Archive:
  - `milestones/v1.6-ROADMAP.md`
  - `milestones/v1.6-REQUIREMENTS.md`
  - `milestones/v1.6-MILESTONE-AUDIT.md`
  Notes:
  - Archived with accepted non-blocking `tech_debt`: missing standalone `22-VERIFICATION.md` through `25-VERIFICATION.md`, `wave_0_complete: false` across the v1.6 validation docs, and real OpenClaw UI/secret-store checks remaining external-host-only.

## Active Milestone

### v1.7 OpenClaw Native Plugin

**Status:** In progress
**Phases:** 26-29
**Total Plans:** 11

### Overview

v1.7 replaces the current OpenClaw `skill -> mcporter -> MCP -> API` chain with a native OpenClaw plugin package that calls the shipped Haaabit API directly. The milestone keeps the existing Haaabit domain model, bearer-token auth contract, and contracts/types single-sourced while removing the extra transport layer that currently makes OpenClaw setup and runtime less direct than it needs to be.

### Phases

#### Phase 26: Native Plugin Contract and Package Scaffold

**Goal**: Define the OpenClaw-native plugin contract and add the new package/runtime scaffold without reintroducing MCP as an internal dependency.
**Depends on**: Shipped v1.6 OpenClaw compatibility baseline and current Haaabit API contracts
**Plans**: 3 plans

Plans:

- [x] 26-01: Confirm the OpenClaw plugin manifest/runtime contract, package entrypoints, and workspace integration points for a native tool package
- [x] 26-02: Add `packages/openclaw-plugin` with build/package scaffolding plus the manifest and bootstrap entrypoints OpenClaw expects
- [x] 26-03: Implement plugin startup config and fail-fast env validation around `HAAABIT_API_URL` and `HAAABIT_API_TOKEN` without routing through MCP config loaders

**Details:**
- Requirements: `OCP-01`, `OCP-03`, `SHRD-02`
- Outcomes: one discoverable plugin package, one explicit runtime contract, and zero MCP bridge dependency in the OpenClaw-native path.
- Success criteria:
  1. The repo contains a first-class OpenClaw plugin package that is structurally ready to register native tools.
  2. Plugin startup tells the operator exactly what is wrong when API URL/token config is absent or unusable.
  3. The native plugin scaffold does not wrap or spawn the MCP server as an implementation crutch.

#### Phase 27: Shared API Adapter and Native Tool Catalog

**Goal**: Reuse the shipped API/client/contracts stack to expose the full Haaabit tool catalog as native OpenClaw tools.
**Depends on**: Phase 26
**Plans**: 3 plans

Plans:

- [x] 27-01: Extract or expose the reusable API client/contracts/error primitives needed by the plugin without duplicating domain logic
- [x] 27-02: Implement native OpenClaw read tools for habits, today summary, and stats overview on top of the shared API layer
- [x] 27-03: Implement native OpenClaw mutation tools for habit management and today actions with the same bearer-authenticated API semantics

**Details:**
- Requirements: `OCP-02`, `SHRD-01`, `SHRD-03`
- Outcomes: one native OpenClaw tool surface backed directly by the shipped Haaabit API, with shared contracts instead of a forked OpenClaw-specific implementation.
- Success criteria:
  1. The plugin exposes the intended habits/today/stats capability set without inventing a second domain vocabulary.
  2. Shared client/types/auth code is reused rather than copied into `packages/openclaw-plugin`.
  3. Tool handlers talk directly to the Haaabit API and keep domain behavior single-sourced there.

#### Phase 28: Structured Results, Error Semantics, and OpenClaw-native Guidance

**Goal**: Make the native plugin agent-friendly by returning stable structured JSON and explicit failure categories, then update host-facing guidance to prefer the new path.
**Depends on**: Phase 27
**Plans**: 3 plans

Plans:

- [x] 28-01: Define and implement the native plugin success envelope so every tool returns machine-readable JSON rather than raw HTTP output
- [x] 28-02: Map network failures, not-found targets, and wrong-kind mutations into clear structured plugin errors with actionable hints
- [x] 28-03: Update OpenClaw-facing docs/examples so operators follow the native plugin path first and understand how it differs from the generic MCP story

**Details:**
- Requirements: `RESP-01`, `RESP-02`, `RESP-03`, `VER-02`
- Outcomes: predictable agent-readable outputs, sharper diagnostics, and one canonical story for OpenClaw-native runtime setup.
- Success criteria:
  1. Success responses are easy for agents to consume without scraping text or HTTP wrappers.
  2. Failure responses clearly distinguish config, network, not-found, and wrong-tool/type scenarios.
  3. OpenClaw docs no longer imply that this host should prefer the older MCP-bridged path by default.

#### Phase 29: Verification Gate and Migration Confidence

**Goal**: Prove the new native plugin path works in-repo and is ready to replace the previous OpenClaw bridge in normal use.
**Depends on**: Phase 28
**Plans**: 2 plans

Plans:

- [ ] 29-01: Add verification for plugin manifest/runtime loading, env validation, and native tool registration/contract smoke coverage
- [ ] 29-02: Run end-to-end read/write verification through the native plugin path and capture any migration notes needed from the previous OpenClaw setup

**Details:**
- Requirements: `VER-01`
- Outcomes: release-ready evidence that the native plugin path works and that OpenClaw can stop depending on an MCP bridge for Haaabit.
- Success criteria:
  1. Verification proves the plugin loads, validates config, and exposes the expected tool inventory.
  2. At least one read flow and one safe mutation flow succeed against the real Haaabit API through the native plugin runtime.
  3. The migration from the older OpenClaw bridge path is documented well enough that operators can switch without guesswork.

## Carry-Forward Candidates

- Remote Streamable HTTP transport for Haaabit MCP
- MCP Registry publication metadata
- Additional host-ready integration bundles beyond OpenClaw
- Future product expansion items from archived requirements (`NOTF-01`, `NOTF-02`, `VISX-01`, `PROD-01`)

---

_For current project status, see `.planning/STATE.md`._
