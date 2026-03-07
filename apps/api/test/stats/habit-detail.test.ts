import { afterEach, describe, expect, it } from "vitest";

import * as habitService from "../../src/modules/habits/habit.service";
import { createHabit } from "../../src/modules/habits/habit.service";
import { createTestContext, signUp, type TestContext } from "../helpers/app";

type HabitDetailGetter = (
  dependencies: { db: TestContext["app"]["db"] },
  params: {
    userId: string;
    habitId: string;
    timestamp?: string;
  },
) => Promise<{
  habit: {
    id: string;
    kind: "boolean" | "quantity";
    name: string;
    isActive: boolean;
    frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
    frequencyCount: number | null;
    targetValue: number | null;
    unit: string | null;
  };
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    interruptionCount: number;
  };
  recentHistory: Array<{
    periodType: "day" | "week" | "month";
    periodKey: string;
    periodStart: string;
    periodEnd: string;
    status: "completed" | "missed";
    completionCount: number;
    completionTarget: number;
    value: number | null;
    valueTarget: number | null;
    unit: string | null;
  }>;
}>;

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

function getHabitDetailGetter() {
  return (habitService as unknown as { getHabitDetail?: HabitDetailGetter }).getHabitDetail;
}

describe("habit detail read model", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("builds quantity habit detail metrics and recent history from settled day outcomes", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const getHabitDetail = getHabitDetailGetter();

    expect(getHabitDetail).toBeTypeOf("function");

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
        { habitId: habit.id, dateKey: "2026-03-05", value: 9, completed: true },
        { habitId: habit.id, dateKey: "2026-03-06", value: 8, completed: true },
      ],
    });

    const detail = await getHabitDetail!(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        timestamp: "2026-03-07T12:00:00.000Z",
      },
    );

    expect(detail.habit).toMatchObject({
      id: habit.id,
      kind: "quantity",
      name: "Read",
      isActive: true,
      frequencyType: "daily",
      targetValue: 8,
      unit: "pages",
    });
    expect(detail.stats).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      totalCompletions: 4,
      interruptionCount: 2,
    });
    expect(detail.recentHistory.slice(0, 5)).toEqual([
      {
        periodType: "day",
        periodKey: "2026-03-06",
        periodStart: "2026-03-06",
        periodEnd: "2026-03-06",
        status: "completed",
        completionCount: 1,
        completionTarget: 1,
        value: 8,
        valueTarget: 8,
        unit: "pages",
      },
      {
        periodType: "day",
        periodKey: "2026-03-05",
        periodStart: "2026-03-05",
        periodEnd: "2026-03-05",
        status: "completed",
        completionCount: 1,
        completionTarget: 1,
        value: 9,
        valueTarget: 8,
        unit: "pages",
      },
      {
        periodType: "day",
        periodKey: "2026-03-04",
        periodStart: "2026-03-04",
        periodEnd: "2026-03-04",
        status: "missed",
        completionCount: 0,
        completionTarget: 1,
        value: 0,
        valueTarget: 8,
        unit: "pages",
      },
      {
        periodType: "day",
        periodKey: "2026-03-03",
        periodStart: "2026-03-03",
        periodEnd: "2026-03-03",
        status: "completed",
        completionCount: 1,
        completionTarget: 1,
        value: 10,
        valueTarget: 8,
        unit: "pages",
      },
      {
        periodType: "day",
        periodKey: "2026-03-02",
        periodStart: "2026-03-02",
        periodEnd: "2026-03-02",
        status: "missed",
        completionCount: 0,
        completionTarget: 1,
        value: 6,
        valueTarget: 8,
        unit: "pages",
      },
    ]);
  });

  it("computes weekly streaks from consecutive successful periods rather than raw completion days", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const getHabitDetail = getHabitDetailGetter();

    expect(getHabitDetail).toBeTypeOf("function");

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Workout",
      frequency: {
        type: "weekly_count",
        count: 2,
      },
      startDate: "2026-01-26",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-01-27", completed: true },
        { habitId: habit.id, dateKey: "2026-01-28", completed: true },
        { habitId: habit.id, dateKey: "2026-01-29", completed: true },
        { habitId: habit.id, dateKey: "2026-02-03", completed: true },
        { habitId: habit.id, dateKey: "2026-02-05", completed: true },
        { habitId: habit.id, dateKey: "2026-02-10", completed: true },
        { habitId: habit.id, dateKey: "2026-02-17", completed: true },
        { habitId: habit.id, dateKey: "2026-02-20", completed: true },
      ],
    });

    const detail = await getHabitDetail!(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        timestamp: "2026-02-23T12:00:00.000Z",
      },
    );

    expect(detail.stats).toEqual({
      currentStreak: 1,
      longestStreak: 2,
      totalCompletions: 3,
      interruptionCount: 1,
    });
    expect(detail.recentHistory.slice(0, 4)).toEqual([
      {
        periodType: "week",
        periodKey: "2026-W08",
        periodStart: "2026-02-16",
        periodEnd: "2026-02-22",
        status: "completed",
        completionCount: 2,
        completionTarget: 2,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "week",
        periodKey: "2026-W07",
        periodStart: "2026-02-09",
        periodEnd: "2026-02-15",
        status: "missed",
        completionCount: 1,
        completionTarget: 2,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "week",
        periodKey: "2026-W06",
        periodStart: "2026-02-02",
        periodEnd: "2026-02-08",
        status: "completed",
        completionCount: 2,
        completionTarget: 2,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "week",
        periodKey: "2026-W05",
        periodStart: "2026-01-26",
        periodEnd: "2026-02-01",
        status: "completed",
        completionCount: 3,
        completionTarget: 2,
        value: null,
        valueTarget: null,
        unit: null,
      },
    ]);
  });

  it("computes monthly streaks from consecutive successful months", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const getHabitDetail = getHabitDetailGetter();

    expect(getHabitDetail).toBeTypeOf("function");

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Deep work",
      frequency: {
        type: "monthly_count",
        count: 3,
      },
      startDate: "2026-01-01",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-01-03", completed: true },
        { habitId: habit.id, dateKey: "2026-01-10", completed: true },
        { habitId: habit.id, dateKey: "2026-01-21", completed: true },
        { habitId: habit.id, dateKey: "2026-02-14", completed: true },
        { habitId: habit.id, dateKey: "2026-03-02", completed: true },
        { habitId: habit.id, dateKey: "2026-03-15", completed: true },
        { habitId: habit.id, dateKey: "2026-03-18", completed: true },
        { habitId: habit.id, dateKey: "2026-03-24", completed: true },
        { habitId: habit.id, dateKey: "2026-04-05", completed: true },
        { habitId: habit.id, dateKey: "2026-04-12", completed: true },
        { habitId: habit.id, dateKey: "2026-04-26", completed: true },
      ],
    });

    const detail = await getHabitDetail!(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        timestamp: "2026-05-01T12:00:00.000Z",
      },
    );

    expect(detail.stats).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      totalCompletions: 3,
      interruptionCount: 1,
    });
    expect(detail.recentHistory.slice(0, 4)).toEqual([
      {
        periodType: "month",
        periodKey: "2026-04",
        periodStart: "2026-04-01",
        periodEnd: "2026-04-30",
        status: "completed",
        completionCount: 3,
        completionTarget: 3,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "month",
        periodKey: "2026-03",
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
        status: "completed",
        completionCount: 4,
        completionTarget: 3,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "month",
        periodKey: "2026-02",
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        status: "missed",
        completionCount: 1,
        completionTarget: 3,
        value: null,
        valueTarget: null,
        unit: null,
      },
      {
        periodType: "month",
        periodKey: "2026-01",
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        status: "completed",
        completionCount: 3,
        completionTarget: 3,
        value: null,
        valueTarget: null,
        unit: null,
      },
    ]);
  });
});
