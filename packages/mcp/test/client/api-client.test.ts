import { describe, expect, it, vi } from "vitest";

import { HaaabitApiClient } from "../../src/client/api-client";
describe("HaaabitApiClient", () => {
  it("sends bearer auth requests against the configured base URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const client = new HaaabitApiClient({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: fetchImpl,
    });

    const result = await client.request("/habits");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/api/habits");
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        authorization: "Bearer secret-token",
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it("does not auto-append /api to the configured base URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const client = new HaaabitApiClient({
      apiUrl: "https://habit.example.com",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: fetchImpl,
    });

    await client.request("/today");

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://habit.example.com/today");
  });

  it("throws a semantic API error for non-2xx responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "Habit not found",
        }),
        {
          status: 404,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );
    const client = new HaaabitApiClient({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: fetchImpl,
    });

    await expect(client.request("/habits/missing")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "Habit not found",
    });
  });
});
