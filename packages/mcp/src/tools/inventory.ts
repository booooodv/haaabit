import type { HaaabitApiClient } from "../client/api-client.js";
import { HaaabitApiError, createNotImplementedToolResult, toMcpErrorResult } from "../client/errors.js";
import { EXPECTED_TOOL_NAMES, toolInventory } from "./catalog.js";
import { createMutationToolResult, createReadToolResult } from "./read-results.js";
import { createToolOperations } from "./runtime.js";

export { EXPECTED_TOOL_NAMES, toolInventory } from "./catalog.js";

export function createDiscoveryHandlers(options: { client: HaaabitApiClient }) {
  const operations = createToolOperations({
    client: options.client,
  });

  return toolInventory.map((tool) => ({
    ...tool,
    handler: operations[tool.name]
      ? wrapToolHandler(tool.name, tool.method !== "GET", operations[tool.name])
      : async (_input: unknown) => createNotImplementedToolResult(tool.name),
  }));
}

function wrapToolHandler(
  toolName: string,
  isMutation: boolean,
  handler: (input: unknown) => Promise<{
    payload: unknown;
    summary: string;
  }>,
) {
  return async (input: unknown) => {
    try {
      const outcome = await handler(input);
      return isMutation
        ? createMutationToolResult(toolName, outcome.payload, outcome.summary)
        : createReadToolResult(toolName, outcome.payload, outcome.summary);
    } catch (error) {
      if (error instanceof HaaabitApiError) {
        return toMcpErrorResult(error, {
          toolName,
        });
      }

      throw error;
    }
  };
}
