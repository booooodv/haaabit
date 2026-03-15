import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";
import type { OpenClawRegisteredTool } from "../src/types";

function hasSchemaKey(value: unknown, targetKey: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasSchemaKey(item, targetKey));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => key === targetKey || hasSchemaKey(nestedValue, targetKey));
  }

  return false;
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("native tool registration", () => {
  it("registers descriptions and schemas for the Haaabit tool catalog", () => {
    const registerTool = vi.fn();

    activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    const todaySummary = findRegisteredTool(registerTool, "today_get_summary");
    expect(todaySummary).toMatchObject({
      description: expect.stringContaining("today"),
      execute: expect.any(Function),
    });
  });

  it("removes provider-incompatible defaults from registered tool schemas", () => {
    const registerTool = vi.fn();

    activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    const habitsList = findRegisteredTool(registerTool, "habits_list");
    const habitsEdit = findRegisteredTool(registerTool, "habits_edit");
    const todayComplete = findRegisteredTool(registerTool, "today_complete");

    expect(hasSchemaKey(habitsList?.parameters, "default")).toBe(false);
    expect(habitsEdit?.parameters).toMatchObject({
      type: "object",
      required: ["habitId"],
      properties: expect.objectContaining({
        habitId: expect.objectContaining({
          type: "string",
        }),
      }),
    });
    expect(hasSchemaKey(habitsEdit?.parameters, "allOf")).toBe(false);
    expect(hasSchemaKey(todayComplete?.parameters, "default")).toBe(false);
  });

  it("uses shared-runtime-backed native handlers by default", async () => {
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

    const habitsList = findRegisteredTool(registerTool, "habits_list");

    await expect(habitsList?.execute({})).resolves.toMatchObject({
      content: [{ type: "text", text: "No habits matched the default active filter." }],
      details: {
        ok: true,
        toolName: "habits_list",
        data: {
          items: [],
        },
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://habit.example.com/api/habits?status=active",
      expect.objectContaining({
        headers: {
          authorization: "Bearer secret-token",
        },
      }),
    );
  });
});

function findRegisteredTool(registerTool: ReturnType<typeof vi.fn>, name: string) {
  return registerTool.mock.calls.find(([tool]) => (tool as OpenClawRegisteredTool).name === name)?.[0] as
    | OpenClawRegisteredTool
    | undefined;
}
