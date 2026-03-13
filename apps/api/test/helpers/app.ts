import { execFileSync } from "node:child_process";
import { closeSync, openSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { FastifyInstance } from "fastify";

import { createApp } from "../../src/server";

const TEST_SECRET = "test-secret-with-at-least-thirty-two-characters";
const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(THIS_DIR, "../../../../");
const SCHEMA_PATH = "prisma/schema.prisma";
export type TestContext = {
  app: FastifyInstance;
  cleanup: () => Promise<void>;
};

function normalizeCookie(setCookie: string | string[] | undefined): string {
  if (!setCookie) {
    throw new Error("Missing set-cookie header");
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  return values.map((value) => value.split(";")[0]).join("; ");
}

export async function createTestContext(): Promise<TestContext> {
  const databasePath = join("/tmp", `haaabit-auth-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  const databaseUrl = `file:${databasePath}`;
  closeSync(openSync(databasePath, "w"));

  execFileSync(
    "pnpm",
    ["exec", "prisma", "db", "push", "--config", "prisma.config.ts", "--schema", SCHEMA_PATH, "--url", databaseUrl],
    {
      cwd: REPO_ROOT,
      stdio: "pipe",
    },
  );

  const app = await createApp({
    env: {
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      BETTER_AUTH_SECRET: TEST_SECRET,
      BETTER_AUTH_URL: "http://127.0.0.1:3001",
      CORS_ORIGIN: "http://localhost:3000",
    },
  });

  return {
    app,
    cleanup: async () => {
      await app.close();
      rmSync(databasePath, { force: true });
    },
  };
}

export async function signUp(
  app: FastifyInstance,
  overrides: Partial<{ email: string; password: string; name: string; timezone: string }> = {},
) {
  const email = overrides.email ?? "alice@example.com";
  const password = overrides.password ?? "password123";
  const name = overrides.name ?? "Alice";

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: {
      email,
      password,
      name,
      ...(overrides.timezone ? { timezone: overrides.timezone } : {}),
    },
  });

  return {
    response,
    cookie: normalizeCookie(response.headers["set-cookie"]),
    body: response.json() as {
      user: { id: string; email: string; name: string };
    },
  };
}

export async function signIn(
  app: FastifyInstance,
  credentials: {
    email?: string;
    password?: string;
  } = {},
) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    payload: {
      email: credentials.email ?? "alice@example.com",
      password: credentials.password ?? "password123",
    },
  });

  return {
    response,
    cookie: normalizeCookie(response.headers["set-cookie"]),
  };
}

export async function signOut(app: FastifyInstance, cookie: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/sign-out",
    headers: {
      cookie,
    },
  });
}
