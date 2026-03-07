import { z } from "zod";

import {
  todayFrequencyTypeSchema,
  todayHabitKindSchema,
  todaySummarySchema,
  todayWeekdaySchema,
} from "@haaabit/contracts/today";

export const habitDaySchema = z.object({
  todayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekKey: z.string().regex(/^\d{4}-W\d{2}$/),
  weekStartKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  monthStartKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthEndKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: todayWeekdaySchema,
  cutoffHour: z.number().int().min(0).max(23),
  timeZone: z.string().trim().min(1),
});

export const todayHabitSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  kind: todayHabitKindSchema,
  frequencyType: todayFrequencyTypeSchema,
  frequencyCount: z.number().int().positive().nullable(),
  targetValue: z.number().int().positive().nullable(),
  unit: z.string().trim().min(1).nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekdays: z.array(todayWeekdaySchema),
});

export const todayDayStateSchema = z.object({
  habitId: z.string().trim().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().int().nonnegative().nullable(),
  completed: z.boolean(),
});

export const todayPeriodProgressSchema = z.object({
  habitId: z.string().trim().min(1),
  period: z.enum(["week", "month"]),
  periodKey: z.string().trim().min(1),
  completions: z.number().int().nonnegative(),
});

export const buildTodaySummaryInputSchema = z.object({
  day: habitDaySchema,
  habits: z.array(todayHabitSchema),
  dayStates: z.array(todayDayStateSchema),
  periodProgress: z.array(todayPeriodProgressSchema),
});

export function parseBuildTodaySummaryInput(input: unknown) {
  return buildTodaySummaryInputSchema.parse(input);
}

export function parseTodaySummary(input: unknown) {
  return todaySummarySchema.parse(input);
}

export type HabitDayInput = z.infer<typeof habitDaySchema>;
export type TodayHabitInput = z.infer<typeof todayHabitSchema>;
export type TodayDayStateInput = z.infer<typeof todayDayStateSchema>;
export type TodayPeriodProgressInput = z.infer<typeof todayPeriodProgressSchema>;
export type BuildTodaySummaryInput = z.infer<typeof buildTodaySummaryInputSchema>;
