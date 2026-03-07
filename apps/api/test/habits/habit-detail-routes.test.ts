import { afterEach, describe, expect, it } from "vitest";

import { archiveHabit, createHabit } from "../../src/modules/habits/habit.service";
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

describe("habit detail routes", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("returns a detail payload with stats and recent history for the authenticated owner", async () => {
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
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-03-01", value: 8, completed: true },
        { habitId: habit.id, dateKey: "2026-03-02", value: 6, completed: false },
        { habitId: habit.id, dateKey: "2026-03-03", value: 10, completed: true },
      ],
    });

    const response = await context.app.inject({
      method: "GET",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-04T12:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(200);
    const responseBody = response.json() as {
      item: {
        recentHistory: Array<Record<string, unknown>>;
      };
    };

    expect(responseBody).toMatchObject({
      item: {
        habit: {
          id: habit.id,
          name: "Read",
          kind: "quantity",
          isActive: true,
        },
        stats: {
          currentStreak: 1,
          longestStreak: 1,
          totalCompletions: 2,
          interruptionCount: 1,
        },
      },
    });
    expect(responseBody.item.recentHistory.slice(0, 2)).toEqual([
      expect.objectContaining({
        periodType: "day",
        periodKey: "2026-03-03",
        status: "completed",
        value: 10,
        valueTarget: 8,
        unit: "pages",
      }),
      expect.objectContaining({
        periodType: "day",
        periodKey: "2026-03-02",
        status: "missed",
        value: 6,
        valueTarget: 8,
        unit: "pages",
      }),
    ]);
  });

  it("keeps archived habits readable while enforcing ownership on detail reads", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);
    const intruder = await signUp(context.app, {
      email: "intruder@example.com",
      name: "Intruder",
    });

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Workout",
      frequency: {
        type: "weekly_count",
        count: 2,
      },
      startDate: "2026-01-26",
    });

    await archiveHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
      },
    );

    const archivedResponse = await context.app.inject({
      method: "GET",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie,
        "x-haaabit-now": "2026-02-23T12:00:00.000Z",
      },
    });

    expect(archivedResponse.statusCode).toBe(200);
    expect(archivedResponse.json()).toMatchObject({
      item: {
        habit: {
          id: habit.id,
          isActive: false,
        },
      },
    });

    const forbiddenResponse = await context.app.inject({
      method: "GET",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie: intruder.cookie,
      },
    });

    expect(forbiddenResponse.statusCode).toBe(404);
    expect(forbiddenResponse.json()).toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
