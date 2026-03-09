import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError } from "../auth/session";

export function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

export function getRequestTimestamp(request: FastifyRequest) {
  const header = request.headers["x-haaabit-now"];

  if (request.server.env.NODE_ENV === "test" && typeof header === "string" && header.length > 0) {
    return header;
  }

  return new Date();
}
