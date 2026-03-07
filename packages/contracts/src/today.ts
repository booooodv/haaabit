import { z } from "zod";

const isoDateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD");
const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/, "monthKey must use YYYY-MM");
const weekKeySchema = z.string().regex(/^\d{4}-W\d{2}$/, "weekKey must use YYYY-Www");
const nonEmptyString = z.string().trim().min(1);

export const todayStatusSchema = z.enum(["pending", "completed"]);
export const todayHabitKindSchema = z.enum(["boolean", "quantity"]);
export const todayFrequencyTypeSchema = z.enum(["daily", "weekly_count", "weekdays", "monthly_count"]);
export const todayWeekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const todayProgressSchema = z.object({
  currentValue: z.number().int().nonnegative().nullable(),
  targetValue: z.number().int().positive().nullable(),
  unit: nonEmptyString.nullable(),
  periodCompletions: z.number().int().nonnegative().nullable(),
  periodTarget: z.number().int().positive().nullable(),
});

export const todayItemSchema = z.object({
  habitId: nonEmptyString,
  name: nonEmptyString,
  kind: todayHabitKindSchema,
  frequencyType: todayFrequencyTypeSchema,
  status: todayStatusSchema,
  date: isoDateKeySchema,
  progress: todayProgressSchema,
});

export const todaySummarySchema = z.object({
  date: isoDateKeySchema,
  totalCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1),
  pendingItems: z.array(todayItemSchema),
  completedItems: z.array(todayItemSchema),
});

export const todayPeriodKeySchema = z.object({
  date: isoDateKeySchema,
  weekKey: weekKeySchema,
  monthKey: monthKeySchema,
});

export const todayAffectedHabitSchema = z.object({
  id: nonEmptyString,
  userId: nonEmptyString,
  name: nonEmptyString,
  kind: todayHabitKindSchema,
  frequencyType: todayFrequencyTypeSchema,
  frequencyCount: z.number().int().positive().nullable(),
  targetValue: z.number().int().positive().nullable(),
  unit: nonEmptyString.nullable(),
  startDate: isoDateKeySchema,
  weekdays: z.array(todayWeekdaySchema),
});

export const todaySummaryResponseSchema = z.object({
  summary: todaySummarySchema,
});

export const todayActionResponseSchema = z.object({
  affectedHabit: todayAffectedHabitSchema,
  summary: todaySummarySchema,
});

export type TodayStatus = z.infer<typeof todayStatusSchema>;
export type TodayHabitKind = z.infer<typeof todayHabitKindSchema>;
export type TodayFrequencyType = z.infer<typeof todayFrequencyTypeSchema>;
export type TodayWeekday = z.infer<typeof todayWeekdaySchema>;
export type TodayProgress = z.infer<typeof todayProgressSchema>;
export type TodayItem = z.infer<typeof todayItemSchema>;
export type TodaySummary = z.infer<typeof todaySummarySchema>;
export type TodayAffectedHabit = z.infer<typeof todayAffectedHabitSchema>;
