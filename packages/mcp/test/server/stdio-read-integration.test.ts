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
          headers?: Record<string, string | string[] | undefined>;
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

async function issueApiToken(
  app: unknown,
  cookie: string,
) {
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

describe("stdio read integration", () => {
  const clients: Client[] = [];
  const transports: StdioClientTransport[] = [];
  const cleanups: Array<() => Promise<void>> = [];
  const closers: Array<() => Promise<void>> = [];
  let apiUrl = "";
  let apiToken = "";
  let habitId = "";

  beforeEach(async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    const context = await createTestContext();
    const address = await context.app.listen({
      port: 0,
      host: "127.0.0.1",
    });
    const { cookie } = await signUp(context.app);

    apiToken = await issueApiToken(context.app, cookie);

    const createHabitResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
      payload: {
        name: "Deep Work",
        kind: "quantity",
        targetValue: 4,
        unit: "blocks",
        category: "focus",
        frequency: {
          type: "daily",
        },
      },
    });

    if (createHabitResponse.statusCode !== 201) {
      throw new Error(`Unable to create habit fixture: ${createHabitResponse.statusCode}`);
    }

    habitId = (createHabitResponse.json() as { item: { id: string } }).item.id;
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

  it("lets a stdio client call the built read tools against a real API", async () => {
    const cliPath = await resolveBuiltCliPath();
    const client = new Client({
      name: "haaabit-read-test-client",
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

    const habitsList = await client.callTool({
      name: "habits_list",
      arguments: {},
    });
    const habitDetail = await client.callTool({
      name: "habits_get_detail",
      arguments: {
        habitId,
      },
    });
    const todaySummary = await client.callTool({
      name: "today_get_summary",
      arguments: {},
    });
    const statsOverview = await client.callTool({
      name: "stats_get_overview",
      arguments: {},
    });

    expect(habitsList.structuredContent).toMatchObject({
      items: [
        expect.objectContaining({
          id: habitId,
          name: "Deep Work",
        }),
      ],
      _haaabit_json: expect.any(String),
    });
    expect(habitDetail.structuredContent).toMatchObject({
      item: {
        habit: {
          id: habitId,
          name: "Deep Work",
        },
      },
    });
    expect(todaySummary.structuredContent).toMatchObject({
      today: {
        totalCount: expect.any(Number),
      },
    });
    expect(statsOverview.structuredContent).toMatchObject({
      stats: {
        metrics: {
          activeHabitCount: expect.any(Number),
        },
      },
    });
    const habitsListJson = JSON.parse((habitsList.structuredContent as { _haaabit_json: string })._haaabit_json) as {
      items: Array<{ name: string; targetValue: number; unit: string | null }>;
    };
    const habitDetailJson = JSON.parse((habitDetail.structuredContent as { _haaabit_json: string })._haaabit_json) as {
      item: {
        habit: {
          targetValue: number;
          unit: string | null;
        };
      };
    };
    const todaySummaryJson = JSON.parse((todaySummary.structuredContent as { _haaabit_json: string })._haaabit_json) as {
      today: {
        pendingItems: Array<{ progress: { unit: string | null; targetValue: number | null } }>;
      };
    };

    expect(habitsList.content?.[1]).toEqual({
      type: "text",
      text: JSON.stringify(habitsListJson),
    });
    expect(habitDetail.content?.[1]).toEqual({
      type: "text",
      text: JSON.stringify(habitDetailJson),
    });
    expect(todaySummary.content?.[1]).toEqual({
      type: "text",
      text: JSON.stringify(todaySummaryJson),
    });
    expect(habitsListJson.items[0]?.unit).toBe("blocks");
    expect(habitsListJson.items[0]?.targetValue).toBe(4);
    expect(habitDetailJson.item.habit.unit).toBe("blocks");
    expect(habitDetailJson.item.habit.targetValue).toBe(4);
    expect(todaySummaryJson.today.pendingItems[0]?.progress.unit).toBe("blocks");
    expect(todaySummaryJson.today.pendingItems[0]?.progress.targetValue).toBe(4);
    expect(JSON.stringify(habitsList.content)).toContain("default active filter");
    expect(JSON.stringify(todaySummary.content)).toContain("today");
    expect(JSON.stringify(statsOverview.content)).toContain("active habits");
  });
});
