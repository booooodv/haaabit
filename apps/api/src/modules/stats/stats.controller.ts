import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError, requireAuthenticatedUser } from "../../auth/session";

import { getOverviewStats } from "./stats.service";

function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

function getRequestTimestamp(request: FastifyRequest) {
  const header = request.headers["x-haaabit-now"];

  if (request.server.env.NODE_ENV === "test" && typeof header === "string" && header.length > 0) {
    return header;
  }

  return new Date();
}

export async function getOverviewStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await requireAuthenticatedUser(request);
    const overview = await getOverviewStats(
      {
        db: request.server.db,
      },
      {
        userId: user.id,
        timestamp: getRequestTimestamp(request),
      },
    );

    return { overview };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    throw error;
  }
}
