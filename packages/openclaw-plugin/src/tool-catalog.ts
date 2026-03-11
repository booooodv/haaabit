import { EXPECTED_TOOL_NAMES, toolInventory } from "../../mcp/src/tools/inventory.js";

import type { NativeToolDefinition } from "./types.js";

export { EXPECTED_TOOL_NAMES };

export function createToolCatalog(): NativeToolDefinition[] {
  return toolInventory.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
  }));
}
