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
    const result = toMcpErrorResult(error);

    expect(result).toMatchObject({
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
    expect(result.content?.[1]).toEqual({
      type: "text",
      text: JSON.stringify({
        category: "validation",
        status: 400,
        code: "BAD_REQUEST",
        message: "Invalid habit payload",
        issues: {
          formErrors: [],
          fieldErrors: {
            targetValue: ["Quantified habits require targetValue"],
          },
        },
        retryable: false,
        resolution: "fix_input",
      }),
    });
  });

  it("explains wrong-kind failures and points to the correct today tool", () => {
    const error = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Only quantified habits can use set-total",
    });
    const result = toMcpErrorResult(error, { toolName: "today_set_total" });
    const machine = JSON.parse((result.structuredContent as { _haaabit_json: string })._haaabit_json) as {
      hint: string;
      message: string;
    };

    expect(result).toMatchObject({
      structuredContent: {
        category: "wrong_kind",
        hint: expect.stringContaining("today_complete"),
        resolution: "switch_tool",
        suggestedTool: "today_complete",
      },
    });
    expect(result.content?.[0]).toEqual({
      type: "text",
      text: machine.message,
    });
    expect(machine.hint).toContain("today_complete");
  });

  it("turns archived-habit conflicts into restore guidance with read-only hint", () => {
    const error = new HaaabitApiError({
      status: 409,
      code: "HABIT_INACTIVE",
      message: "Archived habits are read-only until restored",
    });

    const result = toMcpErrorResult(error, { toolName: "today_set_total" });

    expect(result).toMatchObject({
      structuredContent: {
        category: "conflict",
        hint: expect.stringContaining("habits_restore"),
      },
    });
    expect(result.content?.[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("archived"),
    });
  });

  it("rephrases not actionable right now as a validation-class user-facing message", () => {
    const error = new HaaabitApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "This habit is not actionable in today right now",
    });

    const result = toMcpErrorResult(error, { toolName: "today_complete" });

    expect(result).toMatchObject({
      structuredContent: {
        category: "validation",
      },
    });
    expect(result.content?.[0]).toEqual({
      type: "text",
      text: "Today this habit cannot be acted on right now.",
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
        resolution: "reauth",
      },
    });
    expect(toMcpErrorResult(notFoundError, { toolName: "habits_edit" })).toMatchObject({
      structuredContent: {
        category: "not_found",
        hint: expect.stringContaining("habitId"),
        resolution: "check_habit_id",
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
