import { describe, expect, it } from "vitest";

import { createTestContext, signIn, signOut, signUp } from "../helpers/app";

describe("auth flow", () => {
  it("supports sign up, sign out, and sign back in", async () => {
    const context = await createTestContext();

    try {
      const { response: signUpResponse, cookie: signUpCookie, body } = await signUp(context.app);
      expect(signUpResponse.statusCode).toBe(200);
      expect(body.user.email).toBe("alice@example.com");

      const sessionResponse = await context.app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: signUpCookie,
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const signOutResponse = await signOut(context.app, signUpCookie);
      expect(signOutResponse.statusCode).toBe(200);

      const signedOutSession = await context.app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: signUpCookie,
        },
      });

      expect(signedOutSession.statusCode).toBe(401);

      const { response: signInResponse, cookie: signInCookie } = await signIn(context.app);
      expect(signInResponse.statusCode).toBe(200);

      const signedInSession = await context.app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: signInCookie,
        },
      });

      expect(signedInSession.statusCode).toBe(200);
    } finally {
      await context.cleanup();
    }
  });
});
