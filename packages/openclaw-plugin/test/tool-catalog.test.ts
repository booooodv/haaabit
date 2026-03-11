import { describe, expect, it } from "vitest";

import { EXPECTED_TOOL_NAMES, createToolCatalog } from "../src/tool-catalog";
import { toolInventory } from "../../mcp/src/tools/catalog";

describe("createToolCatalog", () => {
  it("reuses the shipped Haaabit tool vocabulary", () => {
    const catalog = createToolCatalog();

    expect(catalog.map((tool) => tool.name)).toEqual(EXPECTED_TOOL_NAMES);
    expect(catalog.map((tool) => tool.name)).toEqual(toolInventory.map((tool) => tool.name));
  });

  it("preserves descriptions and schema references for each tool", () => {
    const catalog = createToolCatalog();
    const habitsAdd = catalog.find((tool) => tool.name === "habits_add");

    expect(habitsAdd?.description).toContain("Create a new habit definition");
    expect(habitsAdd?.inputSchema).toBeDefined();
    expect(
      (habitsAdd?.outputSchema as { safeParse: (value: unknown) => { success: boolean } }).safeParse({
        ok: true,
        toolName: "habits_add",
        summary: "Created Read (quantity, 30 pages, daily).",
        data: {
          item: {
            id: "habit_read",
            userId: "user_1",
            name: "Read",
            kind: "quantity",
            description: null,
            category: "learning",
            targetValue: 30,
            unit: "pages",
            startDate: "2026-03-01",
            isActive: true,
            frequencyType: "daily",
            frequencyCount: null,
            weekdays: [],
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-03-01T08:00:00.000Z",
          },
        },
      }).success,
    ).toBe(true);
  });
});
