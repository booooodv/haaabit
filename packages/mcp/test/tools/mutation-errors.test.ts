import { describe, expect, it } from "vitest";

import { createServer } from "../../src/server/create-server";
import { HaaabitApiError, toMcpErrorResult } from "../../src/client/errors";

describe("mutation error semantics", () => {
  it("preserves validation fieldErrors in structuredContent", () => {
    const error = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid habit payload",
      details: {
        issues: {
          formErrors: [],
          fieldErrors: {
            targetValue: ["Quantified habits require targetValue"],
          },
        },
      },
    });

    expect(toMcpErrorResult(error)).toMatchObject({
      isError: true,
      structuredContent: {
        category: "validation",
        issues: {
          fieldErrors: {
            targetValue: ["Quantified habits require targetValue"],
          },
        },
      },
    });
  });

  it("explains wrong-kind failures and points to the correct today tool", () => {
    const error = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Only quantified habits can use set-total",
    });

    expect(toMcpErrorResult(error, { toolName: "today_set_total" })).toMatchObject({
      structuredContent: {
        category: "validation",
        hint: expect.stringContaining("today_complete"),
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("today_complete"),
        },
      ],
    });
  });

  it("turns archived-habit conflicts into restore guidance with read-only hint", () => {
    const error = new HaaabitApiError({
      status: 409,
      code: "HABIT_INACTIVE",
      message: "Archived habits are read-only until restored",
    });

    expect(toMcpErrorResult(error, { toolName: "today_set_total" })).toMatchObject({
      structuredContent: {
        category: "conflict",
        hint: expect.stringContaining("habits_restore"),
      },
      content: [
        {
          type: "text",
          text: expect.stringContaining("archived"),
        },
      ],
    });
  });

  it("rephrases not actionable right now as a validation-class user-facing message", () => {
    const error = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "This habit is not actionable in today right now",
    });

    expect(toMcpErrorResult(error, { toolName: "today_complete" })).toMatchObject({
      structuredContent: {
        category: "validation",
      },
      content: [
        {
          type: "text",
          text: "Today this habit cannot be acted on right now.",
        },
      ],
    });
  });

  it("adds a next-step hint for auth and not-found failures", () => {
    const authError = new HaaabitApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
    const notFoundError = new HaaabitApiError({
      status: 404,
      code: "NOT_FOUND",
      message: "Habit not found",
    });

    expect(toMcpErrorResult(authError)).toMatchObject({
      structuredContent: {
        category: "auth",
        hint: expect.any(String),
      },
    });
    expect(toMcpErrorResult(notFoundError, { toolName: "habits_edit" })).toMatchObject({
      structuredContent: {
        category: "not_found",
        hint: expect.stringContaining("habitId"),
      },
    });
  });

  it("returns MCP error results from real handlers instead of throwing REST errors", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          code: "HABIT_INACTIVE",
          message: "Archived habits are read-only until restored",
        }),
        {
          status: 409,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    const server = createServer({
      apiUrl: "https://habit.example.com/api",
      apiToken: "secret-token",
      timeoutMs: 2500,
      fetch: fetchImpl,
    });
    const tool = server.listRegisteredTools().find((entry) => entry.name === "today_set_total");

    if (!tool) {
      throw new Error("today_set_total tool not found");
    }

    await expect(
      tool.handler({
        habitId: "habit_1",
        total: 4,
        source: "ai",
      }),
    ).resolves.toMatchObject({
      isError: true,
      structuredContent: {
        category: "conflict",
        hint: expect.stringContaining("habits_restore"),
      },
    });
  });
});
