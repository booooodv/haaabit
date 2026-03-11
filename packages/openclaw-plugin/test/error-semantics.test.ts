import { describe, expect, it, vi } from "vitest";

import { createNativeHandlers } from "../src/native-handlers";

function createHandlers(fetchImpl: typeof fetch) {
  return createNativeHandlers(
    {
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 25,
    },
    {
      fetch: fetchImpl,
    },
  );
}

function createErrorResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("native error semantics", () => {
  it("distinguishes timeout and network failures as retryable runtime errors", async () => {
    const timeoutHandlers = createHandlers(
      vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
        const signal = init?.signal as AbortSignal;

        return await new Promise<Response>((_, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      }),
    );
    const networkHandlers = createHandlers(
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(timeoutHandlers.today_get_summary?.({})).resolves.toMatchObject({
      ok: false,
      toolName: "today_get_summary",
      error: {
        category: "timeout",
        code: "TIMEOUT",
        retryable: true,
        resolution: "retry",
      },
    });
    await expect(networkHandlers.today_get_summary?.({})).resolves.toMatchObject({
      ok: false,
      toolName: "today_get_summary",
      error: {
        category: "network",
        code: "NETWORK_ERROR",
        retryable: true,
        resolution: "retry",
      },
    });
  });

  it("surfaces auth and not-found failures with actionable structured next steps", async () => {
    const handlers = createHandlers(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          createErrorResponse(
            {
              code: "UNAUTHORIZED",
              message: "Authentication required",
            },
            401,
          ),
        )
        .mockResolvedValueOnce(
          createErrorResponse(
            {
              code: "NOT_FOUND",
              message: "Habit not found",
            },
            404,
          ),
        ),
    );

    await expect(handlers.today_get_summary?.({})).resolves.toMatchObject({
      ok: false,
      toolName: "today_get_summary",
      error: {
        category: "auth",
        resolution: "reauth",
        retryable: false,
      },
    });
    await expect(handlers.habits_edit?.({ habitId: "habit_missing", name: "Read" })).resolves.toMatchObject({
      ok: false,
      toolName: "habits_edit",
      error: {
        category: "not_found",
        resolution: "check_habit_id",
        retryable: false,
      },
    });
  });

  it("marks wrong-kind today mutations with an explicit reroute target", async () => {
    const handlers = createHandlers(
      vi.fn<typeof fetch>().mockResolvedValue(
        createErrorResponse(
          {
            code: "BAD_REQUEST",
            message: "Only quantified habits can use set-total",
          },
          400,
        ),
      ),
    );

    await expect(
      handlers.today_set_total?.({
        habitId: "habit_walk",
        total: 1,
        source: "ai",
      }),
    ).resolves.toMatchObject({
      ok: false,
      toolName: "today_set_total",
      error: {
        category: "wrong_kind",
        resolution: "switch_tool",
        suggestedTool: "today_complete",
        retryable: false,
      },
    });
  });
});
