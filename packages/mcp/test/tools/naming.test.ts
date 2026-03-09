import { describe, expect, it } from "vitest";

import { toolInventory } from "../../src/tools/inventory";

describe("tool naming", () => {
  it("uses underscore-safe public names", () => {
    for (const tool of toolInventory) {
      expect(tool.name).toMatch(/^[a-z0-9_]+$/);
      expect(tool.name).not.toContain(".");
      expect(tool.name).not.toContain("-");
    }
  });
});
