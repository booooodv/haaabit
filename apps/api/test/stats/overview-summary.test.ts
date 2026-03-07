import { afterEach, describe, expect, it } from "vitest";

import { createHabit } from "../../src/modules/habits/habit.service";
import { getOverviewStats } from "../../src/modules/stats/stats.service";
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

describe("overview stats summary", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("builds today's cards and natural-week completion rate from active habits only", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

    const dailyHabit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    const weekdayHabit = await createOwnedHabit(context, body.user.id, {
      name: "Stretch",
      frequency: {
        type: "weekdays",
        days: ["monday", "wednesday"],
      },
      startDate: "2026-03-01",
    });

    const archivedHabit = await createOwnedHabit(context, body.user.id, {
      name: "Archive me",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    await context.app.db.habit.update({
      where: {
        id: archivedHabit.id,
      },
      data: {
        isActive: false,
      },
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: dailyHabit.id, dateKey: "2026-03-08", completed: true },
        { habitId: dailyHabit.id, dateKey: "2026-03-09", completed: true },
        { habitId: dailyHabit.id, dateKey: "2026-03-10", completed: true },
        { habitId: weekdayHabit.id, dateKey: "2026-03-11", completed: true },
        { habitId: archivedHabit.id, dateKey: "2026-03-09", completed: true },
        { habitId: archivedHabit.id, dateKey: "2026-03-10", completed: true },
        { habitId: archivedHabit.id, dateKey: "2026-03-11", completed: true },
      ],
    });

    const overview = await getOverviewStats(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    expect(overview).toMatchObject({
      date: "2026-03-11",
      metrics: {
        todayCompletedCount: 1,
        todayCompletionRate: 0.5,
        weeklyCompletionRate: 0.6,
        activeHabitCount: 2,
      },
    });
  });
});
