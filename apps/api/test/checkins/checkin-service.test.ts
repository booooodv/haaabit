import { afterEach, describe, expect, it } from "vitest";

import { completeHabitForToday, setHabitTotalForToday, undoHabitForToday } from "../../src/modules/checkins/checkin.service";
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
      today: "2026-03-07",
    },
  );
}

describe("checkin service", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("completes and undoes a boolean habit for the current habit day", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Drink water",
      frequency: {
        type: "daily",
      },
    });

    const completed = await completeHabitForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        source: "web",
        note: "finished at lunch",
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    expect(completed.currentState).toMatchObject({
      dateKey: "2026-03-11",
      completed: true,
      value: null,
    });

    const undone = await undoHabitForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        source: "web",
        note: "undo accidental tap",
        timestamp: "2026-03-11T12:05:00.000Z",
      },
    );

    expect(undone.currentState).toMatchObject({
      dateKey: "2026-03-11",
      completed: false,
      value: null,
    });
  });

  it("stores quantified habits as today totals, auto-completes at target, and can drop back to pending", async () => {
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

    const partial = await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        total: 4,
        source: "web",
        timestamp: "2026-03-11T09:00:00.000Z",
      },
    );

    expect(partial.currentState).toMatchObject({
      dateKey: "2026-03-11",
      value: 4,
      completed: false,
    });

    const complete = await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        total: 10,
        source: "web",
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    expect(complete.currentState).toMatchObject({
      dateKey: "2026-03-11",
      value: 10,
      completed: true,
    });

    const downgraded = await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        total: 6,
        source: "web",
        timestamp: "2026-03-11T18:00:00.000Z",
      },
    );

    expect(downgraded.currentState).toMatchObject({
      dateKey: "2026-03-11",
      value: 6,
      completed: false,
    });
  });

  it("undoes a quantified habit back to the previous saved total instead of clearing the day", async () => {
    context = await createTestContext();
    const { body } = await signUp(context.app);
    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Write",
      kind: "quantity",
      targetValue: 1000,
      unit: "words",
      frequency: {
        type: "daily",
      },
    });

    await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        total: 500,
        source: "web",
        timestamp: "2026-03-11T08:00:00.000Z",
      },
    );

    await setHabitTotalForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        total: 1200,
        source: "web",
        timestamp: "2026-03-11T12:00:00.000Z",
      },
    );

    const undone = await undoHabitForToday(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: habit.id,
        source: "web",
        note: "back to the earlier saved total",
        timestamp: "2026-03-11T12:10:00.000Z",
      },
    );

    expect(undone.currentState).toMatchObject({
      dateKey: "2026-03-11",
      value: 500,
      completed: false,
    });
  });
});
