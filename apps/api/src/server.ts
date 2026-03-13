import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import type { PrismaClient } from "./generated/prisma/client";
import {
  API_DOCS_PATH,
  API_SPEC_PATH,
  getPersonalApiToken,
  migrateLegacyPersonalApiTokens,
  resetPersonalApiToken,
} from "./auth/api-token";
import { registerAuth } from "./auth/auth";
import {
  getRegistrationStatus,
  isUserAdmin,
  makeFirstUserAdmin,
  promoteUserToAdmin,
  setRegistrationEnabled,
} from "./auth/registration";
import { AuthSessionError, assertOwnsUser, requireSession } from "./auth/session";
import { registerHabitRoutes } from "./modules/habits/habit.routes";
import { registerStatsRoutes } from "./modules/stats/stats.routes";
import { registerTodayRoutes } from "./modules/today/today.routes";
import { registerCors } from "./plugins/cors";
import { registerDb } from "./plugins/db";
import { registerEnv } from "./plugins/env";
import { registerOpenApi } from "./plugins/openapi";
import { normalizeUserTimeZone } from "./shared/timezone";
import { sendAuthError } from "./shared/controller-helpers";

type CreateAppOptions = {
  env?: Partial<NodeJS.ProcessEnv>;
  logger?: boolean;
  prisma?: PrismaClient;
};

function buildAuthProxyRequest(request: FastifyRequest) {
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const headers = new Headers();

  Object.entries(request.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else if (value) {
      headers.append(key, String(value));
    }
  });

  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
}

async function sendProxyResponse(reply: FastifyReply, response: Response) {
  const body = response.body ? await response.text() : null;

  reply.status(response.status);
  response.headers.forEach((value, key) => reply.header(key, value));
  reply.send(body);
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = fastify({
    logger: options.logger ?? false,
  });
  const defaultJsonParser = app.getDefaultJsonParser("ignore", "ignore");

  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
    const rawBody = typeof body === "string" ? body : body.toString("utf8");

    if (rawBody.trim().length === 0) {
      done(null, {});
      return;
    }

    defaultJsonParser(request, rawBody, done);
  });

  await registerEnv(app, options.env);
  await registerDb(app, options.prisma);
  await migrateLegacyPersonalApiTokens(app.db);
  await registerCors(app);
  await registerAuth(app);
  await registerHabitRoutes(app);
  await registerStatsRoutes(app);
  await registerTodayRoutes(app);
  await registerOpenApi(app);

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/auth/registration", async () => getRegistrationStatus(app.db));

  app.post("/api/auth/sign-up/email", async (request, reply) => {
    const status = await getRegistrationStatus(app.db);
    const payload =
      typeof request.body === "object" && request.body !== null
        ? (request.body as Record<string, unknown>)
        : undefined;
    const requestedTimeZone = typeof payload?.timezone === "string" ? payload.timezone : undefined;
    const timezone = normalizeUserTimeZone(requestedTimeZone);

    if (status.hasUsers && !status.registrationEnabled) {
      reply.status(403).send({
        code: "FORBIDDEN",
        message: "Registration is currently disabled",
      });
      return reply;
    }

    const response = await app.auth.handler(buildAuthProxyRequest(request));
    const body = response.body ? await response.text() : null;

    if (response.ok && body) {
      try {
        const parsed = JSON.parse(body) as { user?: { id?: string } };

        if (typeof parsed.user?.id === "string") {
          await app.db.user.update({
            where: {
              id: parsed.user.id,
            },
            data: {
              timezone,
            },
          });
          await makeFirstUserAdmin(app.db, parsed.user.id);
        }
      } catch {
        // Ignore non-JSON bodies from auth provider.
      }
    }

    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    reply.send(body);
  });

  app.all("/api/auth/*", async (request, reply) => {
    const response = await app.auth.handler(buildAuthProxyRequest(request));
    await sendProxyResponse(reply, response);
  });

  app.get("/api/session", async (request, reply) => {
    try {
      const session = await requireSession(request);

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isAdmin: await isUserAdmin(app.db, session.user.id),
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

  app.post("/api/test/session/promote-admin", async (request, reply) => {
    if (app.env.NODE_ENV !== "test") {
      reply.status(404).send({
        code: "NOT_FOUND",
        message: "Not found",
      });
      return reply;
    }

    try {
      const session = await requireSession(request);

      await promoteUserToAdmin(app.db, session.user.id);

      return {
        ok: true,
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

  app.get("/api/admin/registration", async (request, reply) => {
    try {
      const session = await requireSession(request);
      const admin = await isUserAdmin(app.db, session.user.id);

      if (!admin) {
        throw new AuthSessionError(403, "Forbidden");
      }

      const status = await getRegistrationStatus(app.db);

      return {
        registrationEnabled: status.registrationEnabled,
      };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      throw error;
    }
  });

  app.post("/api/admin/registration", async (request, reply) => {
    try {
      const session = await requireSession(request);
      const admin = await isUserAdmin(app.db, session.user.id);

      if (!admin) {
        throw new AuthSessionError(403, "Forbidden");
      }

      const parsed = z
        .object({
          registrationEnabled: z.boolean(),
        })
        .parse(request.body);

      const settings = await setRegistrationEnabled(app.db, parsed.registrationEnabled);

      return {
        registrationEnabled: settings.registrationEnabled,
      };
    } catch (error) {
      if (error instanceof AuthSessionError) {
        sendAuthError(reply, error);
        return reply;
      }

      if (error instanceof z.ZodError) {
        reply.status(400).send({
          code: "BAD_REQUEST",
          message: "Invalid registration settings payload",
          issues: error.flatten(),
        });
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
        token: null,
        hasToken: currentToken != null,
        lastRotatedAt: currentToken?.updatedAt.toISOString() ?? null,
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
        hasToken: true,
        lastRotatedAt: token.updatedAt.toISOString(),
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
