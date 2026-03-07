import { createTestContext, signUp } from "../helpers/app";

describe("ownership enforcement", () => {
  it("rejects access when the route user id does not match the session user", async () => {
    const { app, cleanup } = await createTestContext();

    try {
      const alice = await signUp(app, {
        email: "alice@example.com",
        name: "Alice",
      });
      const bob = await signUp(app, {
        email: "bob@example.com",
        name: "Bob",
      });

      const forbiddenResponse = await app.inject({
        method: "GET",
        url: `/api/users/${bob.body.user.id}/ownership`,
        headers: {
          cookie: alice.cookie,
        },
      });

      const allowedResponse = await app.inject({
        method: "GET",
        url: `/api/users/${alice.body.user.id}/ownership`,
        headers: {
          cookie: alice.cookie,
        },
      });

      expect(forbiddenResponse.statusCode).toBe(403);
      expect(forbiddenResponse.json()).toMatchObject({
        code: "FORBIDDEN",
      });
      expect(allowedResponse.statusCode).toBe(200);
      expect(allowedResponse.json()).toEqual({ ok: true });
    } finally {
      await cleanup();
    }
  });
});
