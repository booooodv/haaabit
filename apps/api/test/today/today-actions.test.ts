import { afterEach, describe, expect, it } from "vitest";

import { createHabit } from "../../src/modules/habits/habit.service";
import { archiveHabit } from "../../src/modules/habits/habit.service";
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

describe("today action routes", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("completes, sets totals, and undoes while returning updated today summary plus the affected habit", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const booleanHabit = await createOwnedHabit(context, body.user.id, {
      name: "Meditate",
      frequency: {
        type: "daily",
      },
    });
    const quantityHabit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });

    const completeResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/complete",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T08:00:00.000Z",
      },
      payload: {
        habitId: booleanHabit.id,
        source: "web",
      },
    });

    expect(completeResponse.statusCode).toBe(200);
    expect(completeResponse.json()).toMatchObject({
      affectedHabit: {
        id: booleanHabit.id,
      },
      summary: {
        completedItems: [
          {
            habitId: booleanHabit.id,
            status: "completed",
          },
        ],
      },
    });

    const partialResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T09:00:00.000Z",
      },
      payload: {
        habitId: quantityHabit.id,
        total: 5,
        source: "web",
      },
    });

    expect(partialResponse.statusCode).toBe(200);
    expect(partialResponse.json()).toMatchObject({
      affectedHabit: {
        id: quantityHabit.id,
      },
      summary: {
        pendingItems: [
          {
            habitId: quantityHabit.id,
            status: "pending",
            progress: {
              currentValue: 5,
              targetValue: 10,
            },
          },
        ],
      },
    });

    const completeQuantityResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T10:00:00.000Z",
      },
      payload: {
        habitId: quantityHabit.id,
        total: 10,
        source: "web",
      },
    });

    expect(completeQuantityResponse.statusCode).toBe(200);
    expect(
      (completeQuantityResponse.json() as {
        summary: {
          completedItems: Array<{ habitId: string; status: string }>;
        };
      }).summary.completedItems,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          habitId: quantityHabit.id,
          status: "completed",
        }),
      ]),
    );

    const undoResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/undo",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T10:05:00.000Z",
      },
      payload: {
        habitId: quantityHabit.id,
        source: "web",
      },
    });

    expect(undoResponse.statusCode).toBe(200);
    expect(undoResponse.json()).toMatchObject({
      affectedHabit: {
        id: quantityHabit.id,
      },
      summary: {
        pendingItems: [
          {
            habitId: quantityHabit.id,
            status: "pending",
            progress: {
              currentValue: 5,
              targetValue: 10,
            },
          },
        ],
      },
    });
  });

  it("rejects today write actions for archived habits", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const booleanHabit = await createOwnedHabit(context, body.user.id, {
      name: "Meditate",
      frequency: {
        type: "daily",
      },
    });
    const quantityHabit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });

    await archiveHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: booleanHabit.id,
      },
    );
    await archiveHabit(
      {
        db: context.app.db,
      },
      {
        userId: body.user.id,
        habitId: quantityHabit.id,
      },
    );

    const completeResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/complete",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T08:00:00.000Z",
      },
      payload: {
        habitId: booleanHabit.id,
        source: "web",
      },
    });

    expect(completeResponse.statusCode).toBe(409);
    expect(completeResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
    });

    const setTotalResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T09:00:00.000Z",
      },
      payload: {
        habitId: quantityHabit.id,
        total: 5,
        source: "web",
      },
    });

    expect(setTotalResponse.statusCode).toBe(409);
    expect(setTotalResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
    });

    const undoResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/undo",
      headers: {
        cookie,
        "x-haaabit-now": "2026-03-11T10:00:00.000Z",
      },
      payload: {
        habitId: quantityHabit.id,
        source: "web",
      },
    });

    expect(undoResponse.statusCode).toBe(409);
    expect(undoResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
    });
  });
});
