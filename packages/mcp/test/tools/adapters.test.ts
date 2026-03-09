import { describe, expect, it } from "vitest";

import { adaptToolResult } from "../../src/schemas/adapters";

describe("adaptToolResult", () => {
  it("preserves habit list envelopes", () => {
    expect(
      adaptToolResult("habits_list", {
        items: [{ id: "habit_1" }],
      }),
    ).toEqual({
      items: [{ id: "habit_1" }],
    });
  });

  it("renames aggregated today and stats wrappers for MCP output", () => {
    expect(
      adaptToolResult("today_get_summary", {
        summary: { date: "2026-03-09" },
      }),
    ).toEqual({
      today: { date: "2026-03-09" },
    });
    expect(
      adaptToolResult("stats_get_overview", {
        overview: { date: "2026-03-09" },
      }),
    ).toEqual({
      stats: { date: "2026-03-09" },
    });
  });
});
