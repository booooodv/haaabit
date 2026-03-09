import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError, requireAuthenticatedUser } from "../../auth/session";
import { getRequestTimestamp, sendAuthError } from "../../shared/controller-helpers";

import { getOverviewStats } from "./stats.service";

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
