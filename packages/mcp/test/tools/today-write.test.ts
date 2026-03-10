import { describe, expect, it, vi } from "vitest";

import { createServer } from "../../src/server/create-server";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function getRegisteredTool(name: string, fetchImpl: typeof fetch) {
  const server = createServer({
    apiUrl: "https://habit.example.com/api",
    apiToken: "secret-token",
    timeoutMs: 2500,
    fetch: fetchImpl,
  });
  const tool = server.listRegisteredTools().find((entry) => entry.name === name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  return tool;
}

describe("today write tools", () => {
  it("completes a boolean habit and lists the refreshed pending names", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        affectedHabit: {
          id: "habit_walk",
          userId: "user_1",
          name: "Walk",
          kind: "boolean",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
        summary: {
          date: "2026-03-11",
          totalCount: 3,
          pendingCount: 1,
          completedCount: 2,
          completionRate: 0.67,
          pendingItems: [
            {
              habitId: "habit_read",
              name: "Read",
              kind: "quantity",
              frequencyType: "daily",
              status: "pending",
              canUndo: false,
              date: "2026-03-11",
              progress: {
                currentValue: 10,
                targetValue: 30,
                unit: "pages",
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
          completedItems: [
            {
              habitId: "habit_walk",
              name: "Walk",
              kind: "boolean",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: null,
                targetValue: null,
                unit: null,
                periodCompletions: null,
                periodTarget: null,
              },
            },
            {
              habitId: "habit_focus",
              name: "Deep Work",
              kind: "quantity",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: 4,
                targetValue: 4,
                unit: "blocks",
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
        },
      }),
    );
    const tool = getRegisteredTool("today_complete", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_walk",
      source: "ai",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/today/complete");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer secret-token",
        "content-type": "application/json",
      },
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      habitId: "habit_walk",
      source: "ai",
    });
    expect(result).toMatchObject({
      structuredContent: {
        habit: {
          id: "habit_walk",
          name: "Walk",
        },
        today: {
          pendingCount: 1,
        },
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("Completed Walk"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      habit: { id: "habit_walk", name: "Walk" },
      today: { pendingCount: 1 },
    });
    expect(JSON.stringify(result)).toContain("Read");
  });

  it("sets today's total and shows current versus target progress", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        affectedHabit: {
          id: "habit_read",
          userId: "user_1",
          name: "Read",
          kind: "quantity",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: 10,
          unit: "pages",
          startDate: "2026-03-01",
          weekdays: [],
        },
        summary: {
          date: "2026-03-11",
          totalCount: 2,
          pendingCount: 0,
          completedCount: 2,
          completionRate: 1,
          pendingItems: [],
          completedItems: [
            {
              habitId: "habit_read",
              name: "Read",
              kind: "quantity",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: 10,
                targetValue: 10,
                unit: "pages",
                periodCompletions: null,
                periodTarget: null,
              },
            },
            {
              habitId: "habit_walk",
              name: "Walk",
              kind: "boolean",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: null,
                targetValue: null,
                unit: null,
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
        },
      }),
    );
    const tool = getRegisteredTool("today_set_total", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_read",
      total: 10,
      source: "ai",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/today/set-total");
    expect(result).toMatchObject({
      structuredContent: {
        habit: {
          id: "habit_read",
          name: "Read",
        },
        today: {
          completedCount: 2,
        },
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("10/10 pages"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      habit: { id: "habit_read", name: "Read" },
      today: { completedCount: 2 },
    });
    expect(JSON.stringify(result)).toContain("No habits are pending now");
  });

  it("undoes today's latest action and names the undone action type", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        affectedHabit: {
          id: "habit_read",
          userId: "user_1",
          name: "Read",
          kind: "quantity",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: 10,
          unit: "pages",
          startDate: "2026-03-01",
          weekdays: [],
        },
        summary: {
          date: "2026-03-11",
          totalCount: 2,
          pendingCount: 1,
          completedCount: 1,
          completionRate: 0.5,
          pendingItems: [
            {
              habitId: "habit_read",
              name: "Read",
              kind: "quantity",
              frequencyType: "daily",
              status: "pending",
              canUndo: false,
              date: "2026-03-11",
              progress: {
                currentValue: 0,
                targetValue: 10,
                unit: "pages",
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
          completedItems: [
            {
              habitId: "habit_walk",
              name: "Walk",
              kind: "boolean",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: null,
                targetValue: null,
                unit: null,
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
        },
      }),
    );
    const tool = getRegisteredTool("today_undo", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_read",
      source: "ai",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/today/undo");
    expect(result).toMatchObject({
      structuredContent: {
        habit: {
          id: "habit_read",
          name: "Read",
        },
        today: {
          pendingCount: 1,
        },
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("Undid today's set total for Read"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      habit: { id: "habit_read", name: "Read" },
      today: { pendingCount: 1 },
    });
    expect(JSON.stringify(result)).toContain("Pending: Read");
  });
});
