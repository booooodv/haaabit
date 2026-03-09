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

describe("habit routes", () => {
  let context: TestContext | undefined;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = undefined;
    }
  });

  it("creates and lists habits for the authenticated user", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const createResponse = await context.app.inject({
      method: "POST",
      url: "/api/habits",
      headers: {
        cookie,
      },
      payload: {
        name: "Walk the dog",
        frequency: {
          type: "daily",
        },
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      item: {
        userId: body.user.id,
        name: "Walk the dog",
        kind: "boolean",
        frequencyType: "daily",
      },
    });

    const listResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        cookie,
      },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      items: [
        {
          userId: body.user.id,
          name: "Walk the dog",
          kind: "boolean",
          frequencyType: "daily",
          isActive: true,
        },
      ],
    });
  });

  it("filters active and archived habits through API query params", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

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
        type: "daily",
      },
    });

    const archiveResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${walk.id}/archive`,
      headers: {
        cookie,
      },
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toMatchObject({
      item: {
        id: walk.id,
        isActive: false,
      },
    });

    const activeHealthResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits?status=active&category=health",
      headers: {
        cookie,
      },
    });

    expect(activeHealthResponse.statusCode).toBe(200);
    expect(
      (activeHealthResponse.json() as { items: Array<{ id: string }> }).items.map((habit) => habit.id),
    ).toEqual([yoga.id]);

    const archivedSearchResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits?status=archived&query=outside",
      headers: {
        cookie,
      },
    });

    expect(archivedSearchResponse.statusCode).toBe(200);
    expect(
      (archivedSearchResponse.json() as { items: Array<{ id: string }> }).items.map((habit) => habit.id),
    ).toEqual([walk.id]);

    const quantityResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits?status=active&kind=quantity",
      headers: {
        cookie,
      },
    });

    expect(quantityResponse.statusCode).toBe(200);
    expect(quantityResponse.json()).toMatchObject({
      items: [
        {
          name: "Read Fiction",
          kind: "quantity",
        },
      ],
    });
  });

  it("updates editable fields, rejects kind changes, and blocks archived updates", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Read",
      kind: "quantity",
      targetValue: 10,
      unit: "pages",
      frequency: {
        type: "daily",
      },
    });

    const updateResponse = await context.app.inject({
      method: "PATCH",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie,
      },
      payload: {
        name: "Read Deep Work",
        category: "learning",
        description: "Focused reading",
        targetValue: 15,
        unit: "minutes",
        startDate: "2026-03-05",
        frequency: {
          type: "weekdays",
          days: ["monday", "wednesday", "friday"],
        },
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      item: {
        id: habit.id,
        kind: "quantity",
        name: "Read Deep Work",
        category: "learning",
        description: "Focused reading",
        targetValue: 15,
        unit: "minutes",
        startDate: "2026-03-05",
        frequencyType: "weekdays",
        weekdays: ["monday", "wednesday", "friday"],
      },
    });

    const kindChangeResponse = await context.app.inject({
      method: "PATCH",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie,
      },
      payload: {
        kind: "boolean",
      },
    });

    expect(kindChangeResponse.statusCode).toBe(400);
    expect(kindChangeResponse.json()).toMatchObject({
      code: "BAD_REQUEST",
    });

    await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/archive`,
      headers: {
        cookie,
      },
    });

    const archivedUpdateResponse = await context.app.inject({
      method: "PATCH",
      url: `/api/habits/${habit.id}`,
      headers: {
        cookie,
      },
      payload: {
        name: "This should fail",
      },
    });

    expect(archivedUpdateResponse.statusCode).toBe(409);
    expect(archivedUpdateResponse.json()).toMatchObject({
      code: "HABIT_INACTIVE",
    });
  });

  it("restores archived habits and enforces ownership on management actions", async () => {
    context = await createTestContext();
    const firstUser = await signUp(context.app);
    const secondUser = await signUp(context.app, {
      email: "bob@example.com",
      name: "Bob",
    });

    const firstHabit = await createOwnedHabit(context, firstUser.body.user.id, {
      name: "Walk the dog",
      frequency: {
        type: "daily",
      },
    });

    await context.app.inject({
      method: "POST",
      url: "/api/today/complete",
      headers: {
        cookie: firstUser.cookie,
        "x-haaabit-now": "2026-03-11T08:00:00.000Z",
      },
      payload: {
        habitId: firstHabit.id,
        source: "web",
      },
    });

    const forbiddenArchive = await context.app.inject({
      method: "POST",
      url: `/api/habits/${firstHabit.id}/archive`,
      headers: {
        cookie: secondUser.cookie,
      },
    });

    expect(forbiddenArchive.statusCode).toBe(404);

    const archiveResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${firstHabit.id}/archive`,
      headers: {
        cookie: firstUser.cookie,
      },
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toMatchObject({
      item: {
        id: firstHabit.id,
        isActive: false,
      },
    });

    const todayResponse = await context.app.inject({
      method: "GET",
      url: "/api/today",
      headers: {
        cookie: firstUser.cookie,
        "x-haaabit-now": "2026-03-11T08:30:00.000Z",
      },
    });

    expect(todayResponse.statusCode).toBe(200);
    expect(todayResponse.json()).toMatchObject({
      summary: {
        pendingItems: [],
        completedItems: [],
      },
    });

    const history = await context.app.db.habitDayState.findUnique({
      where: {
        habitId_dateKey: {
          habitId: firstHabit.id,
          dateKey: "2026-03-11",
        },
      },
    });

    expect(history?.completed).toBe(true);

    const restoreResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${firstHabit.id}/restore`,
      headers: {
        cookie: firstUser.cookie,
      },
    });

    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreResponse.json()).toMatchObject({
      item: {
        id: firstHabit.id,
        isActive: true,
      },
    });
  });

  it("accepts archive and restore requests with application/json headers and an empty body", async () => {
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app);

    const habit = await createOwnedHabit(context, body.user.id, {
      name: "Walk the dog",
      frequency: {
        type: "daily",
      },
    });

    const archiveResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/archive`,
      headers: {
        cookie,
        "content-type": "application/json",
      },
      payload: "",
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toMatchObject({
      item: {
        id: habit.id,
        isActive: false,
      },
    });

    const restoreResponse = await context.app.inject({
      method: "POST",
      url: `/api/habits/${habit.id}/restore`,
      headers: {
        cookie,
        "content-type": "application/json",
      },
      payload: "",
    });

    expect(restoreResponse.statusCode).toBe(200);
    expect(restoreResponse.json()).toMatchObject({
      item: {
        id: habit.id,
        isActive: true,
      },
    });
  });
});
