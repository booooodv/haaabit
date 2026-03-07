import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must use YYYY-MM-DD");
const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = z.string().trim().min(1).optional();
const nullableOptionalNonEmptyString = z.string().trim().min(1).nullable().optional();

export const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const habitKindSchema = z.enum(["boolean", "quantity"]);

export const habitFrequencySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("daily"),
  }),
  z.object({
    type: z.literal("weekly_count"),
    count: z.number().int().min(1).max(7),
  }),
  z.object({
    type: z.literal("weekdays"),
    days: z.array(weekdaySchema).min(1).max(7),
  }),
  z.object({
    type: z.literal("monthly_count"),
    count: z.number().int().min(1).max(31),
  }),
]);

export const createHabitInputSchema = z
  .object({
    name: nonEmptyString,
    kind: habitKindSchema.default("boolean"),
    description: optionalNonEmptyString,
    category: optionalNonEmptyString,
    targetValue: z.number().int().positive().optional(),
    unit: optionalNonEmptyString,
    startDate: isoDateSchema.optional(),
    isActive: z.boolean().optional(),
    frequency: habitFrequencySchema,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "quantity" && value.targetValue === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "Quantified habits require targetValue",
      });
    }

    if (value.kind === "boolean" && value.targetValue !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "Boolean habits cannot define targetValue",
      });
    }

    if (value.kind === "boolean" && value.unit !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Boolean habits cannot define a unit",
      });
    }

    if (value.frequency.type === "weekdays") {
      const uniqueDays = new Set(value.frequency.days);

      if (uniqueDays.size !== value.frequency.days.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["frequency", "days"],
          message: "Weekdays must be unique",
        });
      }
    }
  });

export const habitListFiltersSchema = z
  .strictObject({
    status: z.enum(["active", "archived"]).default("active"),
    query: optionalNonEmptyString,
    category: optionalNonEmptyString,
    kind: habitKindSchema.optional(),
  })
  .default({
    status: "active",
  });

export const updateHabitInputSchema = z
  .strictObject({
    name: nonEmptyString.optional(),
    description: nullableOptionalNonEmptyString,
    category: nullableOptionalNonEmptyString,
    targetValue: z.number().int().positive().optional(),
    unit: nullableOptionalNonEmptyString,
    startDate: isoDateSchema.optional(),
    frequency: habitFrequencySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable habit field must be provided",
  });

export const habitRecordSchema = z.object({
  id: nonEmptyString,
  userId: nonEmptyString,
  name: nonEmptyString,
  kind: habitKindSchema,
  description: z.string().nullable(),
  category: z.string().nullable(),
  targetValue: z.number().int().positive().nullable(),
  unit: z.string().nullable(),
  startDate: isoDateSchema,
  isActive: z.boolean(),
  frequencyType: z.enum(["daily", "weekly_count", "weekdays", "monthly_count"]),
  frequencyCount: z.number().int().positive().nullable(),
  weekdays: z.array(weekdaySchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const habitDetailStatsSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  totalCompletions: z.number().int().min(0),
  interruptionCount: z.number().int().min(0),
});

export const habitDetailHistoryRowSchema = z.object({
  periodType: z.enum(["day", "week", "month"]),
  periodKey: nonEmptyString,
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  status: z.enum(["completed", "missed"]),
  completionCount: z.number().int().min(0),
  completionTarget: z.number().int().positive(),
  value: z.number().int().min(0).nullable(),
  valueTarget: z.number().int().positive().nullable(),
  unit: z.string().nullable(),
});

export const habitDetailSchema = z.object({
  habit: habitRecordSchema,
  stats: habitDetailStatsSchema,
  recentHistory: z.array(habitDetailHistoryRowSchema),
});

export type Weekday = z.infer<typeof weekdaySchema>;
export type HabitKind = z.infer<typeof habitKindSchema>;
export type HabitFrequency = z.infer<typeof habitFrequencySchema>;
export type CreateHabitInput = z.infer<typeof createHabitInputSchema>;
export type HabitListFilters = z.infer<typeof habitListFiltersSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;
export type HabitRecord = z.infer<typeof habitRecordSchema>;
export type HabitDetailStats = z.infer<typeof habitDetailStatsSchema>;
export type HabitDetailHistoryRow = z.infer<typeof habitDetailHistoryRowSchema>;
export type HabitDetail = z.infer<typeof habitDetailSchema>;
