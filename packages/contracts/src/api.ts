import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const fieldErrorMessagesSchema = z.array(z.string()).optional();
const dateTimeStringSchema = z.string().datetime({ offset: true });

export const apiAccessTokenResponseSchema = z.object({
  token: z.string().nullable(),
  docsPath: nonEmptyString,
  specPath: nonEmptyString,
});

export const habitPathParamsSchema = z.object({
  habitId: nonEmptyString,
});

export const publicApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "HABIT_INACTIVE",
]);

export const validationIssuesSchema = z.object({
  formErrors: z.array(z.string()),
  fieldErrors: z.record(z.string(), fieldErrorMessagesSchema),
});

export const unauthorizedErrorSchema = z.object({
  code: z.literal("UNAUTHORIZED"),
  message: nonEmptyString,
});

export const forbiddenErrorSchema = z.object({
  code: z.literal("FORBIDDEN"),
  message: nonEmptyString,
});

export const badRequestErrorSchema = z.object({
  code: z.literal("BAD_REQUEST"),
  message: nonEmptyString,
  issues: validationIssuesSchema.optional(),
});

export const notFoundErrorSchema = z.object({
  code: z.literal("NOT_FOUND"),
  message: nonEmptyString,
});

export const habitInactiveErrorSchema = z.object({
  code: z.literal("HABIT_INACTIVE"),
  message: nonEmptyString,
});

export const commonAuthErrorResponses = {
  401: {
    description: "Missing or invalid authentication.",
    schema: unauthorizedErrorSchema,
    examples: {
      unauthenticated: {
        summary: "Authentication required",
        value: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      },
    },
  },
  403: {
    description: "Authenticated but forbidden for the current user.",
    schema: forbiddenErrorSchema,
    examples: {
      forbidden: {
        summary: "Forbidden",
        value: {
          code: "FORBIDDEN",
          message: "Forbidden",
        },
      },
    },
  },
} as const;

export const commonNotFoundResponse = {
  description: "The requested resource does not exist for the authenticated user.",
  schema: notFoundErrorSchema,
  examples: {
    missingHabit: {
      summary: "Missing habit",
      value: {
        code: "NOT_FOUND",
        message: "Habit not found",
      },
    },
  },
} as const;

export const commonBadRequestResponses = {
  invalidHabitPayload: {
    description: "The submitted habit payload is invalid.",
    schema: badRequestErrorSchema,
    examples: {
      invalidHabit: {
        summary: "Invalid habit payload",
        value: {
          code: "BAD_REQUEST",
          message: "Invalid habit payload",
          issues: {
            formErrors: [],
            fieldErrors: {
              targetValue: ["Quantified habits require targetValue"],
            },
          },
        },
      },
    },
  },
  invalidTodayPayload: {
    description: "The submitted today action payload is invalid or incompatible with the habit kind.",
    schema: badRequestErrorSchema,
    examples: {
      incompatibleAction: {
        summary: "Incompatible action",
        value: {
          code: "BAD_REQUEST",
          message: "Only boolean habits can use complete",
        },
      },
      notActionableToday: {
        summary: "Habit is not actionable in today",
        value: {
          code: "BAD_REQUEST",
          message: "This habit is not actionable in today right now",
        },
      },
      nothingToUndo: {
        summary: "No successful today action to undo",
        value: {
          code: "BAD_REQUEST",
          message: "There is no successful today action to undo",
        },
      },
    },
  },
} as const;

export const habitInactiveResponse = {
  description: "The habit is archived and must be restored before it can be changed.",
  schema: habitInactiveErrorSchema,
  examples: {
    archivedHabit: {
      summary: "Archived habit is read-only",
      value: {
        code: "HABIT_INACTIVE",
        message: "Archived habits are read-only until restored",
      },
    },
  },
} as const;

export type ApiAccessTokenResponse = z.infer<typeof apiAccessTokenResponseSchema>;
export type PublicApiErrorCode = z.infer<typeof publicApiErrorCodeSchema>;
export type ValidationIssues = z.infer<typeof validationIssuesSchema>;
export type UnauthorizedError = z.infer<typeof unauthorizedErrorSchema>;
export type ForbiddenError = z.infer<typeof forbiddenErrorSchema>;
export type BadRequestError = z.infer<typeof badRequestErrorSchema>;
export type NotFoundError = z.infer<typeof notFoundErrorSchema>;
export type HabitInactiveError = z.infer<typeof habitInactiveErrorSchema>;
export type DateTimeString = z.infer<typeof dateTimeStringSchema>;
