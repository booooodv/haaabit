import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";
import { createNativeHandlers } from "../src/native-handlers";

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

  it("registers provider-safe JSON Schemas that describe the native success envelope", () => {
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
    expect(habitsList?.[1].outputSchema).toBeDefined();

    expect(habitsList?.[1].outputSchema).toMatchObject({
      type: "object",
      required: ["ok", "toolName", "summary", "data"],
      additionalProperties: false,
      properties: expect.objectContaining({
        ok: expect.objectContaining({
          const: true,
        }),
        toolName: expect.objectContaining({
          type: "string",
        }),
        summary: expect.objectContaining({
          type: "string",
        }),
        data: expect.objectContaining({
          type: "object",
        }),
      }),
    });
    expect(hasSchemaKey(habitsList?.[1].outputSchema, "default")).toBe(false);
    expect(hasSchemaKey(habitsList?.[1].outputSchema, "$schema")).toBe(false);
  });
});
