import fastify, { type FastifyInstance, type FastifyReply } from "fastify";
import { pathToFileURL } from "node:url";

import type { PrismaClient } from "./generated/prisma/client";
import { API_DOCS_PATH, API_SPEC_PATH, getPersonalApiToken, resetPersonalApiToken } from "./auth/api-token";
import { registerAuth } from "./auth/auth";
import { AuthSessionError, assertOwnsUser, requireSession } from "./auth/session";
import { registerHabitRoutes } from "./modules/habits/habit.routes";
import { registerStatsRoutes } from "./modules/stats/stats.routes";
import { registerTodayRoutes } from "./modules/today/today.routes";
import { registerCors } from "./plugins/cors";
import { registerDb } from "./plugins/db";
import { registerEnv } from "./plugins/env";
import { registerOpenApi } from "./plugins/openapi";

type CreateAppOptions = {
  env?: Partial<NodeJS.ProcessEnv>;
  logger?: boolean;
  prisma?: PrismaClient;
};

function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = fastify({
    logger: options.logger ?? false,
  });

  await registerEnv(app, options.env);
  await registerDb(app, options.prisma);
  await registerCors(app);
  await registerAuth(app);
  await registerHabitRoutes(app);
  await registerStatsRoutes(app);
  await registerTodayRoutes(app);
  await registerOpenApi(app);

  app.get("/health", async () => ({ ok: true }));

  app.all("/api/auth/*", async (request, reply) => {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    const headers = new Headers();

    Object.entries(request.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(key, entry));
      } else if (value) {
        headers.append(key, String(value));
      }
    });

    const authRequest = new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    const response = await app.auth.handler(authRequest);

    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    reply.send(response.body ? await response.text() : null);
  });

  app.get("/api/session", async (request, reply) => {
    try {
      const session = await requireSession(request);

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      throw error;
    }
  });

  app.get("/api/users/:userId/ownership", async (request, reply) => {
    try {
      const session = await requireSession(request);
      assertOwnsUser(session, (request.params as { userId: string }).userId);

      return { ok: true };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      throw error;
    }
  });

  app.get("/api/api-access/token", async (request, reply) => {
    try {
      const session = await requireSession(request);
      const currentToken = await getPersonalApiToken(app.db, session.user.id);

      return {
        token: currentToken?.token ?? null,
        docsPath: API_DOCS_PATH,
        specPath: API_SPEC_PATH,
      };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      throw error;
    }
  });

  app.post("/api/api-access/token/reset", async (request, reply) => {
    try {
      const session = await requireSession(request);
      const token = await resetPersonalApiToken(app.db, session.user.id);

      return {
        token: token.token,
        docsPath: API_DOCS_PATH,
        specPath: API_SPEC_PATH,
      };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      throw error;
    }
  });

  await app.ready();

  return app;
}

async function start() {
  const app = await createApp();
  await app.listen({
    port: app.env.PORT,
    host: "0.0.0.0",
  });
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint) && import.meta.url === pathToFileURL(entrypoint).href;
}

if (isDirectExecution()) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
