import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";

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

    const todaySummary = registerTool.mock.calls.find(([name]) => name === "today_get_summary");
    expect(todaySummary?.[1]).toMatchObject({
      description: expect.stringContaining("today"),
      outputSchema: expect.objectContaining({
        type: "object",
      }),
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

    const habitsList = registerTool.mock.calls.find(([name]) => name === "habits_list");
    const todayComplete = registerTool.mock.calls.find(([name]) => name === "today_complete");

    expect(hasSchemaKey(habitsList?.[1].inputSchema, "default")).toBe(false);
    expect(hasSchemaKey(todayComplete?.[1].inputSchema, "default")).toBe(false);
    expect(hasSchemaKey(todayComplete?.[1].outputSchema, "$schema")).toBe(false);
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

    const habitsList = registerTool.mock.calls.find(([name]) => name === "habits_list");
    const handler = habitsList?.[2] as ((input: unknown) => Promise<Record<string, unknown>>) | undefined;

    await expect(handler?.({})).resolves.toMatchObject({
      ok: true,
      toolName: "habits_list",
      data: {
        items: [],
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
