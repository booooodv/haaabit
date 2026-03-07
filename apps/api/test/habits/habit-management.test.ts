import { afterEach, describe, expect, it } from "vitest";

import {
  archiveHabit,
  createHabit,
  listHabits,
  restoreHabit,
  updateHabit,
} from "../../src/modules/habits/habit.service";
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

describe("habit management service", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("filters habits by lifecycle status, search query, category, and kind", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);

    const yoga = await createOwnedHabit(context, body.user.id, {
      name: "Morning Yoga",
      category: "health",
      frequency: {
        type: "daily",
      },
    });
    await createOwnedHabit(context, body.user.id, {
      name: "Read Fiction",
      category: "learning",
      kind: "quantity",
      targetValue: 20,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });
    const walk = await createOwnedHabit(context, body.user.id, {
      name: "Walk Outside",
      category: "health",
      frequency: {
        type: "weekdays",
        days: ["monday", "wednesday"],
      },
    });

    await archiveHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: walk.id,
      },
    );

    const activeHealth = await listHabits(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        filters: {
          status: "active",
          category: "health",
        },
      },
    );

    expect(activeHealth.map((habit) => habit.id)).toEqual([yoga.id]);

    const archivedSearch = await listHabits(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        filters: {
          status: "archived",
          query: "outside",
        },
      },
    );

    expect(archivedSearch.map((habit) => habit.id)).toEqual([walk.id]);

    const activeQuantity = await listHabits(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        filters: {
          status: "active",
          kind: "quantity",
        },
      },
    );

    expect(activeQuantity).toHaveLength(1);
    expect(activeQuantity[0]?.kind).toBe("quantity");
    expect(activeQuantity[0]?.name).toBe("Read Fiction");
  });

  it("updates editable fields without rewriting prior history and keeps kind immutable", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });

    await context.app.db.habitDayState.create({
      data: {
        habitId: habit.id,
        dateKey: "2026-03-02",
        value: 6,
        completed: false,
      },
    });

    const updated = await updateHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        input: {
          name: "Read Deep Work",
          category: "learning",
          description: "Focused reading block",
          targetValue: 15,
          unit: "minutes",
          startDate: "2026-03-05",
          frequency: {
            type: "weekdays",
            days: ["monday", "tuesday", "wednesday"],
          },
        },
      },
    );

    expect(updated).toMatchObject({
      id: habit.id,
      kind: "quantity",
      name: "Read Deep Work",
      category: "learning",
      description: "Focused reading block",
      targetValue: 15,
      unit: "minutes",
      startDate: "2026-03-05",
      frequencyType: "weekdays",
      weekdays: ["monday", "tuesday", "wednesday"],
    });

    const historyState = await context.app.db.habitDayState.findUniqueOrThrow({
      where: {
        habitId_dateKey: {
          habitId: habit.id,
          dateKey: "2026-03-02",
        },
      },
    });

    expect(historyState).toMatchObject({
      habitId: habit.id,
      dateKey: "2026-03-02",
      value: 6,
      completed: false,
    });

    await expect(
      updateHabit(
        {
          db: context.app.db,
        },
        {
          userId: body.user.id,
          habitId: habit.id,
          input: {
            kind: "boolean",
          },
        },
      ),
    ).rejects.toThrow(/kind/i);
  });

  it("archives habits into a read-only state until restored", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Journal",
      frequency: {
        type: "daily",
      },
    });

    const archived = await archiveHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
      },
    );

    expect(archived.isActive).toBe(false);

    await expect(
      updateHabit(
        {
          db: context.app.db,
        },
        {
          userId: body.user.id,
          habitId: habit.id,
          input: {
            name: "Journal Again",
          },
        },
      ),
    ).rejects.toThrow(/archived|inactive/i);

    const restored = await restoreHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
      },
    );

    expect(restored.isActive).toBe(true);
  });
});
