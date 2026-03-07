import type { FastifyInstance } from "fastify";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import type { PrismaClient } from "../generated/prisma/client";
import type { AppEnv } from "../plugins/env";

export function createAuth(env: AppEnv, db: PrismaClient) {
  return betterAuth({
    appName: "haaabit",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.corsOrigins,
    database: prismaAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type AppAuth = ReturnType<typeof createAuth>;

declare module "fastify" {
  interface FastifyInstance {
    auth: AppAuth;
  }
}

export async function registerAuth(app: FastifyInstance): Promise<void> {
  app.decorate("auth", createAuth(app.env, app.db));
}
