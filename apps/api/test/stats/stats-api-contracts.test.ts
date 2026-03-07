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

describe("stats api contracts", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("supports overview statistics through bearer auth", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);
    const token = await issueApiToken(context, cookie);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    await context.app.db.habitDayState.createMany({
      data: [
        { habitId: habit.id, dateKey: "2026-03-09", completed: true },
        { habitId: habit.id, dateKey: "2026-03-10", completed: true },
      ],
    });

    const response = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      overview: {
        date: "2026-03-11",
        metrics: {
          activeHabitCount: 1,
        },
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-09",
            }),
          ]),
        },
        stabilityRanking: [
          expect.objectContaining({
            habitId: habit.id,
            name: "Read",
          }),
        ],
      },
    });
  });
});
