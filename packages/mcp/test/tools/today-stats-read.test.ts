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

describe("today and stats read tools", () => {
  it("calls /today and adapts the summary into { today: ... } with action-first text", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        summary: {
          date: "2026-03-11",
          totalCount: 3,
          pendingCount: 2,
          completedCount: 1,
          completionRate: 0.33,
          pendingItems: [
            {
              habitId: "habit_1",
              name: "Deep Work",
              kind: "quantity",
              frequencyType: "daily",
              status: "pending",
              canUndo: false,
              date: "2026-03-11",
              progress: {
                currentValue: 1,
                targetValue: 4,
                unit: "blocks",
                periodCompletions: null,
                periodTarget: null,
              },
            },
            {
              habitId: "habit_2",
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
              habitId: "habit_3",
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
    const tool = getRegisteredTool("today_get_summary", fetchImpl);

    const result = await tool.handler({});

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/today");
    expect(result).toMatchObject({
      structuredContent: {
        today: {
          date: "2026-03-11",
          pendingCount: 2,
        },
      },
    });
    expect(JSON.stringify(result)).toContain("Deep Work");
    expect(JSON.stringify(result)).toContain("Read");
  });

  it("uses restrained positive wording when the day is fully complete", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        summary: {
          date: "2026-03-11",
          totalCount: 2,
          pendingCount: 0,
          completedCount: 2,
          completionRate: 1,
          pendingItems: [],
          completedItems: [
            {
              habitId: "habit_1",
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
            {
              habitId: "habit_2",
              name: "Read",
              kind: "quantity",
              frequencyType: "daily",
              status: "completed",
              canUndo: true,
              date: "2026-03-11",
              progress: {
                currentValue: 30,
                targetValue: 30,
                unit: "pages",
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
        },
      }),
    );
    const tool = getRegisteredTool("today_get_summary", fetchImpl);

    const result = await tool.handler({});

    expect(result).toMatchObject({
      structuredContent: {
        today: {
          completedCount: 2,
        },
      },
    });
  });

  it("calls /stats/overview and summarizes broad completion drift", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        overview: {
          date: "2026-03-11",
          metrics: {
            todayCompletedCount: 1,
            todayCompletionRate: 0.33,
            weeklyCompletionRate: 0.71,
            activeHabitCount: 3,
          },
          trends: {
            last7Days: Array.from({ length: 7 }, (_, index) => ({
              date: `2026-03-${String(index + 5).padStart(2, "0")}`,
              completedCount: 1,
              totalCount: 3,
              completionRate: 0.33,
            })),
            last30Days: Array.from({ length: 30 }, (_, index) => ({
              date: `2026-02-${String(index + 1).padStart(2, "0")}`,
              completedCount: 2,
              totalCount: 3,
              completionRate: 0.67,
            })),
          },
          stabilityRanking: [
            {
              habitId: "habit_1",
              name: "Deep Work",
              kind: "quantity",
              frequencyType: "daily",
              completionRate: 0.8,
              completedCount: 8,
              totalCount: 10,
            },
          ],
        },
      }),
    );
    const tool = getRegisteredTool("stats_get_overview", fetchImpl);

    const result = await tool.handler({});

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/stats/overview");
    expect(result).toMatchObject({
      structuredContent: {
        stats: {
          metrics: {
            activeHabitCount: 3,
          },
        },
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("3 active habits"),
    });
    expect(JSON.parse(String((result.structuredContent as { _haaabit_json: string })._haaabit_json))).toMatchObject({
      stats: { metrics: { activeHabitCount: 3 } },
    });
    expect(JSON.stringify(result)).toContain("behind");
  });
});
