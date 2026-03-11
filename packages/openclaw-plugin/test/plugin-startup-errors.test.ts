import { describe, expect, it } from "vitest";

import { formatStartupError, OpenClawPluginError } from "../src/errors";

describe("formatStartupError", () => {
  it("returns structured startup errors with redacted token values", () => {
    const payload = formatStartupError(
      new OpenClawPluginError({
        category: "config",
        code: "INVALID_API_TOKEN",
        message: "HAAABIT_API_TOKEN secret-token is invalid",
        hint: "Replace secret-token with a valid Haaabit personal API token.",
      }),
      {
        HAAABIT_API_TOKEN: "secret-token",
      },
    );

    expect(payload).toMatchObject({
      ok: false,
      error: {
        category: "config",
        code: "INVALID_API_TOKEN",
      },
    });
    expect(payload.error.message).not.toContain("secret-token");
    expect(payload.error.hint).not.toContain("secret-token");
  });

  it("wraps unknown startup failures in a stable structured payload", () => {
    const payload = formatStartupError(new Error("boom"));

    expect(payload).toEqual({
      ok: false,
      error: {
        category: "startup",
        code: "UNKNOWN_STARTUP_ERROR",
        message: "boom",
      },
    });
  });
});
