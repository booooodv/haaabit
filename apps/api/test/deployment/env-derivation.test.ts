import { describe, expect, test } from "vitest";

import { createEnv } from "../../src/plugins/env";

const baseEnv = {
  NODE_ENV: "production" as const,
  DATABASE_URL: "file:/data/haaabit.db",
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
};

describe("createEnv deployment derivation", () => {
  test("derives auth and cors URLs from APP_BASE_URL when explicit values are omitted", () => {
    const env = createEnv({
      ...baseEnv,
      APP_BASE_URL: "http://localhost:8080",
    });

    expect(env.BETTER_AUTH_URL).toBe("http://localhost:8080");
    expect(env.CORS_ORIGIN).toBe("http://localhost:8080");
    expect(env.corsOrigins).toEqual(["http://localhost:8080"]);
  });

  test("treats blank BETTER_AUTH_URL and CORS_ORIGIN values as unset so compose defaults still work", () => {
    const env = createEnv({
      ...baseEnv,
      APP_BASE_URL: "http://localhost:8080",
      BETTER_AUTH_URL: "",
      CORS_ORIGIN: "",
    });

    expect(env.BETTER_AUTH_URL).toBe("http://localhost:8080");
    expect(env.CORS_ORIGIN).toBe("http://localhost:8080");
    expect(env.corsOrigins).toEqual(["http://localhost:8080"]);
  });

  test("preserves explicit BETTER_AUTH_URL and CORS_ORIGIN overrides when provided", () => {
    const env = createEnv({
      ...baseEnv,
      APP_BASE_URL: "http://localhost:8080",
      BETTER_AUTH_URL: "https://auth.example.com",
      CORS_ORIGIN: "https://app.example.com, https://admin.example.com",
    });

    expect(env.BETTER_AUTH_URL).toBe("https://auth.example.com");
    expect(env.CORS_ORIGIN).toBe("https://app.example.com, https://admin.example.com");
    expect(env.corsOrigins).toEqual(["https://app.example.com", "https://admin.example.com"]);
  });
});
