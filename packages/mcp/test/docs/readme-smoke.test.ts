import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { toolInventory } from "../../src/tools/inventory";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.resolve(__dirname, "../../README.md");
const packageJsonPath = path.resolve(__dirname, "../../package.json");

describe("package README smoke", () => {
  it("documents the published launch path, required env vars, and client examples", async () => {
    const readme = await readFile(readmePath, "utf8");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      name: string;
      bin?: Record<string, string> | string;
    };
    const binPath = typeof packageJson.bin === "string"
      ? packageJson.bin
      : packageJson.bin
        ? Object.values(packageJson.bin)[0]
        : undefined;

    expect(readme).toContain("# @haaabit/mcp");
    expect(readme).toContain("HAAABIT_API_URL");
    expect(readme).toContain("HAAABIT_API_TOKEN");
    expect(readme).toContain("--api-url");
    expect(readme).toContain("--timeout");
    expect(readme).toContain(`npx -y ${packageJson.name}`);
    expect(readme).toContain('"command": "npx"');
    expect(readme).toContain(`"args": ["-y", "${packageJson.name}"]`);
    expect(readme).toContain("Claude Code");
    expect(readme).toContain("MCP Inspector");
    expect(readme).toContain("## AI Guidance");
    expect(readme).toContain("haaabit_assistant_workflow");
    expect(readme).toContain("haaabit://guides/workflow");
    expect(readme).toContain(".agents/skills/haaabit-mcp");
    expect(binPath).toBe("dist/cli.js");
  });

  it("lists every shipped tool with its one-line inventory description", async () => {
    const readme = await readFile(readmePath, "utf8");

    for (const tool of toolInventory) {
      expect(readme).toContain(`| \`${tool.name}\` | \`${tool.method} ${tool.path}\` | ${tool.description} |`);
    }
  });
});
