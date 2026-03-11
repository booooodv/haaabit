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

describe("OpenClaw native docs", () => {
  it("ships a package-local README and native setup asset", async () => {
    const pkg = JSON.parse(await readPackageFile("package.json")) as {
      files: string[];
    };
    const readme = await readPackageFile("README.md");
    const example = await readPackageFile("examples/openclaw-plugin.jsonc");

    expect(pkg.files).toEqual(expect.arrayContaining(["README.md", "examples"]));
    expect(readme).toContain("native OpenClaw integration");
    expect(readme).toContain("ok\": true");
    expect(readme).toContain("error.category");
    expect(example).toContain("\"package\": \"@haaabit/openclaw-plugin\"");
    expect(example).not.toContain("\"mcpServers\"");
  });

  it("routes top-level OpenClaw guidance to the native plugin first", async () => {
    const rootPackageJson = JSON.parse(await readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const readme = await readRepoFile("README.md");
    const integration = await readRepoFile("docs/ai-agent-integration.md");
    const checklist = await readRepoFile("docs/openclaw-validation-checklist.md");
    const troubleshooting = await readRepoFile("docs/openclaw-troubleshooting.md");
    const migration = await readRepoFile("docs/openclaw-migration.md");

    expect(readme).toContain("packages/openclaw-plugin/examples/openclaw-plugin.jsonc");
    expect(readme).toContain("@haaabit/openclaw-plugin");
    expect(integration).toContain("OpenClaw native plugin");
    expect(integration).toContain("packages/openclaw-plugin/examples/openclaw-plugin.jsonc");
    expect(integration).toContain("@haaabit/mcp");
    expect(checklist).toContain("packages/openclaw-plugin/examples/openclaw-plugin.jsonc");
    expect(checklist).toContain("native plugin");
    expect(checklist).toContain("verification gate");
    expect(checklist).toContain("openclaw-migration.md");
    expect(troubleshooting).toContain("packages/openclaw-plugin/examples/openclaw-plugin.jsonc");
    expect(troubleshooting).toContain("wrong_kind");
    expect(troubleshooting).toContain("openclaw-migration.md");
    expect(migration).toContain("What stays the same");
    expect(migration).toContain("What changes");
    expect(rootPackageJson.scripts?.["verify:openclaw"]).toContain("@haaabit/openclaw-plugin");
  });
});
