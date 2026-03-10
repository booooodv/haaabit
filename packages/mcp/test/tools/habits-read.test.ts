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

describe("habits read tools", () => {
  it("calls /habits with the default active filter and returns a balanced summary", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        items: [
          {
            id: "habit_1",
            userId: "user_1",
            name: "Deep Work",
            kind: "quantity",
            description: null,
            category: "focus",
            targetValue: 4,
            unit: "blocks",
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-01T08:00:00.000Z",
          },
          {
            id: "habit_2",
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
        ],
      }),
    );
    const tool = getRegisteredTool("habits_list", fetchImpl);

    const result = await tool.handler({});

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://habit.example.com/api/habits?status=active",
      expect.objectContaining({
        headers: {
          authorization: "Bearer secret-token",
        },
      }),
    );
    expect(result).toMatchObject({
      structuredContent: {
        items: [
          expect.objectContaining({ name: "Deep Work" }),
          expect.objectContaining({ name: "Read" }),
        ],
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("default active filter"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      items: [expect.objectContaining({ name: "Deep Work" }), expect.objectContaining({ name: "Read" })],
    });
    expect(JSON.stringify(result)).toContain("Deep Work");
    expect(JSON.stringify(result)).toContain("Read");
  });

  it("encodes explicit habits_list filters without default-filter copy", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        items: [],
      }),
    );
    const tool = getRegisteredTool("habits_list", fetchImpl);

    const result = await tool.handler({
      status: "archived",
      category: "focus",
      kind: "quantity",
      query: "deep",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://habit.example.com/api/habits?status=archived&query=deep&category=focus&kind=quantity",
    );
    expect(result).toMatchObject({
      structuredContent: {
        items: [],
      },
    });
    expect(JSON.stringify(result)).not.toContain("default active filter");
  });

  it("calls /habits/:habitId and summarizes whether the habit needs attention today", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        item: {
          habit: {
            id: "habit_1",
            userId: "user_1",
            name: "Deep Work",
            kind: "quantity",
            description: null,
            category: "focus",
            targetValue: 4,
            unit: "blocks",
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-05T08:00:00.000Z",
          },
          stats: {
            currentStreak: 2,
            longestStreak: 5,
            totalCompletions: 12,
            interruptionCount: 1,
          },
          recentHistory: [],
          trends: {
            last7Days: [
              { date: "2026-03-05", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-06", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-07", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-08", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-09", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-10", status: "completed", completionRate: 1, completedCount: 1, completionTarget: 1, value: 4, valueTarget: 4 },
              { date: "2026-03-11", status: "pending", completionRate: null, completedCount: 0, completionTarget: 1, value: 0, valueTarget: 4 },
            ],
            last30Days: Array.from({ length: 30 }, (_, index) => ({
              date: `2026-02-${String(index + 1).padStart(2, "0")}`,
              status: "completed",
              completionRate: 1,
              completedCount: 1,
              completionTarget: 1,
              value: 4,
              valueTarget: 4,
            })),
          },
        },
      }),
    );
    const tool = getRegisteredTool("habits_get_detail", fetchImpl);

    const result = await tool.handler({
      habitId: "habit_1",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits/habit_1");
    expect(result).toMatchObject({
      structuredContent: {
        item: {
          habit: {
            id: "habit_1",
            name: "Deep Work",
          },
        },
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("needs attention today"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      item: {
        habit: {
          id: "habit_1",
          name: "Deep Work",
        },
      },
    });
  });
});
