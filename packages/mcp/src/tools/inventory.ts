import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

import type { HaaabitApiClient } from "../client/api-client.js";
import { HaaabitApiError, createNotImplementedToolResult, toMcpErrorResult } from "../client/errors.js";
import { createHabitsReadHandlers, createHabitsWriteHandlers, habitsTools } from "./habits.js";
import { createStatsReadHandlers, statsTools } from "./stats.js";
import { createTodayReadHandlers, createTodayWriteHandlers, todayTools } from "./today.js";

export type ToolAdapter = "passthrough" | "summary_to_today" | "overview_to_stats" | "action_to_today";

export type InventoryTool = {
  name: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  description: string;
  inputSchema?: z.ZodTypeAny;
  responseSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  adapter: ToolAdapter;
};

export const toolInventory = [...habitsTools, ...todayTools, ...statsTools];

export const EXPECTED_TOOL_NAMES = toolInventory.map((tool) => tool.name);

export function createDiscoveryHandlers(options: { client: HaaabitApiClient }) {
  const realHandlers: Record<string, (input: unknown) => Promise<CallToolResult>> = {
    ...createHabitsReadHandlers(options.client),
    ...createHabitsWriteHandlers(options.client),
    ...createTodayReadHandlers(options.client),
    ...createTodayWriteHandlers(options.client),
    ...createStatsReadHandlers(options.client),
  };

  return toolInventory.map((tool) => ({
    ...tool,
    handler: realHandlers[tool.name]
      ? wrapToolHandler(tool.name, realHandlers[tool.name])
      : async (_input: unknown) => createNotImplementedToolResult(tool.name),
  }));
}

function wrapToolHandler(toolName: string, handler: (input: unknown) => Promise<CallToolResult>) {
  return async (input: unknown) => {
    try {
      return await handler(input);
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
