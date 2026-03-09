import { describe, expect, it } from "vitest";

import { EXPECTED_TOOL_NAMES, toolInventory } from "../../src/tools/inventory";

describe("toolInventory", () => {
  it("covers every promised habits, today, and stats tool", () => {
    expect(toolInventory.map((tool) => tool.name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it("keeps one primary route mapping per public tool", () => {
    expect(
      toolInventory.map((tool) => ({
        name: tool.name,
        route: `${tool.method} ${tool.path}`,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "habits_list",
          "route": "GET /habits",
        },
        {
          "name": "habits_add",
          "route": "POST /habits",
        },
        {
          "name": "habits_get_detail",
          "route": "GET /habits/:habitId",
        },
        {
          "name": "habits_edit",
          "route": "PATCH /habits/:habitId",
        },
        {
          "name": "habits_archive",
          "route": "POST /habits/:habitId/archive",
        },
        {
          "name": "habits_restore",
          "route": "POST /habits/:habitId/restore",
        },
        {
          "name": "today_get_summary",
          "route": "GET /today",
        },
        {
          "name": "today_complete",
          "route": "POST /today/complete",
        },
        {
          "name": "today_set_total",
          "route": "POST /today/set-total",
        },
        {
          "name": "today_undo",
          "route": "POST /today/undo",
        },
        {
          "name": "stats_get_overview",
          "route": "GET /stats/overview",
        },
      ]
    `);
  });
});
