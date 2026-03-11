type HaaabitApiErrorLike = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export type HaaabitToolErrorPayload = {
  category: string;
  status: number;
  code: string;
  message: string;
  hint?: string;
  issues?: unknown;
};

export function toToolErrorPayload(
  error: HaaabitApiErrorLike,
  context: {
    toolName?: string;
  } = {},
): HaaabitToolErrorPayload {
  const message = deriveMessage(error, context.toolName);

  return {
    category: categorizeError(error),
    status: error.status,
    code: error.code,
    message,
    ...(extractIssues(error.details) ? { issues: extractIssues(error.details) } : {}),
    ...(deriveHint(error, context.toolName) ? { hint: deriveHint(error, context.toolName) } : {}),
  };
}

export function sanitizeErrorMessage(message: string) {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/token\s+\S+/gi, "token [REDACTED]");
}

function categorizeError(error: HaaabitApiErrorLike) {
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

function deriveMessage(error: HaaabitApiErrorLike, toolName: string | undefined) {
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

function deriveHint(error: HaaabitApiErrorLike, toolName: string | undefined) {
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
