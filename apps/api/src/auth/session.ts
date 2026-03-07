import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";

export class AuthSessionError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthSessionError";
  }
}

export async function getSession(request: FastifyRequest) {
  return request.server.auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function requireSession(request: FastifyRequest): Promise<AuthSession> {
  const session = await getSession(request);

  if (!session) {
    throw new AuthSessionError(401, "Authentication required");
  }

  return session;
}

export function assertOwnsUser(session: AuthSession, userId: string): void {
  if (session.user.id !== userId) {
    throw new AuthSessionError(403, "Forbidden");
  }
}
