import { afterEach, describe, expect, it } from "vitest";

import { OpenClawPluginError } from "../../src/errors";
import { parsePluginEnv, resolvePluginRuntimeEnv } from "../../src/config/env";

const ORIGINAL_API_URL = process.env.HAAABIT_API_URL;
const ORIGINAL_API_TOKEN = process.env.HAAABIT_API_TOKEN;

afterEach(() => {
  resetProcessEnv("HAAABIT_API_URL", ORIGINAL_API_URL);
  resetProcessEnv("HAAABIT_API_TOKEN", ORIGINAL_API_TOKEN);
});

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

  it("merges env from OpenClaw-compatible nested sources with explicit env precedence", () => {
    const env = resolvePluginRuntimeEnv(
      {
        config: {
          env: {
            HAAABIT_API_URL: "https://api-config.example.com/api",
            HAAABIT_API_TOKEN: "api-config-token",
          },
        },
      },
      {
        config: {
          env: {
            HAAABIT_API_TOKEN: "options-config-token",
          },
        },
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api/",
          HAAABIT_API_TOKEN: {
            value: "secret-token",
          },
        },
      },
    );

    expect(env).toMatchObject({
      HAAABIT_API_URL: "https://habit.example.com/api/",
      HAAABIT_API_TOKEN: "secret-token",
    });
  });

  it("resolves {value} wrappers from api.config.env into a plain string env map", () => {
    const env = resolvePluginRuntimeEnv(
      {
        config: {
          env: {
            HAAABIT_API_URL: {
              value: "https://habit.example.com/api/",
            },
            HAAABIT_API_TOKEN: {
              value: "secret-token",
            },
          },
        },
      },
      {},
    );

    expect(parsePluginEnv(env)).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
  });

  it("resolves OpenClaw env reference objects through process.env fallback", () => {
    process.env.HAAABIT_API_URL = "https://habit.example.com/api/";
    process.env.HAAABIT_API_TOKEN = "secret-token";

    const env = resolvePluginRuntimeEnv(
      {
        env: {
          HAAABIT_API_URL: {
            source: "env",
            id: "HAAABIT_API_URL",
          },
          HAAABIT_API_TOKEN: {
            source: "env",
            key: "HAAABIT_API_TOKEN",
          },
        },
      },
      {},
    );

    expect(parsePluginEnv(env)).toEqual({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 10_000,
    });
  });

  it("treats unresolved non-string env values as missing instead of crashing on trim", () => {
    const env = resolvePluginRuntimeEnv(
      {
        env: {
          HAAABIT_API_URL: {
            provider: "default",
            id: "HAAABIT_API_URL",
            source: "secret",
          },
          HAAABIT_API_TOKEN: {
            provider: "default",
            id: "HAAABIT_API_TOKEN",
            source: "secret",
          },
        },
      },
      {},
      {},
    );

    expect(() => parsePluginEnv(env)).toThrowError(
      "Missing required plugin configuration: HAAABIT_API_URL, HAAABIT_API_TOKEN.",
    );
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

function resetProcessEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
