import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";
import { createNativeHandlers } from "../src/native-handlers";
import type { OpenClawRegisteredTool } from "../src/types";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("native success envelope", () => {
  it("uses one stable machine-readable success shape for native handlers", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          items: [],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          item: {
            id: "habit_read",
            userId: "user_1",
            name: "Read",
            kind: "quantity",
            description: null,
            category: "learning",
            targetValue: 30,
            unit: "pages",
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-01T08:00:00.000Z",
          },
        }),
      );
    const handlers = createNativeHandlers(
      {
        apiUrl: "https://habit.example.com/api",
        apiToken: "secret-token",
        timeoutMs: 2500,
      },
      {
        fetch: fetchImpl,
      },
    );

    await expect(handlers.habits_list?.({})).resolves.toEqual({
      ok: true,
      toolName: "habits_list",
      summary: "No habits matched the default active filter.",
      data: {
        items: [],
      },
    });
    await expect(
      handlers.habits_add?.({
        name: "Read",
        kind: "quantity",
        targetValue: 30,
        unit: "pages",
        frequency: {
          type: "daily",
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      toolName: "habits_add",
      summary: expect.stringContaining("Created Read"),
      data: {
        item: {
          id: "habit_read",
        },
      },
    });
  });

  it("wraps native handler results into OpenClaw content/details execution results", async () => {
    const registerTool = vi.fn();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        items: [],
      }),
    );

    activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
        fetch: fetchImpl,
      },
    );

    const habitsList = registerTool.mock.calls.find(([tool]) => (tool as OpenClawRegisteredTool).name === "habits_list")?.[0] as
      | OpenClawRegisteredTool
      | undefined;

    await expect(habitsList?.execute({})).resolves.toMatchObject({
      content: [{ type: "text", text: "No habits matched the default active filter." }],
      details: {
        ok: true,
        toolName: "habits_list",
        summary: "No habits matched the default active filter.",
        data: {
          items: [],
        },
      },
    });
  });
});
