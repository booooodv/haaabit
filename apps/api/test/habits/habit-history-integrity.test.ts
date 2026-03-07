import { afterEach, describe, expect, it } from "vitest";

import { createHabit, updateHabit } from "../../src/modules/habits/habit.service";
import { createTestContext, signUp, type TestContext } from "../helpers/app";

async function createOwnedHabit(
  context: TestContext,
  userId: string,
  input: Parameters<typeof createHabit>[1]["input"],
) {
  return createHabit(
    {
      db: context.app.db,
    },
    {
      userId,
      input,
      today: "2026-03-01",
    },
  );
}

describe("habit history integrity", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("preserves historical day-state records across future-only edits and archive/restore", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 8,
      unit: "pages",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-03-01", value: 8, completed: true },
        { habitId: habit.id, dateKey: "2026-03-02", value: 6, completed: false },
      ],
    });

    await updateHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        input: {
          name: "Read Deep Work",
          category: "learning",
          targetValue: 12,
          unit: "minutes",
          frequency: {
            type: "weekdays",
            days: ["monday", "wednesday", "friday"],
          },
        },
      },
    );

    const archiveResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/archive`,
      headers: {
        cookie,
      },
    });

    expect(archiveResponse.statusCode).toBe(200);

    const historicalRows = await context.app.db.habitDayState.findMany({
      where: {
        habitId: habit.id,
      },
      orderBy: {
        dateKey: "asc",
      },
    });

    expect(historicalRows).toMatchObject([
      { dateKey: "2026-03-01", value: 8, completed: true },
      { dateKey: "2026-03-02", value: 6, completed: false },
    ]);

    const archivedTodayResponse = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-09T08:00:00.000Z",
      },
    });

    expect(archivedTodayResponse.statusCode).toBe(200);
    expect(archivedTodayResponse.json()).toMatchObject({
      summary: {
        pendingItems: [],
        completedItems: [],
      },
    });

    const archivedWriteResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-09T08:00:00.000Z",
      },
      payload: {
        habitId: habit.id,
        total: 5,
        source: "web",
      },
    });

    expect(archivedWriteResponse.statusCode).toBe(409);
    expect(archivedWriteResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
    });

    const restoreResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/restore`,
      headers: {
        cookie,
      },
    });

    expect(restoreResponse.statusCode).toBe(200);

    const restoredTodayResponse = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T08:00:00.000Z",
      },
    });

    expect(restoredTodayResponse.statusCode).toBe(200);
    expect(
      (restoredTodayResponse.json() as {
        summary: {
          pendingItems: Array<{ habitId: string }>;
        };
      }).summary.pendingItems,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          habitId: habit.id,
        }),
      ]),
    );
  });
});
