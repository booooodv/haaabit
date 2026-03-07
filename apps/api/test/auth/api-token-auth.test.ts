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

describe("api token auth", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("issues a personal api token for the signed-in user and accepts it across habits, today, and stats routes", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      frequency: {
        type: "daily",
      },
    });

    const issueResponse = await context.app.inject({
      method: "POST",
      url: "/api/api-access/token/reset",
      headers: {
        cookie,
      },
    });

    expect(issueResponse.statusCode).toBe(200);
    expect(issueResponse.json()).toMatchObject({
      token: expect.stringMatching(/^haaabit_/),
      docsPath: "/api/docs",
      specPath: "/api/openapi.json",
    });

    const token = (issueResponse.json() as { token: string }).token;

    const habitsResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(habitsResponse.statusCode).toBe(200);
    expect(habitsResponse.json()).toMatchObject({
      items: [
        expect.objectContaining({
          id: habit.id,
          userId: body.user.id,
          name: "Read",
        }),
      ],
    });

    const todayResponse = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(todayResponse.statusCode).toBe(200);
    expect(todayResponse.json()).toMatchObject({
      summary: {
        date: "2026-03-11",
      },
    });

    const statsResponse = await context.app.inject({
      method: "GET",
      url: "/api/stats/overview",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(statsResponse.statusCode).toBe(200);
    expect(statsResponse.json()).toMatchObject({
      overview: {
        date: "2026-03-11",
      },
    });
  });

  it("returns 401 for invalid bearer tokens", async () => {
    context = await createTestContext();
    await signUp(context.app);

    const response = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: "Bearer haaabit_invalid-token",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns the current token for the signed-in user without rotating it on read", async () => {
    context = await createTestContext();
    const { cookie } = await signUp(context.app);

    const resetResponse = await context.app.inject({
      method: "POST",
      url: "/api/api-access/token/reset",
      headers: {
        cookie,
      },
    });

    expect(resetResponse.statusCode).toBe(200);
    const firstToken = (resetResponse.json() as { token: string }).token;

    const readResponse = await context.app.inject({
      method: "GET",
      url: "/api/api-access/token",
      headers: {
        cookie,
      },
    });

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json()).toMatchObject({
      token: firstToken,
      docsPath: "/api/docs",
      specPath: "/api/openapi.json",
    });
  });
});
