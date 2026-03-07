import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";

import { findUserByApiToken } from "./api-token";

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

export type AuthenticatedUser = AuthSession["user"];

export async function requireSession(request: FastifyRequest): Promise<AuthSession> {
  const session = await getSession(request);

  if (!session) {
    throw new AuthSessionError(401, "Authentication required");
  }

  return session;
}

function getBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ", 2);

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function getAuthenticatedUser(request: FastifyRequest): Promise<AuthenticatedUser | null> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    return findUserByApiToken(request.server.db, bearerToken);
  }

  const session = await getSession(request);
  return session?.user ?? null;
}

export async function requireAuthenticatedUser(request: FastifyRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new AuthSessionError(401, "Authentication required");
  }

  return user;
}

export function assertOwnsUser(session: AuthSession, userId: string): void {
  if (session.user.id !== userId) {
    throw new AuthSessionError(403, "Forbidden");
  }
}
