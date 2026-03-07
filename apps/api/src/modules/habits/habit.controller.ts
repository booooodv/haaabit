import { ZodError } from "zod";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError, requireSession } from "../../auth/session";
import { createHabit, listHabits } from "./habit.service";

function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

export async function listHabitsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    const items = await listHabits(
      {
        db: request.server.db,
      },
      {
        userId: session.user.id,
      },
    );

    return { items };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    throw error;
  }
}

export async function createHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    const item = await createHabit(
      {
        db: request.server.db,
      },
      {
        userId: session.user.id,
        input: request.body,
      },
    );

    reply.status(201);
    return { item };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    if (error instanceof ZodError) {
      reply.status(400).send({
        code: "BAD_REQUEST",
        message: "Invalid habit payload",
        issues: error.flatten(),
      });
      return reply;
    }

    throw error;
  }
}
