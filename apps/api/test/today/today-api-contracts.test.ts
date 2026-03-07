import { afterEach, describe, expect, it } from "vitest";

import { createHabit } from "../../src/modules/habits/habit.service";
import { createTestContext, signUp, type TestContext } from "../helpers/app";

async function issueApiToken(context: TestContext, cookie: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/api/api-access/token/reset",
    headers: {
      cookie,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(`Unable to issue api token: ${response.statusCode}`);
  }

  return (response.json() as { token: string }).token;
}

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

describe("today api contracts", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("supports today summary and action routes through bearer auth", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);
    const token = await issueApiToken(context, cookie);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });

    const summaryResponse = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T08:00:00.000Z",
      },
    });

    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toMatchObject({
      summary: {
        date: "2026-03-11",
        pendingItems: [
          expect.objectContaining({
            habitId: habit.id,
            status: "pending",
          }),
        ],
      },
    });

    const setTotalResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T09:00:00.000Z",
      },
      payload: {
        habitId: habit.id,
        total: 10,
        source: "ai",
      },
    });

    expect(setTotalResponse.statusCode).toBe(200);
    expect(setTotalResponse.json()).toMatchObject({
      affectedHabit: {
        id: habit.id,
      },
      summary: {
        completedItems: [
          expect.objectContaining({
            habitId: habit.id,
            status: "completed",
          }),
        ],
      },
    });

    const undoResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/undo",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T09:05:00.000Z",
      },
      payload: {
        habitId: habit.id,
        source: "ai",
      },
    });

    expect(undoResponse.statusCode).toBe(200);
    expect(undoResponse.json()).toMatchObject({
      affectedHabit: {
        id: habit.id,
      },
      summary: {
        pendingItems: [
          expect.objectContaining({
            habitId: habit.id,
            status: "pending",
          }),
        ],
      },
    });

    const invalidActionResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/complete",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T09:10:00.000Z",
      },
      payload: {
        habitId: habit.id,
        source: "ai",
      },
    });

    expect(invalidActionResponse.statusCode).toBe(400);
    expect(invalidActionResponse.json()).toMatchObject({
      code: "BAD_REQUEST",
      message: "Only boolean habits can use complete",
    });

    await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/archive`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const archivedActionResponse = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T09:15:00.000Z",
      },
      payload: {
        habitId: habit.id,
        total: 4,
        source: "ai",
      },
    });

    expect(archivedActionResponse.statusCode).toBe(409);
    expect(archivedActionResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
      message: "Archived habits are read-only until restored",
    });
  });
});
