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

describe("native mutation tools", () => {
  it("implements habits_add", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
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
    const handlers = registerHandlers(fetchImpl);

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
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
    });
  });

  it("implements habits_edit", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        item: {
          id: "habit_read",
          userId: "user_1",
          name: "Read 30 min",
          kind: "quantity",
          description: null,
          category: "learning",
          targetValue: 30,
          unit: "minutes",
          startDate: "2026-03-01",
          isActive: true,
          frequencyType: "daily",
          frequencyCount: null,
          weekdays: [],
          createdAt: "2026-03-01T08:00:00.000Z",
          updatedAt: "2026-03-05T08:00:00.000Z",
        },
      }),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(
      handlers.habits_edit?.({
        habitId: "habit_read",
        name: "Read 30 min",
        unit: "minutes",
      }),
    ).resolves.toMatchObject({
      ok: true,
      toolName: "habits_edit",
      summary: expect.stringContaining("Updated Read 30 min"),
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits/habit_read");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "PATCH",
    });
  });

  it("implements archive and restore mutations", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          item: {
            id: "habit_run",
            userId: "user_1",
            name: "Run",
            kind: "boolean",
            description: null,
            category: "health",
            targetValue: null,
            unit: null,
            startDate: "2026-03-01",
            isActive: false,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-05T08:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          item: {
            id: "habit_run",
            userId: "user_1",
            name: "Run",
            kind: "boolean",
            description: null,
            category: "health",
            targetValue: null,
            unit: null,
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-06T08:00:00.000Z",
          },
        }),
      );
    const handlers = registerHandlers(fetchImpl);

    await expect(handlers.habits_archive?.({ habitId: "habit_run" })).resolves.toMatchObject({
      ok: true,
      toolName: "habits_archive",
      summary: expect.stringContaining("Archived Run"),
    });
    await expect(handlers.habits_restore?.({ habitId: "habit_run" })).resolves.toMatchObject({
      ok: true,
      toolName: "habits_restore",
      summary: expect.stringContaining("Restored Run"),
    });
  });

  it("implements today_complete and today_set_total with adapted today data", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
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
            totalCount: 2,
            pendingCount: 1,
            completedCount: 1,
            completionRate: 0.5,
            pendingItems: [],
            completedItems: [],
          },
        }),
      )
      .mockResolvedValueOnce(
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
            ],
          },
        }),
      );
    const handlers = registerHandlers(fetchImpl);

    await expect(
      handlers.today_complete?.({
        habitId: "habit_walk",
        source: "ai",
      }),
    ).resolves.toMatchObject({
      ok: true,
      toolName: "today_complete",
      data: {
        habit: {
          id: "habit_walk",
        },
        today: {
          pendingCount: 1,
        },
      },
    });
    await expect(
      handlers.today_set_total?.({
        habitId: "habit_read",
        total: 10,
        source: "ai",
      }),
    ).resolves.toMatchObject({
      ok: true,
      toolName: "today_set_total",
      data: {
        habit: {
          id: "habit_read",
        },
        today: {
          completedCount: 2,
        },
      },
    });
  });

  it("implements today_undo", async () => {
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
          completedItems: [],
        },
      }),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(
      handlers.today_undo?.({
        habitId: "habit_read",
        source: "ai",
      }),
    ).resolves.toMatchObject({
      ok: true,
      toolName: "today_undo",
      summary: expect.stringContaining("Undid today's set total"),
      data: {
        habit: {
          id: "habit_read",
        },
      },
    });
  });

  it("surfaces shared structured mutation errors for missing habits", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "Habit not found",
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    const handlers = registerHandlers(fetchImpl);

    await expect(
      handlers.habits_archive?.({
        habitId: "habit_missing",
      }),
    ).resolves.toMatchObject({
      ok: false,
      toolName: "habits_archive",
      error: {
        category: "not_found",
        code: "NOT_FOUND",
        hint: expect.stringContaining("habitId"),
        resolution: "check_habit_id",
      },
    });
  });
});
