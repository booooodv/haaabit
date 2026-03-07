import { afterEach, describe, expect, it } from "vitest";

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

describe("habit api contracts", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("supports list/detail/create/update/archive/restore through bearer auth with full resource payloads", async () => {
    context = await createTestContext();
    const { cookie } = await signUp(context.app);
    const token = await issueApiToken(context, cookie);

    const createResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: "Deep Work",
        kind: "quantity",
        targetValue: 4,
        unit: "blocks",
        category: "focus",
        frequency: {
          type: "daily",
        },
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      item: {
        name: "Deep Work",
        kind: "quantity",
        targetValue: 4,
        unit: "blocks",
        category: "focus",
        frequencyType: "daily",
        isActive: true,
      },
    });

    const habitId = (createResponse.json() as { item: { id: string } }).item.id;

    const detailResponse = await context.app.inject({
      method: "GET",
      url: `/api/habits/${habitId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json()).toMatchObject({
      item: {
        habit: {
          id: habitId,
          name: "Deep Work",
        },
      },
    });

    const updateResponse = await context.app.inject({
      method: "PATCH",
      url: `/api/habits/${habitId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: "Deep Work PM",
        targetValue: 5,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      item: {
        id: habitId,
        name: "Deep Work PM",
        targetValue: 5,
      },
    });

    const archiveResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habitId}/archive`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toMatchObject({
      item: {
        id: habitId,
        isActive: false,
      },
    });

    const restoreResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habitId}/restore`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreResponse.json()).toMatchObject({
      item: {
        id: habitId,
        isActive: true,
      },
    });

    const listResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        expect.objectContaining({
          id: habitId,
          name: "Deep Work PM",
          targetValue: 5,
          isActive: true,
        }),
      ],
    });

    const invalidCreateResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: "Invalid quantity habit",
        kind: "quantity",
        frequency: {
          type: "daily",
        },
      },
    });

    expect(invalidCreateResponse.statusCode).toBe(400);
    expect(invalidCreateResponse.json()).toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid habit payload",
      issues: {
        fieldErrors: {
          targetValue: expect.any(Array),
        },
      },
    });

    const missingHabitResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits/does-not-exist",
      headers: {
        authorization: `Bearer ${token}`,
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
    });

    expect(missingHabitResponse.statusCode).toBe(404);
    expect(missingHabitResponse.json()).toMatchObject({
      code: "NOT_FOUND",
      message: "Habit not found",
    });
  });
});
