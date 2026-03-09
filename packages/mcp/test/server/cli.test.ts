import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { createServer } from "../../src/server/create-server";
import { formatStartupError } from "../../src/config/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../..");
const packageJsonPath = path.resolve(__dirname, "../../package.json");

describe("mcp package bootstrap", () => {
  it("publishes a bin entry that matches the built artifact", async () => {
    const contents = await readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(contents) as { bin?: Record<string, string> | string };
    const binPath = typeof pkg.bin === "string"
      ? pkg.bin
      : pkg.bin
        ? Object.values(pkg.bin)[0]
        : undefined;

    expect(binPath).toBe("dist/cli.js");
    await expect(access(path.resolve(packageRoot, binPath!))).resolves.toBeUndefined();
  });

  it("ships public package metadata for npm publication", async () => {
    const contents = await readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(contents) as {
      private?: boolean;
      description?: string;
      repository?: { type?: string; url?: string; directory?: string };
      homepage?: string;
      bugs?: { url?: string };
      keywords?: string[];
      engines?: { node?: string };
      publishConfig?: { access?: string };
      exports?: Record<string, string> | string;
      files?: string[];
    };

    expect(pkg.private).toBe(false);
    expect(pkg.description).toBeTruthy();
    expect(pkg.repository).toEqual({
      type: "git",
      url: "git+https://github.com/booooodv/haaabit.git",
      directory: "packages/mcp",
    });
    expect(pkg.homepage).toBe("https://github.com/booooodv/haaabit/tree/main/packages/mcp");
    expect(pkg.bugs).toEqual({
      url: "https://github.com/booooodv/haaabit/issues",
    });
    expect(pkg.keywords).toEqual(
      expect.arrayContaining(["mcp", "model-context-protocol", "haaabit", "habits"]),
    );
    expect(pkg.engines).toEqual({
      node: ">=20",
    });
    expect(pkg.publishConfig).toEqual({
      access: "public",
    });
    expect(pkg.exports).toEqual({
      ".": "./dist/index.js",
    });
    expect(pkg.files).toEqual(["dist"]);
  });

  it("creates a stdio-ready server with package metadata", async () => {
    const pkg = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      name: string;
      version: string;
    };
    const server = createServer({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
    });

    expect(server.server).toBeDefined();
    expect(server.metadata).toEqual({
      name: pkg.name,
      version: pkg.version,
    });
  });

  it("formats startup errors without leaking token values", () => {
    const error = new Error("Missing required configuration: HAAABIT_API_TOKEN");
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    formatStartupError(error, {
      HAAABIT_API_TOKEN: "super-secret-token",
    });

    expect(stderr).toHaveBeenCalledWith("Failed to start Haaabit MCP server: Missing required configuration: HAAABIT_API_TOKEN");
    expect(stderr.mock.calls.join(" ")).not.toContain("super-secret-token");

    stderr.mockRestore();
  });

  it("exposes a metadata entry path for later stdio integration tests", () => {
    const server = createServer({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
    });

    expect(server.listRegisteredTools().length).toBeGreaterThan(0);
  });
});
