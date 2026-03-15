import { describe, expect, it } from "vitest";

import { EXPECTED_TOOL_NAMES, createToolCatalog } from "../src/tool-catalog";
import { toolInventory } from "../../mcp/src/tools/catalog";

function hasSchemaKey(value: unknown, targetKey: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasSchemaKey(item, targetKey));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => key === targetKey || hasSchemaKey(nestedValue, targetKey));
  }

  return false;
}

describe("createToolCatalog", () => {
  it("reuses the shipped Haaabit tool vocabulary", () => {
    const catalog = createToolCatalog();

    expect(catalog.map((tool) => tool.name)).toEqual(EXPECTED_TOOL_NAMES);
    expect(catalog.map((tool) => tool.name)).toEqual(toolInventory.map((tool) => tool.name));
  });

  it("preserves descriptions while converting schemas into provider-safe JSON Schema", () => {
    const catalog = createToolCatalog();
    const habitsAdd = catalog.find((tool) => tool.name === "habits_add");
    const habitsEdit = catalog.find((tool) => tool.name === "habits_edit");
    const habitsList = catalog.find((tool) => tool.name === "habits_list");

    expect(habitsAdd?.description).toContain("Create a new habit definition");
    expect(habitsAdd?.inputSchema).toBeDefined();
    expect(habitsAdd?.outputSchema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        ok: expect.objectContaining({
          const: true,
        }),
        data: expect.any(Object),
      }),
    });
    expect(habitsList?.inputSchema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        status: expect.objectContaining({
          enum: ["active", "archived"],
        }),
      }),
    });
    expect(habitsEdit?.inputSchema).toMatchObject({
      type: "object",
      required: ["habitId"],
      properties: expect.objectContaining({
        habitId: expect.objectContaining({
          type: "string",
        }),
      }),
    });
    expect(hasSchemaKey(habitsEdit?.inputSchema, "allOf")).toBe(false);
    expect(hasSchemaKey(habitsAdd?.inputSchema, "default")).toBe(false);
    expect(hasSchemaKey(habitsAdd?.outputSchema, "default")).toBe(false);
    expect(hasSchemaKey(habitsAdd?.outputSchema, "$schema")).toBe(false);
    expect(hasSchemaKey(habitsList?.inputSchema, "default")).toBe(false);
  });
});
