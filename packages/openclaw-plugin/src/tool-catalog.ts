import { EXPECTED_TOOL_NAMES, toolInventory } from "../../mcp/src/tools/catalog.js";

import { toProviderSafeJsonSchema } from "./provider-safe-schema.js";
import { nativeSuccessEnvelopeSchema, type NativeToolDefinition } from "./types.js";

export { EXPECTED_TOOL_NAMES };

export function createToolCatalog(): NativeToolDefinition[] {
  return toolInventory.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: toProviderSafeJsonSchema(tool.inputSchema),
    outputSchema: toProviderSafeJsonSchema(nativeSuccessEnvelopeSchema(tool.outputSchema)),
  }));
}
