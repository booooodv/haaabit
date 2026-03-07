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
      today: "2026-02-10",
    },
  );
}

describe("overview trend windows", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("returns daily account trends for the last 7 and 30 habit-days", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      frequency: {
        type: "daily",
      },
      startDate: "2026-02-10",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-03-05", completed: true },
        { habitId: habit.id, dateKey: "2026-03-06", completed: false },
        { habitId: habit.id, dateKey: "2026-03-07", completed: true },
        { habitId: habit.id, dateKey: "2026-03-09", completed: true },
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

    expect(overview.trends.last7Days).toHaveLength(7);
    expect(overview.trends.last30Days).toHaveLength(30);
    expect(overview.trends.last7Days[0]).toEqual({
      date: "2026-03-05",
      completedCount: 1,
      totalCount: 1,
      completionRate: 1,
    });
    expect(overview.trends.last7Days[1]).toEqual({
      date: "2026-03-06",
      completedCount: 0,
      totalCount: 1,
      completionRate: 0,
    });
    expect(overview.trends.last7Days[6]).toEqual({
      date: "2026-03-11",
      completedCount: 0,
      totalCount: 1,
      completionRate: 0,
    });
    expect(overview.trends.last30Days[0]?.date).toBe("2026-02-10");
    expect(overview.trends.last30Days[29]?.date).toBe("2026-03-11");
  });
});
