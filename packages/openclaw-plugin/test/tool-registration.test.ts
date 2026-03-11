import { describe, expect, it, vi } from "vitest";

import { activateHaaabitOpenClawPlugin } from "../src/index";

describe("native tool registration", () => {
  it("registers descriptions and schemas for the Haaabit tool catalog", () => {
    const registerTool = vi.fn();

    activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    const todaySummary = registerTool.mock.calls.find(([name]) => name === "today_get_summary");
    expect(todaySummary?.[1]).toMatchObject({
      description: expect.stringContaining("today"),
      outputSchema: expect.anything(),
    });
  });

  it("uses explicit native placeholders until direct API handlers land", async () => {
    const registerTool = vi.fn();

    activateHaaabitOpenClawPlugin(
      {
        registerTool,
      },
      {
        env: {
          HAAABIT_API_URL: "https://habit.example.com/api",
          HAAABIT_API_TOKEN: "secret-token",
        },
      },
    );

    const habitsList = registerTool.mock.calls.find(([name]) => name === "habits_list");
    const handler = habitsList?.[2] as ((input: unknown) => Promise<Record<string, unknown>>) | undefined;

    await expect(handler?.({})).resolves.toMatchObject({
      ok: false,
      error: {
        category: "not_implemented",
        code: "PHASE_27_PENDING",
      },
    });
  });
});
