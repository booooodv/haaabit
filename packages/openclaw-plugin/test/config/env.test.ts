import { describe, expect, it } from "vitest";

import { OpenClawPluginError } from "../../src/errors";
import { parsePluginEnv } from "../../src/config/env";

describe("parsePluginEnv", () => {
  it("requires HAAABIT_API_URL and HAAABIT_API_TOKEN", () => {
    expect(() => parsePluginEnv({})).toThrowError(
      "Missing required plugin configuration: HAAABIT_API_URL, HAAABIT_API_TOKEN.",
    );
  });

  it("rejects malformed API URLs", () => {
    expect(() =>
      parsePluginEnv({
        HAAABIT_API_URL: "not-a-url",
        HAAABIT_API_TOKEN: "secret-token",
      }),
    ).toThrowError("HAAABIT_API_URL must be a valid absolute URL.");
  });

  it("rejects token values that look like account identifiers", () => {
    expect(() =>
      parsePluginEnv({
        HAAABIT_API_URL: "https://habit.example.com/api",
        HAAABIT_API_TOKEN: "alice@example.com",
      }),
    ).toThrowError("HAAABIT_API_TOKEN looks more like an email address than a Haaabit personal API token.");
  });

  it("normalizes the API URL and returns the native plugin runtime config", () => {
    const config = parsePluginEnv({
      HAAABIT_API_URL: "https://habit.example.com/api/",
      HAAABIT_API_TOKEN: "secret-token",
    });

    expect(config).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
  });

  it("throws OpenClawPluginError instances for config failures", () => {
    try {
      parsePluginEnv({
        HAAABIT_API_URL: "ftp://habit.example.com/api",
        HAAABIT_API_TOKEN: "secret-token",
      });
      throw new Error("Expected parsePluginEnv to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(OpenClawPluginError);
      expect(error).toMatchObject({
        category: "config",
        code: "INVALID_API_URL",
      });
    }
  });
});
