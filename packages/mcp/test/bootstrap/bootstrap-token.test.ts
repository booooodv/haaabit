import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { bootstrapPersonalApiToken } from "../../src/bootstrap/token";
import { formatBootstrapError } from "../../src/config/env";

const packageRoot = path.resolve(import.meta.dirname, "../..");
const workspaceRoot = path.resolve(packageRoot, "../..");

type ApiTestContext = {
  app: {
    db: {
      apiToken: {
        findUnique: (options: { where: { userId: string } }) => Promise<{
          token: string;
        } | null>;
      };
    };
    inject: (options: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      payload?: unknown;
    }) => Promise<{
      statusCode?: number;
      json: () => unknown;
    }>;
    listen: (options: { port: number; host: string }) => Promise<string>;
  };
  cleanup: () => Promise<void>;
};

type ApiTestHelpers = {
  createTestContext: () => Promise<ApiTestContext>;
  signUp: (
    app: unknown,
    overrides?: Partial<{ email: string; password: string; name: string }>,
  ) => Promise<{
    cookie: string;
    body: {
      user: {
        id: string;
        email: string;
        name: string;
      };
    };
  }>;
};

async function loadApiTestHelpers(): Promise<ApiTestHelpers> {
  const helpersPath = pathToFileURL(path.resolve(workspaceRoot, "apps/api/test/helpers/app.ts")).href;

  return import(helpersPath) as Promise<ApiTestHelpers>;
}

async function startApiServer(context: ApiTestContext) {
  return context.app.listen({
    port: 0,
    host: "127.0.0.1",
  });
}

describe("bootstrapPersonalApiToken", () => {
  let context: ApiTestContext | null = null;

  afterEach(async () => {
    if (context) {
      await context.cleanup();
      context = null;
    }
  });

  it("signs in with account credentials and mints a personal API token through the existing reset route", async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    context = await createTestContext();
    const { body } = await signUp(context.app, {
      email: "bootstrap@example.com",
      password: "password123",
      name: "Bootstrap User",
    });
    const baseUrl = await startApiServer(context);

    const result = await bootstrapPersonalApiToken({
      apiUrl: `${baseUrl}/api`,
      email: body.user.email,
      password: "password123",
      force: false,
    });

    expect(result.token.startsWith("haaabit_")).toBe(true);
    expect(result.rotatedExistingToken).toBe(false);

    const storedToken = await context.app.db.apiToken.findUnique({
      where: {
        userId: body.user.id,
      },
    });

    expect(storedToken?.token).toBeTruthy();
    expect(storedToken?.token).not.toBe(result.token);
    expect(storedToken?.token.startsWith("haaabit_")).toBe(false);
  });

  it("requires --force semantics before rotating an existing personal API token", async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app, {
      email: "force@example.com",
      password: "password123",
      name: "Force User",
    });
    const firstReset = await context.app.inject({
      method: "POST",
      url: "/api/api-access/token/reset",
      headers: {
        cookie,
      },
    });
    const originalToken = (firstReset.json() as { token: string }).token;
    const baseUrl = await startApiServer(context);

    await expect(
      bootstrapPersonalApiToken({
        apiUrl: `${baseUrl}/api`,
        email: body.user.email,
        password: "password123",
        force: false,
      }),
    ).rejects.toThrowError(/--force/);

    const currentRecord = await context.app.db.apiToken.findUnique({
      where: {
        userId: body.user.id,
      },
    });
    expect(currentRecord?.token).toBeTruthy();

    const authenticatedWithOriginal = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${originalToken}`,
      },
    });
    expect(authenticatedWithOriginal.statusCode).toBe(200);
  });

  it("rotates the current token when bootstrap runs with force", async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    context = await createTestContext();
    const { body, cookie } = await signUp(context.app, {
      email: "rotate@example.com",
      password: "password123",
      name: "Rotate User",
    });
    const firstReset = await context.app.inject({
      method: "POST",
      url: "/api/api-access/token/reset",
      headers: {
        cookie,
      },
    });
    const originalToken = (firstReset.json() as { token: string }).token;
    const baseUrl = await startApiServer(context);

    const result = await bootstrapPersonalApiToken({
      apiUrl: `${baseUrl}/api`,
      email: body.user.email,
      password: "password123",
      force: true,
    });

    expect(result.rotatedExistingToken).toBe(true);
    expect(result.token).not.toBe(originalToken);

    const originalResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${originalToken}`,
      },
    });
    const currentResponse = await context.app.inject({
      method: "GET",
      url: "/api/habits",
      headers: {
        authorization: `Bearer ${result.token}`,
      },
    });

    expect(originalResponse.statusCode).toBe(401);
    expect(currentResponse.statusCode).toBe(200);
  });

  it("redacts bootstrap failures so passwords do not leak into helper or stderr output", async () => {
    const { createTestContext, signUp } = await loadApiTestHelpers();
    context = await createTestContext();
    const { body } = await signUp(context.app, {
      email: "failure@example.com",
      password: "password123",
      name: "Failure User",
    });
    const baseUrl = await startApiServer(context);

    await expect(
      bootstrapPersonalApiToken({
        apiUrl: `${baseUrl}/api`,
        email: body.user.email,
        password: "wrong-password",
        force: true,
      }),
    ).rejects.toThrowError(/invalid/i);

    try {
      await bootstrapPersonalApiToken({
        apiUrl: `${baseUrl}/api`,
        email: body.user.email,
        password: "wrong-password",
        force: true,
      });
    } catch (error) {
      const formatted = formatBootstrapError(error, {
        env: {
          HAAABIT_BOOTSTRAP_PASSWORD: "wrong-password",
        },
      });

      expect(String(error)).not.toContain("wrong-password");
      expect(formatted).not.toContain("wrong-password");
      return;
    }

    throw new Error("Expected bootstrapPersonalApiToken to fail");
  });
});
