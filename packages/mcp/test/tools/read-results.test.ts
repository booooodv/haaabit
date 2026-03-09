import { describe, expect, it } from "vitest";

import { createReadToolResult } from "../../src/tools/read-results";

describe("createReadToolResult", () => {
  it("returns content plus preserved structuredContent for passthrough read tools", () => {
    expect(
      createReadToolResult("habits_list", {
        items: [{ id: "habit_1" }],
      }, "2 active habits"),
    ).toEqual({
      content: [
        {
          type: "text",
          text: "2 active habits",
        },
      ],
      structuredContent: {
        items: [{ id: "habit_1" }],
      },
    });
  });

  it("adapts today and stats wrappers before returning structuredContent", () => {
    expect(
      createReadToolResult(
        "today_get_summary",
        {
          summary: { date: "2026-03-09" },
        },
        "Today summary",
      ),
    ).toEqual({
      content: [
        {
          type: "text",
          text: "Today summary",
        },
      ],
      structuredContent: {
        today: { date: "2026-03-09" },
      },
    });
    expect(
      createReadToolResult(
        "stats_get_overview",
        {
          overview: { date: "2026-03-09" },
        },
        "Stats summary",
      ),
    ).toEqual({
      content: [
        {
          type: "text",
          text: "Stats summary",
        },
      ],
      structuredContent: {
        stats: { date: "2026-03-09" },
      },
    });
  });
});
