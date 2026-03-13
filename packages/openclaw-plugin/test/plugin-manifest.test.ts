import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const packageRoot = new URL("../", import.meta.url);
const packageRootPath = new URL("../", import.meta.url);

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

  it("builds a standalone dist entry that loads without a local zod install", async () => {
    execFileSync("pnpm", ["build"], {
      cwd: packageRootPath,
      stdio: "pipe",
    });

    const distSource = await readFile(new URL("dist/index.js", packageRoot), "utf8");

    expect(distSource).not.toMatch(/from\s+["']zod["']/);
    expect(distSource).not.toMatch(/import\s+["']zod["']/);
    expect(distSource).not.toMatch(/require\(["']zod["']\)/);

    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "haaabit-openclaw-plugin-"));
    const tempDistDir = path.join(tempRoot, "dist");

    await mkdir(tempDistDir, { recursive: true });
    await writeFile(path.join(tempRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(path.join(tempDistDir, "index.js"), distSource, "utf8");

    await expect(import(pathToFileURL(path.join(tempDistDir, "index.js")).href)).resolves.toMatchObject({
      default: expect.any(Function),
      register: expect.any(Function),
      activate: expect.any(Function),
      activateHaaabitOpenClawPlugin: expect.any(Function),
    });
  });
});
