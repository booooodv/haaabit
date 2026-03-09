import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const packageJsonPath = path.resolve(packageRoot, "package.json");

async function resolveBuiltCliPath() {
  const contents = await readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(contents) as { bin?: Record<string, string> | string };
  const relativeCliPath = typeof pkg.bin === "string"
    ? pkg.bin
    : pkg.bin
      ? Object.values(pkg.bin)[0]
      : undefined;

  if (!relativeCliPath) {
    throw new Error("packages/mcp/package.json is missing a bin entry");
  }

  return path.resolve(packageRoot, relativeCliPath);
}

describe("stdio integration", () => {
  const clients: Client[] = [];
  const transports: StdioClientTransport[] = [];

  afterEach(async () => {
    await Promise.allSettled(clients.map((client) => client.close()));
    await Promise.allSettled(transports.map((transport) => transport.close()));
    clients.length = 0;
    transports.length = 0;
  });

  it("lets a stdio client discover the planned tool catalog", async () => {
    const cliPath = await resolveBuiltCliPath();
    const client = new Client({
      name: "haaabit-test-client",
      version: "0.1.0",
    });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliPath],
      cwd: workspaceRoot,
      stderr: "pipe",
      env: {
        HAAABIT_API_URL: "https://habit.example.com/api",
        HAAABIT_API_TOKEN: "secret-token",
      },
    });
    const stderrChunks: string[] = [];

    clients.push(client);
    transports.push(transport);
    transport.stderr?.on("data", (chunk) => {
      stderrChunks.push(String(chunk));
    });

    await client.connect(transport);

    const tools = await client.listTools();

    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "habits_list",
      "habits_add",
      "habits_get_detail",
      "habits_edit",
      "habits_archive",
      "habits_restore",
      "today_get_summary",
      "today_complete",
      "today_set_total",
      "today_undo",
      "stats_get_overview",
    ]);
    expect(stderrChunks.join("")).not.toContain("secret-token");
  });
});
