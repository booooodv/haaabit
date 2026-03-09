import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";

import { AuthSessionError } from "../../src/auth/session";
import { getRequestTimestamp, sendAuthError } from "../../src/shared/controller-helpers";

function createReplyDouble() {
  const send = vi.fn();
  const status = vi.fn(() => ({ send }));

  return {
    reply: {
      status,
    } as unknown as FastifyReply,
    status,
    send,
  };
}

describe("controller helpers", () => {
  it("sends the current auth envelope for unauthorized and forbidden errors", () => {
    const unauthorized = createReplyDouble();
    sendAuthError(unauthorized.reply, new AuthSessionError(401, "Authentication required"));

    expect(unauthorized.status).toHaveBeenCalledWith(401);
    expect(unauthorized.send).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });

    const forbidden = createReplyDouble();
    sendAuthError(forbidden.reply, new AuthSessionError(403, "Forbidden"));

    expect(forbidden.status).toHaveBeenCalledWith(403);
    expect(forbidden.send).toHaveBeenCalledWith({
      code: "FORBIDDEN",
      message: "Forbidden",
    });
  });

  it("uses the test override timestamp header only in test env", () => {
    const request = {
      headers: {
        "x-haaabit-now": "2026-03-11T12:00:00.000Z",
      },
      server: {
        env: {
          NODE_ENV: "test",
        },
      },
    } as unknown as FastifyRequest;

    expect(getRequestTimestamp(request)).toBe("2026-03-11T12:00:00.000Z");

    const productionRequest = {
      ...request,
      server: {
        env: {
          NODE_ENV: "production",
        },
      },
    } as unknown as FastifyRequest;

    expect(getRequestTimestamp(productionRequest)).toBeInstanceOf(Date);
  });
});
