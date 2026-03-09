import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const packageRoot = path.resolve(import.meta.dirname, "../..");
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

async function loadApiTestHelpers() {
  const helpersPath = pathToFileURL(path.resolve(workspaceRoot, "apps/api/test/helpers/app.ts")).href;

  return import(helpersPath) as Promise<{
    createTestContext: () => Promise<{
      app: {
        inject: (options: {
          method: string;
          url: string;
          headers?: Record<string, string>;
          payload?: unknown;
        }) => Promise<{
          statusCode?: number;
          json: () => unknown;
        }>;
        listen: (options: { port: number; host: string }) => Promise<string>;
        close: () => Promise<void>;
      };
      cleanup: () => Promise<void>;
    }>;
    signUp: (app: unknown) => Promise<{
      cookie: string;
      body: {
        user: { id: string };
      };
    }>;
  }>;
}

async function issueApiToken(app: unknown, cookie: string) {
  const injectable = app as {
    inject: (options: {
      method: string;
      url: string;
      headers?: Record<string, string>;
    }) => Promise<{
      statusCode?: number;
      json: () => unknown;
    }>;
  };
  const response = await injectable.inject({
    method: "POST",
    url: "/api/api-access/token/reset",
    headers: {
      cookie,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(`Unable to issue api token: ${response.statusCode}`);
  }

  return (response.json() as { token: string }).token;
}

describe("stdio mutation integration", () => {
  const clients: Client[] = [];
  const transports: StdioClientTransport[] = [];
  const cleanups: Array<() => Promise<void>> = [];
  const closers: Array<() => Promise<void>> = [];
  let apiUrl = "";
  let apiToken = "";
  let booleanHabitId = "";
  let quantityHabitId = "";

  beforeEach(async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    const context = await createTestContext();
    const address = await context.app.listen({
      port: 0,
      host: "127.0.0.1",
    });
    const { cookie } = await signUp(context.app);

    apiToken = await issueApiToken(context.app, cookie);

    const booleanHabitResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
      payload: {
        name: "Walk",
        kind: "boolean",
        category: "health",
        frequency: {
          type: "daily",
        },
      },
    });
    const quantityHabitResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
      payload: {
        name: "Read",
        kind: "quantity",
        targetValue: 10,
        unit: "pages",
        category: "learning",
        frequency: {
          type: "daily",
        },
      },
    });

    if (booleanHabitResponse.statusCode !== 201 || quantityHabitResponse.statusCode !== 201) {
      throw new Error("Unable to create mutation fixtures");
    }

    booleanHabitId = (booleanHabitResponse.json() as { item: { id: string } }).item.id;
    quantityHabitId = (quantityHabitResponse.json() as { item: { id: string } }).item.id;
    apiUrl = `${address}/api`;
    closers.push(() => context.app.close());
    cleanups.push(context.cleanup);
  });

  afterEach(async () => {
    await Promise.allSettled(clients.map((client) => client.close()));
    await Promise.allSettled(transports.map((transport) => transport.close()));
    await Promise.allSettled(closers.map((close) => close()));
    await Promise.allSettled(cleanups.map((cleanup) => cleanup()));
    clients.length = 0;
    transports.length = 0;
    closers.length = 0;
    cleanups.length = 0;
  });

  it("lets a stdio client call built mutation tools against a real API", async () => {
    const cliPath = await resolveBuiltCliPath();
    const client = new Client({
      name: "haaabit-mutation-test-client",
      version: "0.1.0",
    });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliPath],
      cwd: workspaceRoot,
      stderr: "pipe",
      env: {
        HAAABIT_API_URL: apiUrl,
        HAAABIT_API_TOKEN: apiToken,
      },
    });

    clients.push(client);
    transports.push(transport);

    await client.connect(transport);

    const habitsAdd = await client.callTool({
      name: "habits_add",
      arguments: {
        name: "Stretch",
        kind: "quantity",
        targetValue: 15,
        unit: "mins",
        category: "health",
        frequency: {
          type: "daily",
        },
      },
    });
    const addedHabitId = (habitsAdd.structuredContent as { item: { id: string } }).item.id;
    const habitsEdit = await client.callTool({
      name: "habits_edit",
      arguments: {
        habitId: addedHabitId,
        name: "Stretch PM",
        targetValue: 20,
      },
    });
    const habitsArchive = await client.callTool({
      name: "habits_archive",
      arguments: {
        habitId: addedHabitId,
      },
    });
    const habitsRestore = await client.callTool({
      name: "habits_restore",
      arguments: {
        habitId: addedHabitId,
      },
    });
    const todayComplete = await client.callTool({
      name: "today_complete",
      arguments: {
        habitId: booleanHabitId,
        source: "ai",
      },
    });
    const todaySetTotal = await client.callTool({
      name: "today_set_total",
      arguments: {
        habitId: quantityHabitId,
        total: 10,
        source: "ai",
      },
    });
    const todayUndo = await client.callTool({
      name: "today_undo",
      arguments: {
        habitId: quantityHabitId,
        source: "ai",
      },
    });
    await client.callTool({
      name: "habits_archive",
      arguments: {
        habitId: quantityHabitId,
      },
    });
    const archivedTodaySetTotal = await client.callTool({
      name: "today_set_total",
      arguments: {
        habitId: quantityHabitId,
        total: 4,
        source: "ai",
      },
    });

    expect(habitsAdd.structuredContent).toMatchObject({
      item: {
        id: addedHabitId,
        name: "Stretch",
      },
    });
    expect(JSON.stringify(habitsAdd.content)).toContain("Created Stretch");
    expect(habitsEdit.structuredContent).toMatchObject({
      item: {
        id: addedHabitId,
        name: "Stretch PM",
        targetValue: 20,
      },
    });
    expect(JSON.stringify(habitsArchive.content)).toContain("read-only");
    expect(JSON.stringify(habitsRestore.content)).toContain("usable again");
    expect(todayComplete.structuredContent).toMatchObject({
      habit: {
        id: booleanHabitId,
        name: "Walk",
      },
      today: {
        completedCount: expect.any(Number),
      },
    });
    expect(todaySetTotal.structuredContent).toMatchObject({
      habit: {
        id: quantityHabitId,
        name: "Read",
      },
      today: {
        completedCount: expect.any(Number),
      },
    });
    expect(JSON.stringify(todaySetTotal.content)).toContain("10/10 pages");
    expect(JSON.stringify(todayUndo.content)).toContain("Undid today's set total for Read");
    expect(archivedTodaySetTotal).toMatchObject({
      isError: true,
      structuredContent: {
        category: "conflict",
        hint: expect.stringContaining("habits_restore"),
      },
    });
  });
});
