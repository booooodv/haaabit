import type { ToolAdapter } from "../tools/inventory.js";

import { toolInventory } from "../tools/inventory.js";

export function adaptToolResult(toolName: string, payload: unknown) {
  const tool = toolInventory.find((entry) => entry.name === toolName);

  if (!tool) {
    return payload;
  }

  return applyAdapter(tool.adapter, payload);
}

function applyAdapter(adapter: ToolAdapter, payload: unknown) {
  switch (adapter) {
    case "summary_to_today":
      if (isObject(payload) && "summary" in payload) {
        return {
          today: payload.summary,
        };
      }
      return payload;
    case "overview_to_stats":
      if (isObject(payload) && "overview" in payload) {
        return {
          stats: payload.overview,
        };
      }
      return payload;
    case "action_to_today":
      if (isObject(payload) && "affectedHabit" in payload && "summary" in payload) {
        return {
          habit: payload.affectedHabit,
          today: payload.summary,
        };
      }
      return payload;
    case "passthrough":
    default:
      return payload;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
