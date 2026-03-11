type HaaabitApiErrorLike = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export type HaaabitToolErrorCategory =
  | "timeout"
  | "network"
  | "auth"
  | "validation"
  | "wrong_kind"
  | "not_found"
  | "conflict"
  | "upstream"
  | "unknown";

export type HaaabitToolErrorResolution =
  | "retry"
  | "reauth"
  | "fix_input"
  | "switch_tool"
  | "check_habit_id"
  | "restore_habit"
  | "wait_until_due"
  | "inspect_upstream";

export type HaaabitToolErrorPayload = {
  category: HaaabitToolErrorCategory;
  status: number;
  code: string;
  message: string;
  hint?: string;
  issues?: unknown;
  retryable?: boolean;
  resolution?: HaaabitToolErrorResolution;
  suggestedTool?: string;
};

export function toToolErrorPayload(
  error: HaaabitApiErrorLike,
  context: {
    toolName?: string;
  } = {},
): HaaabitToolErrorPayload {
  const category = categorizeError(error, context.toolName);
  const hint = deriveHint(error, category, context.toolName);
  const resolution = deriveResolution(error, category);
  const suggestedTool = deriveSuggestedTool(error, category, context.toolName);

  return {
    category,
    status: error.status,
    code: error.code,
    message: deriveMessage(error, context.toolName),
    ...(extractIssues(error.details) ? { issues: extractIssues(error.details) } : {}),
    ...(hint ? { hint } : {}),
    ...(typeof isRetryable(category) === "boolean" ? { retryable: isRetryable(category) } : {}),
    ...(resolution ? { resolution } : {}),
    ...(suggestedTool ? { suggestedTool } : {}),
  };
}

export function sanitizeErrorMessage(message: string) {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/token\s+\S+/gi, "token [REDACTED]");
}

function categorizeError(error: HaaabitApiErrorLike, toolName: string | undefined): HaaabitToolErrorCategory {
  if (error.code === "TIMEOUT" || error.status === 504) {
    return "timeout";
  }

  if (error.code === "NETWORK_ERROR") {
    return "network";
  }

  if (error.status === 401 || error.status === 403) {
    return "auth";
  }

  if (isWrongKindError(error, toolName)) {
    return "wrong_kind";
  }

  if (error.status === 404) {
    return "not_found";
  }

  if (error.status === 409) {
    return "conflict";
  }

  if (error.status >= 500) {
    return "upstream";
  }

  if (error.status === 400) {
    return "validation";
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

function deriveHint(
  error: HaaabitApiErrorLike,
  category: HaaabitToolErrorCategory,
  toolName: string | undefined,
) {
  const message = sanitizeErrorMessage(error.message);

  switch (category) {
    case "timeout":
      return "Retry the same tool call. If this keeps timing out, check API latency or raise the timeout budget.";
    case "network":
      return "Retry after confirming HAAABIT_API_URL is reachable from this runtime.";
    case "auth":
      return "Check HAAABIT_API_TOKEN and confirm the token can access this Haaabit API.";
    case "not_found":
      return toolName?.startsWith("habits_") || toolName?.startsWith("today_")
        ? "Check the habitId and make sure that habit still exists for this user."
        : "Check the requested resource identifier and try again.";
    case "wrong_kind":
      if (message === "Only boolean habits can use complete" && toolName === "today_complete") {
        return "Use today_set_total for quantity habits.";
      }

      if (message === "Only quantified habits can use set-total" && toolName === "today_set_total") {
        return "Use today_complete for boolean habits.";
      }
      return "Use the today tool that matches the habit kind.";
    case "conflict":
      if (error.code === "HABIT_INACTIVE" || message === "Archived habits are read-only until restored") {
        return "Archived habits are read-only; run habits_restore before mutating this habit.";
      }
      return undefined;
    case "validation":
      if (message === "This habit is not actionable in today right now") {
        return "Try again on a scheduled day or after the habit start date.";
      }
      return undefined;
    case "upstream":
      return "The Haaabit API failed upstream. Retry once, then inspect server health if it persists.";
    default:
      return undefined;
  }
}

function deriveResolution(
  error: HaaabitApiErrorLike,
  category: HaaabitToolErrorCategory,
): HaaabitToolErrorResolution | undefined {
  const message = sanitizeErrorMessage(error.message);

  switch (category) {
    case "timeout":
    case "network":
      return "retry";
    case "auth":
      return "reauth";
    case "wrong_kind":
      return "switch_tool";
    case "not_found":
      return "check_habit_id";
    case "conflict":
      if (error.code === "HABIT_INACTIVE" || message === "Archived habits are read-only until restored") {
        return "restore_habit";
      }
      return undefined;
    case "validation":
      if (message === "This habit is not actionable in today right now") {
        return "wait_until_due";
      }
      return "fix_input";
    case "upstream":
      return "inspect_upstream";
    default:
      return undefined;
  }
}

function deriveSuggestedTool(
  error: HaaabitApiErrorLike,
  category: HaaabitToolErrorCategory,
  toolName: string | undefined,
) {
  const message = sanitizeErrorMessage(error.message);

  if (category === "wrong_kind") {
    if (message === "Only boolean habits can use complete" && toolName === "today_complete") {
      return "today_set_total";
    }

    if (message === "Only quantified habits can use set-total" && toolName === "today_set_total") {
      return "today_complete";
    }
  }

  if (category === "conflict" && (error.code === "HABIT_INACTIVE" || message === "Archived habits are read-only until restored")) {
    return "habits_restore";
  }

  return undefined;
}

function isRetryable(category: HaaabitToolErrorCategory) {
  if (category === "timeout" || category === "network" || category === "upstream") {
    return true;
  }

  if (category === "auth" || category === "validation" || category === "wrong_kind" || category === "not_found" || category === "conflict") {
    return false;
  }

  return undefined;
}

function isWrongKindError(error: HaaabitApiErrorLike, toolName: string | undefined) {
  const message = sanitizeErrorMessage(error.message);

  return (
    (message === "Only boolean habits can use complete" && toolName === "today_complete") ||
    (message === "Only quantified habits can use set-total" && toolName === "today_set_total")
  );
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
