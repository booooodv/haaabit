import { access, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { formatBootstrapError, formatStartupError } from "../../src/config/env";
import { createServer } from "../../src/server/create-server";
import { isDirectExecution, resolveCliMode, runCli } from "../../src/cli";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../..");
const packageJsonPath = path.resolve(__dirname, "../../package.json");
const builtCliPath = path.resolve(packageRoot, "dist/cli.js");

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
    expect(pkg.files).toEqual(["dist", "examples"]);
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

  it("treats zero arguments as the normal stdio server path and keeps bootstrap as an explicit subcommand", async () => {
    const connectServer = vi.fn(async () => undefined);
    const bootstrapToken = vi.fn(async () => undefined);

    expect(resolveCliMode([])).toBe("server");
    expect(resolveCliMode(["bootstrap-token"])).toBe("bootstrap-token");

    await runCli([], {
      env: {},
      stdin: process.stdin,
      stdout: process.stdout,
      connectServer,
      bootstrapToken,
    });
    await runCli(["bootstrap-token", "--api-url", "https://habit.example.com/api"], {
      env: {},
      stdin: process.stdin,
      stdout: process.stdout,
      connectServer,
      bootstrapToken,
    });

    expect(connectServer).toHaveBeenCalledTimes(1);
    expect(connectServer).toHaveBeenCalledWith([], {});
    expect(bootstrapToken).toHaveBeenCalledTimes(1);
    expect(bootstrapToken).toHaveBeenCalledWith(
      ["--api-url", "https://habit.example.com/api"],
      {},
      process.stdin,
      process.stdout,
    );
  });

  it("treats a symlinked npm bin shim path as direct execution", () => {
    const shimPath = "/tmp/.bin/mcp";
    const resolvePath = vi.fn((target: string) => target === shimPath ? builtCliPath : target);

    expect(isDirectExecution(pathToFileURL(builtCliPath).href, ["node", shimPath], resolvePath)).toBe(true);
    expect(resolvePath).toHaveBeenCalledWith(builtCliPath);
    expect(resolvePath).toHaveBeenCalledWith(shimPath);
  });

  it("does not treat unrelated entrypoints as direct execution", () => {
    const resolvePath = vi.fn((target: string) => target);

    expect(isDirectExecution(pathToFileURL(builtCliPath).href, ["node", "/tmp/other-file.js"], resolvePath)).toBe(false);
  });

  it("keeps the built CLI alive when launched through a symlinked bin path", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "haaabit-mcp-bin-"));
    const shimPath = path.join(tempDir, "mcp");
    await symlink(builtCliPath, shimPath);

    const child = spawn(process.execPath, [shimPath, "--timeout", "15000"], {
      env: {
        ...process.env,
        HAAABIT_API_URL: "https://habit.example.com/api",
        HAAABIT_API_TOKEN: "secret-token",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(child.exitCode).toBeNull();
    } finally {
      child.kill();
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("formats startup and bootstrap errors without leaking token or password values", () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    formatStartupError(new Error("Missing required configuration: HAAABIT_API_TOKEN. Run bootstrap-token before starting the MCP server. token secret-token"), {
      HAAABIT_API_TOKEN: "secret-token",
    });
    formatBootstrapError(new Error("Invalid email or password password123 cookie session=abc123"), {
      env: {
        HAAABIT_BOOTSTRAP_PASSWORD: "password123",
      },
      secrets: ["abc123"],
    });

    expect(stderr.mock.calls.join(" ")).not.toContain("secret-token");
    expect(stderr.mock.calls.join(" ")).not.toContain("password123");
    expect(stderr.mock.calls.join(" ")).not.toContain("abc123");
    expect(stderr.mock.calls.join(" ")).toContain("bootstrap-token");

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
