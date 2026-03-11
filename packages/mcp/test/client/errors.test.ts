import { describe, expect, it } from "vitest";

import { HaaabitApiError, toMcpErrorResult } from "../../src/client/errors";

describe("toMcpErrorResult", () => {
  it("preserves semantic auth and validation categories", () => {
    const authError = new HaaabitApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
    const validationError = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid habit payload",
    });

    expect(toMcpErrorResult(authError)).toMatchObject({
      isError: true,
      structuredContent: {
        category: "auth",
        status: 401,
        code: "UNAUTHORIZED",
      },
    });
    expect(toMcpErrorResult(validationError)).toMatchObject({
      isError: true,
      structuredContent: {
        category: "validation",
        status: 400,
        code: "BAD_REQUEST",
      },
    });
  });

  it("distinguishes timeout and network failures from auth failures", () => {
    const timeoutError = new HaaabitApiError({
      status: 504,
      code: "TIMEOUT",
      message: "Request timed out after 10000ms",
    });
    const networkError = new HaaabitApiError({
      status: 503,
      code: "NETWORK_ERROR",
      message: "fetch failed",
    });

    expect(toMcpErrorResult(timeoutError)).toMatchObject({
      isError: true,
      structuredContent: {
        category: "timeout",
        resolution: "retry",
        retryable: true,
      },
    });
    expect(toMcpErrorResult(networkError)).toMatchObject({
      isError: true,
      structuredContent: {
        category: "network",
        resolution: "retry",
        retryable: true,
      },
    });
  });

  it("never includes raw token values in the returned content", () => {
    const error = new HaaabitApiError({
      status: 403,
      code: "FORBIDDEN",
      message: "Forbidden for token secret-token",
    });

    const result = toMcpErrorResult(error);

    expect(JSON.stringify(result)).not.toContain("secret-token");
  });
});
