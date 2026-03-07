import { describe, expect, it } from "vitest";

import { createTestContext, signUp } from "../helpers/app";

describe("habit routes", () => {
  it("creates and lists habits for the authenticated user", async () => {
    const context = await createTestContext();

    try {
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
          },
        ],
      });
    } finally {
      await context.cleanup();
    }
  });
});
