import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";
import type { OpenClawRegisteredTool } from "../src/types";

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function registerHandlers(fetchImpl: typeof fetch) {
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
      fetch: fetchImpl,
    },
  );

  return Object.fromEntries(
    registerTool.mock.calls.map(([tool]) => [
      (tool as OpenClawRegisteredTool).name,
      async (input: unknown) => ((await (tool as OpenClawRegisteredTool).execute(input)).details ?? null),
    ]),
  ) as Record<string, (input: unknown) => Promise<unknown>>;
}

describe("native read tools", () => {
  it("implements habits_list through the shared API client", async () => {
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
        ],
      }),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(handlers.habits_list?.({})).resolves.toMatchObject({
      ok: true,
      toolName: "habits_list",
      summary: expect.stringContaining("default active filter"),
      data: {
        items: [expect.objectContaining({ name: "Deep Work" })],
      },
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits?status=active");
  });

  it("implements habits_get_detail through the shared runtime seam", async () => {
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
            last7Days: Array.from({ length: 7 }, (_, index) => ({
              date: `2026-03-${String(index + 5).padStart(2, "0")}`,
              status: index === 6 ? "pending" : "completed",
              completionRate: index === 6 ? null : 1,
              completedCount: index === 6 ? 0 : 1,
              completionTarget: 1,
              value: index === 6 ? 0 : 4,
              valueTarget: 4,
            })),
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
    const handlers = registerHandlers(fetchImpl);

    await expect(handlers.habits_get_detail?.({ habitId: "habit_1" })).resolves.toMatchObject({
      ok: true,
      toolName: "habits_get_detail",
      summary: expect.stringContaining("needs attention today"),
      data: {
        item: {
          habit: {
            id: "habit_1",
          },
        },
      },
    });
  });

  it("adapts today_get_summary into the native today shape", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
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
                currentValue: 10,
                targetValue: 30,
                unit: "pages",
                periodCompletions: null,
                periodTarget: null,
              },
            },
          ],
          completedItems: [],
        },
      }),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(handlers.today_get_summary?.({})).resolves.toMatchObject({
      ok: true,
      toolName: "today_get_summary",
      data: {
        today: {
          totalCount: 2,
          pendingCount: 1,
        },
      },
    });
  });

  it("adapts stats_get_overview into the native stats shape", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        overview: {
          date: "2026-03-11",
          metrics: {
            todayCompletedCount: 2,
            activeHabitCount: 3,
            todayCompletionRate: 0.67,
            weeklyCompletionRate: 0.55,
          },
          trends: {
            last7Days: Array.from({ length: 7 }, (_, index) => ({
              date: `2026-03-${String(index + 5).padStart(2, "0")}`,
              completedCount: index + 1,
              totalCount: 3,
              completionRate: 0.67,
            })),
            last30Days: Array.from({ length: 30 }, (_, index) => ({
              date: index < 9 ? `2026-02-${String(index + 20).padStart(2, "0")}` : `2026-03-${String(index - 9 + 1).padStart(2, "0")}`,
              completedCount: 2,
              totalCount: 3,
              completionRate: 0.67,
            })),
          },
          stabilityRanking: [
            {
              habitId: "habit_read",
              name: "Read",
              kind: "quantity",
              frequencyType: "daily",
              completionRate: 0.8,
              completedCount: 4,
              totalCount: 5,
            },
          ],
        },
      }),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(handlers.stats_get_overview?.({})).resolves.toMatchObject({
      ok: true,
      toolName: "stats_get_overview",
      data: {
        stats: {
          metrics: {
            activeHabitCount: 3,
          },
        },
      },
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/stats/overview");
  });
});
