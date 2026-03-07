import { ZodError } from "zod";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError, requireAuthenticatedUser } from "../../auth/session";
import {
  archiveHabit,
  createHabit,
  getHabitDetail,
  HabitInactiveError,
  HabitNotFoundError,
  listHabits,
  restoreHabit,
  updateHabit,
} from "./habit.service";

function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

function sendHabitRequestError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    reply.status(400).send({
      code: "BAD_REQUEST",
      message: "Invalid habit payload",
      issues: error.flatten(),
    });
    return reply;
  }

  if (error instanceof HabitNotFoundError) {
    reply.status(404).send({
      code: "NOT_FOUND",
      message: error.message,
    });
    return reply;
  }

  if (error instanceof HabitInactiveError) {
    reply.status(409).send({
      code: "HABIT_INACTIVE",
      message: error.message,
    });
    return reply;
  }

  throw error;
}

function getHabitId(request: FastifyRequest) {
  return (request.params as { habitId: string }).habitId;
}

function getRequestTimestamp(request: FastifyRequest) {
  const header = request.headers["x-haaabit-now"];

  if (request.server.env.NODE_ENV === "test" && typeof header === "string" && header.length > 0) {
    return header;
  }

  return new Date();
}

export async function listHabitsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const items = await listHabits(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        filters: request.query,
      },
    );

    return { items };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendHabitRequestError(reply, error);
  }
}

export async function createHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const item = await createHabit(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
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

    return sendHabitRequestError(reply, error);
  }
}

export async function getHabitDetailHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const item = await getHabitDetail(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        habitId: getHabitId(request),
        timestamp: getRequestTimestamp(request),
      },
    );

    return { item };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendHabitRequestError(reply, error);
  }
}

export async function updateHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const item = await updateHabit(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        habitId: getHabitId(request),
        input: request.body,
      },
    );

    return { item };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendHabitRequestError(reply, error);
  }
}

export async function archiveHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const item = await archiveHabit(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        habitId: getHabitId(request),
      },
    );

    return { item };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendHabitRequestError(reply, error);
  }
}

export async function restoreHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const item = await restoreHabit(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        habitId: getHabitId(request),
      },
    );

    return { item };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendHabitRequestError(reply, error);
  }
}
