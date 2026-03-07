import fastify, { type FastifyInstance } from "fastify";

import type { PrismaClient } from "./generated/prisma/client";
import { registerAuth } from "./auth/auth";
import { AuthSessionError, assertOwnsUser, requireSession } from "./auth/session";
import { registerCors } from "./plugins/cors";
import { registerDb } from "./plugins/db";
import { registerEnv } from "./plugins/env";

type CreateAppOptions = {
  env?: Partial<NodeJS.ProcessEnv>;
  logger?: boolean;
  prisma?: PrismaClient;
};

function sendAuthError(reply: FastifyInstance["reply"], error: AuthSessionError): void {
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

if (process.argv[1]?.endsWith("server.ts")) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
