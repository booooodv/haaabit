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

  it("stores the requested timezone on sign up and defaults missing timezone to Asia/Shanghai", async () => {
    const context = await createTestContext();

    try {
      const shanghaiUser = await signUp(context.app, {
        email: "shanghai@example.com",
        name: "Shanghai User",
        timezone: "Asia/Shanghai",
      });

      const storedShanghaiUser = await context.app.db.user.findUniqueOrThrow({
        where: {
          id: shanghaiUser.body.user.id,
        },
        select: {
          timezone: true,
        },
      });

      expect(storedShanghaiUser.timezone).toBe("Asia/Shanghai");

      const defaultUser = await signUp(context.app, {
        email: "default@example.com",
        name: "Default User",
      });

      const storedDefaultUser = await context.app.db.user.findUniqueOrThrow({
        where: {
          id: defaultUser.body.user.id,
        },
        select: {
          timezone: true,
        },
      });

      expect(storedDefaultUser.timezone).toBe("Asia/Shanghai");
    } finally {
      await context.cleanup();
    }
  });

  it("marks the first registered user as admin and lets that admin disable future registration", async () => {
    const context = await createTestContext();

    try {
      const publicBefore = await context.app.inject({
        method: "GET",
        url: "/api/auth/registration",
      });

      expect(publicBefore.statusCode).toBe(200);
      expect(publicBefore.json()).toMatchObject({
        registrationEnabled: true,
        hasUsers: false,
      });

      const { cookie: adminCookie } = await signUp(context.app, {
        email: "admin@example.com",
        name: "Admin",
      });

      const sessionResponse = await context.app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: adminCookie,
        },
      });

      expect(sessionResponse.statusCode).toBe(200);
      expect(sessionResponse.json()).toMatchObject({
        user: {
          email: "admin@example.com",
          isAdmin: true,
        },
      });

      const adminSettingsResponse = await context.app.inject({
        method: "GET",
        url: "/api/admin/registration",
        headers: {
          cookie: adminCookie,
        },
      });

      expect(adminSettingsResponse.statusCode).toBe(200);
      expect(adminSettingsResponse.json()).toMatchObject({
        registrationEnabled: true,
      });

      const disableResponse = await context.app.inject({
        method: "POST",
        url: "/api/admin/registration",
        headers: {
          cookie: adminCookie,
        },
        payload: {
          registrationEnabled: false,
        },
      });

      expect(disableResponse.statusCode).toBe(200);
      expect(disableResponse.json()).toMatchObject({
        registrationEnabled: false,
      });

      const publicAfter = await context.app.inject({
        method: "GET",
        url: "/api/auth/registration",
      });

      expect(publicAfter.statusCode).toBe(200);
      expect(publicAfter.json()).toMatchObject({
        registrationEnabled: false,
        hasUsers: true,
      });

      const blockedSignUp = await context.app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        payload: {
          email: "blocked@example.com",
          password: "password123",
          name: "Blocked",
        },
      });

      expect(blockedSignUp.statusCode).toBe(403);
      expect(blockedSignUp.json()).toMatchObject({
        code: "FORBIDDEN",
        message: "Registration is currently disabled",
      });
    } finally {
      await context.cleanup();
    }
  });

  it("backfills the oldest existing user as admin after upgrading from a legacy database", async () => {
    const context = await createTestContext();

    try {
      const { cookie: firstCookie } = await signUp(context.app, {
        email: "legacy-owner@example.com",
        name: "Legacy Owner",
      });

      await signUp(context.app, {
        email: "legacy-member@example.com",
        name: "Legacy Member",
      });

      await context.app.db.user.updateMany({
        data: {
          isAdmin: false,
        },
      });

      const firstSessionResponse = await context.app.inject({
        method: "GET",
        url: "/api/session",
        headers: {
          cookie: firstCookie,
        },
      });

      expect(firstSessionResponse.statusCode).toBe(200);
      expect(firstSessionResponse.json()).toMatchObject({
        user: {
          email: "legacy-owner@example.com",
          isAdmin: true,
        },
      });

      const adminSettingsResponse = await context.app.inject({
        method: "GET",
        url: "/api/admin/registration",
        headers: {
          cookie: firstCookie,
        },
      });

      expect(adminSettingsResponse.statusCode).toBe(200);
      expect(adminSettingsResponse.json()).toMatchObject({
        registrationEnabled: true,
      });

      const users = await context.app.db.user.findMany({
        orderBy: {
          createdAt: "asc",
        },
        select: {
          email: true,
          isAdmin: true,
        },
      });

      expect(users).toEqual([
        {
          email: "legacy-owner@example.com",
          isAdmin: true,
        },
        {
          email: "legacy-member@example.com",
          isAdmin: false,
        },
      ]);
    } finally {
      await context.cleanup();
    }
  });
});
