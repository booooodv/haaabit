import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
  const message = deriveMessage(error, context.toolName);

  return createMcpErrorResult({
    category: categorizeError(error),
    status: error.status,
    code: error.code,
    message,
    hint: deriveHint(error, context.toolName),
    issues: extractIssues(error.details),
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

  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
    structuredContent: {
      category: input.category,
      status: input.status,
      code: input.code,
      message,
      ...(input.issues ? { issues: input.issues } : {}),
      ...(hint ? { hint } : {}),
    },
  };
}

function categorizeError(error: HaaabitApiError) {
  if (error.status === 401 || error.status === 403) {
    return "auth";
  }

  if (error.status === 400) {
    return "validation";
  }

  if (error.status === 404) {
    return "not_found";
  }

  if (error.status === 409) {
    return "conflict";
  }

  return "unknown";
}

function sanitizeErrorMessage(message: string) {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/token\s+\S+/gi, "token [REDACTED]");
}

function deriveMessage(error: HaaabitApiError, toolName: string | undefined) {
  const message = sanitizeErrorMessage(error.message);

  if (error.code === "HABIT_INACTIVE" || message === "Archived habits are read-only until restored") {
    return "This habit is archived and read-only. Restore it with habits_restore before changing it.";
  }

  if (message === "This habit is not actionable in today right now") {
    return "Today this habit cannot be acted on right now.";
  }

  if (message === "Only boolean habits can use complete" && toolName === "today_complete") {
    return "This habit can't use today_complete because it is quantified; use today_set_total instead.";
  }

  if (message === "Only quantified habits can use set-total" && toolName === "today_set_total") {
    return "This habit can't use today_set_total because it is boolean; use today_complete instead.";
  }

  if (message === "There is no successful today action to undo") {
    return "There is no successful today action to undo yet.";
  }

  return message;
}

function deriveHint(error: HaaabitApiError, toolName: string | undefined) {
  const message = sanitizeErrorMessage(error.message);

  if (error.status === 401 || error.status === 403) {
    return "Check HAAABIT_API_TOKEN and confirm the token can access this Haaabit API.";
  }

  if (error.status === 404) {
    return toolName?.startsWith("habits_") || toolName?.startsWith("today_")
      ? "Check the habitId and make sure that habit still exists for this user."
      : "Check the requested resource identifier and try again.";
  }

  if (error.code === "HABIT_INACTIVE" || message === "Archived habits are read-only until restored") {
    return "Archived habits are read-only; run habits_restore before mutating this habit.";
  }

  if (message === "Only boolean habits can use complete" && toolName === "today_complete") {
    return "Use today_set_total for quantity habits.";
  }

  if (message === "Only quantified habits can use set-total" && toolName === "today_set_total") {
    return "Use today_complete for boolean habits.";
  }

  if (message === "This habit is not actionable in today right now") {
    return "Try again on a scheduled day or after the habit start date.";
  }

  return undefined;
}

function extractIssues(details: unknown) {
  if (
    details &&
    typeof details === "object" &&
    "issues" in details &&
    details.issues &&
    typeof details.issues === "object"
  ) {
    return details.issues;
  }

  return undefined;
}
