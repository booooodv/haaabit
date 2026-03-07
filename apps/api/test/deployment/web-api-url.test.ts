import { afterEach, describe, expect, test, vi } from "vitest";

const modulePath = "../../../web/lib/api";

function resetApiEnv() {
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  delete process.env.API_BASE_URL;
  delete process.env.API_INTERNAL_BASE_URL;
}

afterEach(() => {
  resetApiEnv();
  vi.resetModules();
});

describe("web api url helpers", () => {
  test("uses relative browser paths by default so the public proxy origin stays canonical", async () => {
    const { createBrowserApiUrl } = await import(modulePath);

    expect(createBrowserApiUrl("/api/today")).toBe("/api/today");
  });

  test("uses NEXT_PUBLIC_API_BASE_URL for browser links when one is explicitly configured", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://habit.example.com";

    const { createBrowserApiUrl } = await import(modulePath);

    expect(createBrowserApiUrl("/api/openapi.json")).toBe("https://habit.example.com/api/openapi.json");
  });

  test("prefers API_INTERNAL_BASE_URL for server-side requests even when a public browser base exists", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://habit.example.com";
    process.env.API_BASE_URL = "https://public-fallback.example.com";
    process.env.API_INTERNAL_BASE_URL = "http://api:3001";

    const { createServerApiUrl } = await import(modulePath);

    expect(createServerApiUrl("/api/today")).toBe("http://api:3001/api/today");
  });
});
