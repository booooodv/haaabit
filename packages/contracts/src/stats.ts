import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD");
const nonEmptyString = z.string().trim().min(1);
const completionRateSchema = z.number().min(0).max(1);

export const statsHabitKindSchema = z.enum(["boolean", "quantity"]);
export const statsFrequencyTypeSchema = z.enum(["daily", "weekly_count", "weekdays", "monthly_count"]);

export const overviewTrendPointSchema = z.object({
  date: isoDateSchema,
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  completionRate: completionRateSchema,
});

export const stabilityRankingEntrySchema = z.object({
  habitId: nonEmptyString,
  name: nonEmptyString,
  kind: statsHabitKindSchema,
  frequencyType: statsFrequencyTypeSchema,
  completionRate: completionRateSchema,
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export const overviewMetricsSchema = z.object({
  todayCompletedCount: z.number().int().nonnegative(),
  todayCompletionRate: completionRateSchema,
  weeklyCompletionRate: completionRateSchema,
  activeHabitCount: z.number().int().nonnegative(),
});

export const overviewStatsSchema = z.object({
  date: isoDateSchema,
  metrics: overviewMetricsSchema,
  trends: z.object({
    last7Days: z.array(overviewTrendPointSchema).length(7),
    last30Days: z.array(overviewTrendPointSchema).length(30),
  }),
  stabilityRanking: z.array(stabilityRankingEntrySchema),
});

export const overviewStatsResponseSchema = z.object({
  overview: overviewStatsSchema,
});

export type OverviewTrendPoint = z.infer<typeof overviewTrendPointSchema>;
export type StabilityRankingEntry = z.infer<typeof stabilityRankingEntrySchema>;
export type OverviewMetrics = z.infer<typeof overviewMetricsSchema>;
export type OverviewStats = z.infer<typeof overviewStatsSchema>;
