import { afterEach, describe, expect, it } from "vitest";

import { createHabit, getHabitDetail } from "../../src/modules/habits/habit.service";
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

describe("habit detail trends", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("adds 7-day and 30-day daily trend slices for quantity habits", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

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
        { habitId: habit.id, dateKey: "2026-03-06", value: 6, completed: false },
        { habitId: habit.id, dateKey: "2026-03-07", value: 8, completed: true },
        { habitId: habit.id, dateKey: "2026-03-09", value: 10, completed: true },
      ],
    });

    const detail = await getHabitDetail(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    expect(detail.trends.last7Days).toHaveLength(7);
    expect(detail.trends.last30Days).toHaveLength(30);
    expect(detail.trends.last7Days[1]).toEqual({
      date: "2026-03-06",
      status: "missed",
      completionRate: 0,
      completedCount: 0,
      completionTarget: 1,
      value: 6,
      valueTarget: 8,
    });
    expect(detail.trends.last7Days[2]).toEqual({
      date: "2026-03-07",
      status: "completed",
      completionRate: 1,
      completedCount: 1,
      completionTarget: 1,
      value: 8,
      valueTarget: 8,
    });
    expect(detail.trends.last7Days[6]).toEqual({
      date: "2026-03-11",
      status: "pending",
      completionRate: 0,
      completedCount: 0,
      completionTarget: 1,
      value: 0,
      valueTarget: 8,
    });
  });

  it("tracks daily progress points for weekly-count habits across a week boundary", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Workout",
      frequency: {
        type: "weekly_count",
        count: 2,
      },
      startDate: "2026-03-02",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-03-03", completed: true },
        { habitId: habit.id, dateKey: "2026-03-05", completed: true },
        { habitId: habit.id, dateKey: "2026-03-10", completed: true },
      ],
    });

    const detail = await getHabitDetail(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    expect(detail.trends.last7Days.find((point) => point.date === "2026-03-05")).toEqual({
      date: "2026-03-05",
      status: "completed",
      completionRate: 1,
      completedCount: 2,
      completionTarget: 2,
      value: null,
      valueTarget: null,
    });
    expect(detail.trends.last7Days.find((point) => point.date === "2026-03-10")).toEqual({
      date: "2026-03-10",
      status: "pending",
      completionRate: 0.5,
      completedCount: 1,
      completionTarget: 2,
      value: null,
      valueTarget: null,
    });
  });
});
