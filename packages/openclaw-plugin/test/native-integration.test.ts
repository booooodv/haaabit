import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin, EXPECTED_TOOL_NAMES } from "../src/index";
import type { OpenClawToolHandler } from "../src/types";

const packageRoot = path.resolve(import.meta.dirname, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");

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

describe("native plugin integration", () => {
  const cleanups: Array<() => Promise<void>> = [];
  const closers: Array<() => Promise<void>> = [];
  let apiUrl = "";
  let apiToken = "";
  let booleanHabitId = "";

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

    if (booleanHabitResponse.statusCode !== 201) {
      throw new Error(`Unable to create native integration fixture: ${booleanHabitResponse.statusCode}`);
    }

    booleanHabitId = (booleanHabitResponse.json() as { item: { id: string } }).item.id;
    apiUrl = `${address}/api`;
    closers.push(() => context.app.close());
    cleanups.push(context.cleanup);
  });

  afterEach(async () => {
    await Promise.allSettled(closers.map((close) => close()));
    await Promise.allSettled(cleanups.map((cleanup) => cleanup()));
    closers.length = 0;
    cleanups.length = 0;
  });

  it("proves one native read flow and one safe mutation flow against the real API app", async () => {
    const registerTool = vi.fn();

    const activation = activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: apiUrl,
          HAAABIT_API_TOKEN: apiToken,
        },
      },
    );

    expect(activation.registeredTools).toEqual(EXPECTED_TOOL_NAMES);

    const handlers = Object.fromEntries(
      registerTool.mock.calls.map(([name, _registration, handler]) => [name as string, handler as OpenClawToolHandler]),
    ) as Record<string, OpenClawToolHandler>;

    const initialToday = await handlers.today_get_summary?.({});

    expect(initialToday).toMatchObject({
      ok: true,
      toolName: "today_get_summary",
      data: {
        today: {
          pendingItems: [
            expect.objectContaining({
              habitId: booleanHabitId,
              name: "Walk",
              status: "pending",
            }),
          ],
        },
      },
    });

    const completion = await handlers.today_complete?.({
      habitId: booleanHabitId,
      source: "ai",
    });

    expect(completion).toMatchObject({
      ok: true,
      toolName: "today_complete",
      data: {
        habit: {
          id: booleanHabitId,
          name: "Walk",
        },
        today: {
          completedCount: expect.any(Number),
        },
      },
    });

    const refreshedToday = await handlers.today_get_summary?.({});

    expect(refreshedToday).toMatchObject({
      ok: true,
      toolName: "today_get_summary",
      data: {
        today: {
          completedItems: [
            expect.objectContaining({
              habitId: booleanHabitId,
              name: "Walk",
              status: "completed",
            }),
          ],
        },
      },
    });
  });
});
