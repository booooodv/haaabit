import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { adaptToolResult } from "../schemas/adapters.js";

export function createReadToolResult(toolName: string, payload: unknown, summary: string): CallToolResult {
  return createSuccessToolResult(toolName, payload, summary);
}

export function createMutationToolResult(toolName: string, payload: unknown, summary: string): CallToolResult {
  return createSuccessToolResult(toolName, payload, summary);
}

function createSuccessToolResult(toolName: string, payload: unknown, summary: string): CallToolResult {
  const structuredContent = adaptToolResult(toolName, payload);

  if (!isRecord(structuredContent)) {
    throw new Error(`Expected object structuredContent for tool ${toolName}`);
  }

  return {
    content: [
      {
        type: "text",
        text: summary,
      },
    ],
    structuredContent,
  };
}

export function formatNameList(names: string[], limit = 5) {
  if (names.length <= limit) {
    return names.join(", ");
  }

  const visible = names.slice(0, limit).join(", ");
  const remaining = names.length - limit;

  return `${visible}, +${remaining} more`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
