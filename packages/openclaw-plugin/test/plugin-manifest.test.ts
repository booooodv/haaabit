import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const packageRoot = new URL("../", import.meta.url);

async function readJson(path: string) {
  const content = await readFile(new URL(path, packageRoot), "utf8");

  return JSON.parse(content) as Record<string, unknown>;
}

describe("openclaw plugin manifest", () => {
  it("ships a first-class native plugin package", async () => {
    const pkg = await readJson("package.json");

    expect(pkg.name).toBe("@haaabit/openclaw-plugin");
    expect(pkg.type).toBe("module");
    expect(pkg.exports).toMatchObject({
      ".": "./dist/index.js",
    });
    expect(pkg.files).toEqual(expect.arrayContaining(["dist", "openclaw.plugin.json"]));
    expect(pkg.openclaw).toMatchObject({
      extensions: ["./dist/index.js"],
    });
  });

  it("ships a native OpenClaw manifest that points at the built entrypoint", async () => {
    const manifest = await readJson("openclaw.plugin.json");

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      id: "@haaabit/openclaw-plugin",
      name: "Haaabit",
      entry: "./dist/index.js",
      configSchema: {},
    });
    expect(String(manifest.description)).toContain("Haaabit");
  });
});
