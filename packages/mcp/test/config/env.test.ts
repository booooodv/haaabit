import { describe, expect, it } from "vitest";

import { parseConfig, type ConfigInput } from "../../src/config/env";

function createInput(overrides: Partial<ConfigInput> = {}): ConfigInput {
  return {
    env: {
      HAAABIT_API_URL: "https://habit.example.com/api",
      HAAABIT_API_TOKEN: "secret-token",
    },
    argv: [],
    ...overrides,
  };
}

describe("parseConfig", () => {
  it("requires HAAABIT_API_URL and HAAABIT_API_TOKEN by default", () => {
    expect(() =>
      parseConfig({
        env: {},
        argv: [],
      }),
    ).toThrowError("Missing required configuration: HAAABIT_API_URL, HAAABIT_API_TOKEN");
  });

  it("accepts --api-url and --timeout overrides", () => {
    const config = parseConfig(
      createInput({
        argv: ["--api-url", "https://override.example.com/api", "--timeout", "2500"],
      }),
    );

    expect(config).toMatchObject({
      apiUrl: "https://override.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
    });
  });

  it("does not guess missing /api suffixes", () => {
    const config = parseConfig(
      createInput({
        env: {
          HAAABIT_API_URL: "https://habit.example.com",
          HAAABIT_API_TOKEN: "secret-token",
        },
      }),
    );

    expect(config.apiUrl).toBe("https://habit.example.com");
  });

  it("rejects invalid timeout values", () => {
    expect(() =>
      parseConfig(
        createInput({
          argv: ["--timeout", "nope"],
        }),
      ),
    ).toThrowError("Invalid --timeout value: nope");
  });
});
