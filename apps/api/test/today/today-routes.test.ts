import { afterEach, describe, expect, it } from "vitest";

import { completeHabitForToday, setHabitTotalForToday } from "../../src/modules/checkins/checkin.service";
import { createHabit } from "../../src/modules/habits/habit.service";
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

describe("today routes", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("returns today's summary grouped into pending and completed", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const dailyBoolean = await createOwnedHabit(context, body.user.id, {
      name: "Drink water",
      frequency: {
        type: "daily",
      },
    });
    const dailyQuantity = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 30,
      unit: "minutes",
      frequency: {
        type: "daily",
      },
    });
    const weeklyHabit = await createOwnedHabit(context, body.user.id, {
      name: "Run",
      frequency: {
        type: "weekly_count",
        count: 1,
      },
    });

    await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: dailyQuantity.id,
        total: 15,
        source: "web",
        timestamp: "2026-03-11T10:00:00.000Z",
      },
    );
    await completeHabitForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: weeklyHabit.id,
        source: "web",
        timestamp: "2026-03-09T10:00:00.000Z",
      },
    );

    const response = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      summary: {
        date: "2026-03-11",
        totalCount: 3,
        pendingCount: 2,
        completedCount: 1,
        pendingItems: [
          {
            habitId: dailyBoolean.id,
            status: "pending",
          },
          {
            habitId: dailyQuantity.id,
            status: "pending",
            progress: {
              currentValue: 15,
              targetValue: 30,
              unit: "minutes",
            },
          },
        ],
        completedItems: [
          {
            habitId: weeklyHabit.id,
            status: "completed",
          },
        ],
      },
    });
  });

  it("switches the effective today date after the user's Shanghai local cutoff", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app, {
      timezone: "Asia/Shanghai",
    });

    await createOwnedHabit(context, body.user.id, {
      name: "Morning stretch",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    const beforeCutoff = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-07T19:59:59.000Z",
      },
    });
    const afterCutoff = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-07T20:00:00.000Z",
      },
    });

    expect(beforeCutoff.statusCode).toBe(200);
    expect(beforeCutoff.json()).toMatchObject({
      summary: {
        date: "2026-03-07",
      },
    });

    expect(afterCutoff.statusCode).toBe(200);
    expect(afterCutoff.json()).toMatchObject({
      summary: {
        date: "2026-03-08",
      },
    });
  });
});
