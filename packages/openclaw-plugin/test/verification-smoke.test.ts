import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const packageRoot = new URL("../", import.meta.url);
const repoRoot = new URL("../../..", import.meta.url);

async function readPackageFile(path: string) {
  return readFile(new URL(path, packageRoot), "utf8");
}

async function readRepoFile(path: string) {
  return readFile(new URL(path, repoRoot), "utf8");
}

describe("native OpenClaw verification smoke", () => {
  it("treats the native plugin as the repository verification target for OpenClaw", async () => {
    const rootPackageJson = JSON.parse(await readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const migrationDoc = await readRepoFile("docs/openclaw-migration.md");
    const manifestTest = await readPackageFile("test/plugin-manifest.test.ts");
    const bootstrapTest = await readPackageFile("test/plugin-bootstrap.test.ts");
    const startupErrorsTest = await readPackageFile("test/plugin-startup-errors.test.ts");
    const envTest = await readPackageFile("test/config/env.test.ts");
    const registrationTest = await readPackageFile("test/tool-registration.test.ts");
    const docsSmokeTest = await readPackageFile("test/docs-native-openclaw.test.ts");

    expect(rootPackageJson.scripts?.["verify:openclaw"]).toContain("@haaabit/openclaw-plugin");
    expect(rootPackageJson.scripts?.["verify:openclaw"]).toContain("test/verification-smoke.test.ts");
    expect(rootPackageJson.scripts?.["verify:openclaw"]).toContain("test/plugin-manifest.test.ts");
    expect(rootPackageJson.scripts?.["verify:openclaw"]).not.toContain("test/server/stdio-integration.test.ts");

    expect(rootPackageJson.scripts?.["verify:openclaw:full"]).toContain("@haaabit/openclaw-plugin");
    expect(rootPackageJson.scripts?.["verify:openclaw:full"]).toContain("test/native-integration.test.ts");
    expect(rootPackageJson.scripts?.["verify:openclaw:full"]).toContain("test/docs-native-openclaw.test.ts");
    expect(rootPackageJson.scripts?.["verify:openclaw:full"]).toContain("@haaabit/mcp");

    expect(manifestTest).toContain("openclaw plugin manifest");
    expect(bootstrapTest).toContain("keeps the bootstrap native");
    expect(bootstrapTest).toContain("flattens nested env sources");
    expect(startupErrorsTest).toContain("structured startup errors");
    expect(envTest).toContain("HAAABIT_API_URL");
    expect(registrationTest).toContain("native tool registration");
    expect(docsSmokeTest).toContain("OpenClaw native docs");
    expect(migrationDoc).toContain("older OpenClaw MCP bridge setup");
    expect(migrationDoc).toContain("@haaabit/openclaw-plugin");
  });
});
