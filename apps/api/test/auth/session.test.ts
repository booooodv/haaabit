import { createTestContext, signUp } from "../helpers/app";

describe("session validation", () => {
  it("rejects unauthenticated access to the session route", async () => {
    const { app, cleanup } = await createTestContext();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/session",
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        code: "UNAUTHORIZED",
      });
    } finally {
      await cleanup();
    }
  });

  it("returns the authenticated user from a validated session", async () => {
    const { app, cleanup } = await createTestContext();

    try {
      const signUpResult = await signUp(app);

      const response = await app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: signUpResult.cookie,
        },
      });

      expect(signUpResult.response.statusCode).toBe(200);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        user: {
          email: "alice@example.com",
          name: "Alice",
        },
      });
    } finally {
      await cleanup();
    }
  });
});
