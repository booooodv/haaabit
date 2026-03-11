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
    expect(habitsAdd?.outputSchema).toBeDefined();
  });
});
