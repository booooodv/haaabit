import { describe, expect, it } from "vitest";

import { createReadToolResult } from "../../src/tools/read-results";

describe("createReadToolResult", () => {
  it("returns content plus preserved structuredContent for passthrough read tools", () => {
    const result = createReadToolResult("habits_list", {
      items: [{ id: "habit_1" }],
    }, "2 active habits");

    expect(result.content).toEqual([
      {
        type: "text",
        text: "2 active habits",
      },
      {
        type: "text",
        text: JSON.stringify({
          items: [{ id: "habit_1" }],
        }, null, 2),
      },
    ]);
    expect(result.structuredContent).toEqual({
      items: [{ id: "habit_1" }],
      _haaabit_json: JSON.stringify({
        items: [{ id: "habit_1" }],
      }, null, 2),
    });
  });

  it("adapts today and stats wrappers before returning structuredContent", () => {
    const todayResult = createReadToolResult(
      "today_get_summary",
      {
        summary: { date: "2026-03-09" },
      },
      "Today summary",
    );
    const statsResult = createReadToolResult(
      "stats_get_overview",
      {
        overview: { date: "2026-03-09" },
      },
      "Stats summary",
    );

    expect(todayResult.structuredContent).toEqual({
      today: { date: "2026-03-09" },
      _haaabit_json: JSON.stringify({
        today: { date: "2026-03-09" },
      }, null, 2),
    });
    expect(statsResult.structuredContent).toEqual({
      stats: { date: "2026-03-09" },
      _haaabit_json: JSON.stringify({
        stats: { date: "2026-03-09" },
      }, null, 2),
    });
  });

  it("exposes machine-readable nested fields without collapsing them into [Object]", () => {
    const result = createReadToolResult(
      "habits_get_detail",
      {
        item: {
          id: "habit_1",
          targetValue: 10,
          unit: "pages",
          stats: {
            todayProgress: {
              currentValue: 3,
              targetValue: 10,
              unit: "pages",
            },
          },
        },
      },
      "Habit detail",
    );

    const parsed = JSON.parse((result.structuredContent as { _haaabit_json: string })._haaabit_json) as {
      item: {
        targetValue: number;
        unit: string;
        stats: {
          todayProgress: {
            unit: string;
          };
        };
      };
    };

    expect(parsed.item.targetValue).toBe(10);
    expect(parsed.item.unit).toBe("pages");
    expect(parsed.item.stats.todayProgress.unit).toBe("pages");
    expect(result.content?.[1]).toEqual({
      type: "text",
      text: JSON.stringify(parsed, null, 2),
    });
  });
});
