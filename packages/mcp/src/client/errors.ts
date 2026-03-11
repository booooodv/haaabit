import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { sanitizeErrorMessage, toToolErrorPayload } from "./error-payload.js";
import { buildMachineReadableToolResult } from "../tools/read-results.js";

type HaaabitApiErrorOptions = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export class HaaabitApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(options: HaaabitApiErrorOptions) {
    super(options.message);
    this.name = "HaaabitApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

export function toMcpErrorResult(
  error: HaaabitApiError,
  context: {
    toolName?: string;
  } = {},
): CallToolResult {
  const payload = toToolErrorPayload(error, context);

  return createMcpErrorResult({
    category: payload.category,
    status: payload.status,
    code: payload.code,
    message: payload.message,
    hint: payload.hint,
    issues: payload.issues,
  });
}

export function createNotImplementedToolResult(toolName: string): CallToolResult {
  return createMcpErrorResult({
    category: "not_implemented",
    status: 501,
    code: "NOT_IMPLEMENTED",
    message: `${toolName} is not implemented in Phase 18.`,
  });
}

function createMcpErrorResult(input: {
  category: string;
  status: number;
  code: string;
  message: string;
  hint?: string;
  issues?: unknown;
}): CallToolResult {
  const message = sanitizeErrorMessage(input.message);
  const hint = input.hint ? sanitizeErrorMessage(input.hint) : undefined;

  return buildMachineReadableToolResult(
    message,
    {
      category: input.category,
      status: input.status,
      code: input.code,
      message,
      ...(input.issues ? { issues: input.issues } : {}),
      ...(hint ? { hint } : {}),
    },
    {
      isError: true,
    },
  );
}
