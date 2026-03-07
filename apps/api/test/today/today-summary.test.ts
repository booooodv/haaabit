import { describe, expect, it } from "vitest";

import { resolveHabitDay } from "../../src/modules/today/today-clock";
import { buildTodaySummary } from "../../src/modules/today/today-summary";

describe("buildTodaySummary", () => {
  it("groups visible habits into pending and completed with accurate counts", () => {
    const summary = buildTodaySummary({
      day: resolveHabitDay({
        timestamp: "2026-03-11T12:00:00.000Z",
        timeZone: "UTC",
      }),
      habits: [
        {
          id: "daily-boolean",
          name: "Drink water",
          kind: "boolean",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
        {
          id: "daily-quantity",
          name: "Read",
          kind: "quantity",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: 30,
          unit: "minutes",
          startDate: "2026-03-01",
          weekdays: [],
        },
        {
          id: "weekday-complete",
          name: "Strength",
          kind: "boolean",
          frequencyType: "weekdays",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: ["wednesday"],
        },
      ],
      dayStates: [
        {
          habitId: "daily-quantity",
          dateKey: "2026-03-11",
          value: 15,
          completed: false,
        },
        {
          habitId: "weekday-complete",
          dateKey: "2026-03-11",
          value: null,
          completed: true,
        },
      ],
      periodProgress: [],
    });

    expect(summary).toMatchObject({
      date: "2026-03-11",
      totalCount: 3,
      pendingCount: 2,
      completedCount: 1,
      completionRate: 0.33,
      pendingItems: [
        {
          habitId: "daily-boolean",
          status: "pending",
        },
        {
          habitId: "daily-quantity",
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
          habitId: "weekday-complete",
          status: "completed",
        },
      ],
    });
  });

  it("keeps weekly and monthly habits visible until their period target is met, then keeps them in completed", () => {
    const summary = buildTodaySummary({
      day: resolveHabitDay({
        timestamp: "2026-03-11T12:00:00.000Z",
        timeZone: "UTC",
      }),
      habits: [
        {
          id: "weekly-pending",
          name: "Cook",
          kind: "boolean",
          frequencyType: "weekly_count",
          frequencyCount: 3,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
        {
          id: "weekly-complete",
          name: "Run",
          kind: "boolean",
          frequencyType: "weekly_count",
          frequencyCount: 3,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
        {
          id: "monthly-complete",
          name: "Deep clean",
          kind: "boolean",
          frequencyType: "monthly_count",
          frequencyCount: 2,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
      ],
      dayStates: [],
      periodProgress: [
        {
          habitId: "weekly-pending",
          period: "week",
          periodKey: "2026-W11",
          completions: 1,
        },
        {
          habitId: "weekly-complete",
          period: "week",
          periodKey: "2026-W11",
          completions: 3,
        },
        {
          habitId: "monthly-complete",
          period: "month",
          periodKey: "2026-03",
          completions: 2,
        },
      ],
    });

    expect(summary.pendingItems.map((item) => item.habitId)).toEqual(["weekly-pending"]);
    expect(summary.completedItems.map((item) => item.habitId)).toEqual([
      "weekly-complete",
      "monthly-complete",
    ]);
  });

  it("does not carry yesterday forward and evaluates weekday habits against the effective habit day", () => {
    const summary = buildTodaySummary({
      day: resolveHabitDay({
        timestamp: "2026-03-08T19:30:00.000Z",
        timeZone: "Asia/Shanghai",
      }),
      habits: [
        {
          id: "sunday-habit",
          name: "Weekly review",
          kind: "boolean",
          frequencyType: "weekdays",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: ["sunday"],
        },
        {
          id: "monday-habit",
          name: "Plan week",
          kind: "boolean",
          frequencyType: "weekdays",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: ["monday"],
        },
        {
          id: "daily-yesterday-only",
          name: "Inbox zero",
          kind: "boolean",
          frequencyType: "daily",
          frequencyCount: null,
          targetValue: null,
          unit: null,
          startDate: "2026-03-01",
          weekdays: [],
        },
      ],
      dayStates: [
        {
          habitId: "daily-yesterday-only",
          dateKey: "2026-03-07",
          value: null,
          completed: true,
        },
      ],
      periodProgress: [],
    });

    expect(summary.date).toBe("2026-03-08");
    expect(summary.pendingItems.map((item) => item.habitId)).toEqual([
      "sunday-habit",
      "daily-yesterday-only",
    ]);
    expect(summary.completedItems).toEqual([]);
  });
});
