import type { z } from "zod";

import { habitsTools } from "./habits.js";
import { statsTools } from "./stats.js";
import { todayTools } from "./today.js";

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

export const toolInventory: InventoryTool[] = [...habitsTools, ...todayTools, ...statsTools];

export const EXPECTED_TOOL_NAMES = toolInventory.map((tool) => tool.name);
