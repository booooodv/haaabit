# Quick Task 5 Summary

**Description:** 修复 @haaabit/mcp 0.1.2 发布包 CLI 启动即退出导致标准 MCP host Connection closed
**Date:** 2026-03-11
**Code Commit:** `d86bf81`
**Published Version:** `0.1.3`

## What Changed

- Hardened `packages/mcp/src/cli.ts` so direct execution detection now compares normalized real paths instead of the fragile `import.meta.url === pathToFileURL(process.argv[1]).href` check that breaks behind npm bin shims and symlinked launchers.
- Kept the stdio CLI process alive after `server.connect()` by explicitly waiting for stdin shutdown, so hosts have time to send `initialize` instead of seeing an immediate clean exit.
- Added regression coverage in `packages/mcp/test/server/cli.test.ts` for both the symlinked bin-shim detection path and the launched built CLI staying alive when invoked through a shim path.
- Bumped `@haaabit/mcp` from `0.1.2` to `0.1.3` and published the fixed package to npm.

## Verification

- `pnpm --filter @haaabit/mcp build`
- `pnpm --filter @haaabit/mcp exec vitest run test/server/cli.test.ts`
- Local symlinked-bin repro: launch `node <symlink-to-dist/cli.js> --timeout 15000` with `HAAABIT_API_URL` + `HAAABIT_API_TOKEN`, wait 2 seconds, confirm the process is still alive until terminated
- Packed publish-path repro: `npm pack` then `npx -y -p <local-tgz> mcp --timeout 15000`, wait 2 seconds, confirm the process stays alive
- `npm view @haaabit/mcp version`
  - Result: `0.1.3`

## Outcome

The published Haaabit MCP package once again behaves like a real long-lived `stdio` MCP server in standard host launch paths. Standard MCP hosts that invoke `npx -y @haaabit/mcp` should no longer fail immediately with `Connection closed` before `initialize`.
