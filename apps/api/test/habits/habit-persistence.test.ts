import { afterEach, describe, expect, it } from "vitest";

import { createHabit } from "../../src/modules/habits/habit.service";
import { createTestContext, signUp, type TestContext } from "../helpers/app";

describe("createHabit persistence", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("persists the minimum daily habit for a user", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

    const habit = await createHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        input: {
          name: "Walk the dog",
          frequency: {
            type: "daily",
          },
        },
        today: "2026-03-07",
      },
    );

    expect(habit).toMatchObject({
      userId: body.user.id,
      name: "Walk the dog",
      kind: "boolean",
      frequencyType: "daily",
      frequencyCount: null,
      weekdays: [],
      startDate: "2026-03-07",
      isActive: true,
    });

    const stored = await context.app.db.habit.findUniqueOrThrow({
      where: { id: habit.id },
      include: { weekdays: true },
    });

    expect(stored.name).toBe("Walk the dog");
    expect(stored.frequencyType).toBe("DAILY");
    expect(stored.weekdays).toEqual([]);
  });

  it("persists weekday habits and optional metadata", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app, {
      email: "bob@example.com",
      name: "Bob",
    });

    const habit = await createHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        input: {
          name: "Read",
          kind: "quantity",
          targetValue: 30,
          unit: "minutes",
          category: "learning",
          description: "Read a technical book",
          frequency: {
            type: "weekdays",
            days: ["monday", "wednesday", "friday"],
          },
          startDate: "2026-03-10",
        },
        today: "2026-03-07",
      },
    );

    expect(habit).toMatchObject({
      userId: body.user.id,
      kind: "quantity",
      targetValue: 30,
      unit: "minutes",
      category: "learning",
      description: "Read a technical book",
      frequencyType: "weekdays",
      weekdays: ["monday", "wednesday", "friday"],
      startDate: "2026-03-10",
    });

    const stored = await context.app.db.habit.findUniqueOrThrow({
      where: { id: habit.id },
      include: {
        weekdays: {
          orderBy: {
            day: "asc",
          },
        },
      },
    });

    expect(stored.kind).toBe("QUANTITY");
    expect(stored.weekdays.map((entry) => entry.day)).toEqual(["FRIDAY", "MONDAY", "WEDNESDAY"]);
  });

  it("defaults the startDate from the user's timezone-aware current habit day", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app, {
      email: "timezone@example.com",
      name: "Timezone User",
      timezone: "Asia/Shanghai",
    });

    const habit = await createHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        input: {
          name: "Late-night planning",
          frequency: {
            type: "daily",
          },
        },
        timestamp: "2026-03-07T20:30:00.000Z",
      },
    );

    expect(habit.startDate).toBe("2026-03-08");
  });
});
