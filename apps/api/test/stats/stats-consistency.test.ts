import { afterEach, describe, expect, it } from "vitest";

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
      today: "2026-03-01",
    },
  );
}

function getHeaders(cookie: string, now = "2026-03-11T12:00:00.000Z") {
  return {
    cookie,
    "x-haaabit-now": now,
  };
}

describe("stats consistency", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("keeps overview metrics and habit trends aligned after complete, set-total, and undo mutations", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const walkHabit = await createOwnedHabit(context, body.user.id, {
      name: "Morning walk",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });
    const readHabit = await createOwnedHabit(context, body.user.id, {
      name: "Read pages",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
      startDate: "2026-03-01",
    });

    const baselineOverview = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: getHeaders(cookie),
    });

    expect(baselineOverview.statusCode).toBe(200);
    expect(baselineOverview.json()).toMatchObject({
      overview: {
        metrics: {
          todayCompletedCount: 0,
          todayCompletionRate: 0,
          weeklyCompletionRate: 0,
          activeHabitCount: 2,
        },
      },
    });

    const completeWalk = await context.app.inject({
      method: "POST",
      url: "/api/today/complete",
      headers: getHeaders(cookie, "2026-03-11T08:00:00.000Z"),
      payload: {
        habitId: walkHabit.id,
        source: "web",
      },
    });

    expect(completeWalk.statusCode).toBe(200);

    const afterWalkOverview = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: getHeaders(cookie),
    });

    expect(afterWalkOverview.json()).toMatchObject({
      overview: {
        metrics: {
          todayCompletedCount: 1,
          todayCompletionRate: 0.5,
          weeklyCompletionRate: 0.17,
          activeHabitCount: 2,
        },
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              completedCount: 1,
              totalCount: 2,
              completionRate: 0.5,
            }),
          ]),
        },
      },
    });

    const partialRead = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: getHeaders(cookie, "2026-03-11T09:00:00.000Z"),
      payload: {
        habitId: readHabit.id,
        total: 5,
        source: "web",
      },
    });

    expect(partialRead.statusCode).toBe(200);

    const partialReadDetail = await context.app.inject({
      method: "GET",
      url: `/api/habits/${readHabit.id}`,
      headers: getHeaders(cookie),
    });

    expect(partialReadDetail.statusCode).toBe(200);
    expect(partialReadDetail.json()).toMatchObject({
      item: {
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              status: "pending",
              completionRate: 0,
              completedCount: 0,
              completionTarget: 1,
              value: 5,
              valueTarget: 10,
            }),
          ]),
        },
      },
    });

    const completeRead = await context.app.inject({
      method: "POST",
      url: "/api/today/set-total",
      headers: getHeaders(cookie, "2026-03-11T10:00:00.000Z"),
      payload: {
        habitId: readHabit.id,
        total: 10,
        source: "web",
      },
    });

    expect(completeRead.statusCode).toBe(200);

    const completedOverview = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: getHeaders(cookie),
    });

    expect(completedOverview.json()).toMatchObject({
      overview: {
        metrics: {
          todayCompletedCount: 2,
          todayCompletionRate: 1,
          weeklyCompletionRate: 0.33,
          activeHabitCount: 2,
        },
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              completedCount: 2,
              totalCount: 2,
              completionRate: 1,
            }),
          ]),
        },
      },
    });

    const completedReadDetail = await context.app.inject({
      method: "GET",
      url: `/api/habits/${readHabit.id}`,
      headers: getHeaders(cookie),
    });

    expect(completedReadDetail.json()).toMatchObject({
      item: {
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              status: "completed",
              completionRate: 1,
              completedCount: 1,
              completionTarget: 1,
              value: 10,
              valueTarget: 10,
            }),
          ]),
        },
      },
    });

    const undoRead = await context.app.inject({
      method: "POST",
      url: "/api/today/undo",
      headers: getHeaders(cookie, "2026-03-11T10:05:00.000Z"),
      payload: {
        habitId: readHabit.id,
        source: "web",
      },
    });

    expect(undoRead.statusCode).toBe(200);

    const undoneOverview = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: getHeaders(cookie),
    });
    const undoneReadDetail = await context.app.inject({
      method: "GET",
      url: `/api/habits/${readHabit.id}`,
      headers: getHeaders(cookie),
    });

    expect(undoneOverview.json()).toMatchObject({
      overview: {
        metrics: {
          todayCompletedCount: 1,
          todayCompletionRate: 0.5,
          weeklyCompletionRate: 0.17,
          activeHabitCount: 2,
        },
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              completedCount: 1,
              totalCount: 2,
              completionRate: 0.5,
            }),
          ]),
        },
      },
    });
    expect(undoneReadDetail.json()).toMatchObject({
      item: {
        trends: {
          last7Days: expect.arrayContaining([
            expect.objectContaining({
              date: "2026-03-11",
              status: "pending",
              completionRate: 0,
              completedCount: 0,
              completionTarget: 1,
              value: 5,
              valueTarget: 10,
            }),
          ]),
        },
      },
    });
  });
});
