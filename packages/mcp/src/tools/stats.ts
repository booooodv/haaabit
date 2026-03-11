import { overviewStatsResponseSchema, overviewStatsSchema } from "../contracts/stats.js";
import { z } from "zod";

import type { HaaabitApiClient } from "../client/api-client.js";
import type { ToolOperation } from "./operation-types.js";
import { createReadToolResult } from "./read-results.js";
import type { InventoryTool } from "./catalog.js";

export const statsTools: InventoryTool[] = [
  {
    name: "stats_get_overview",
    method: "GET",
    path: "/stats/overview",
    description: "Read high-level analytics when the user wants a progress review, trend summary, or overall habit health snapshot.",
    responseSchema: overviewStatsResponseSchema,
    outputSchema: z.object({
      stats: overviewStatsSchema,
    }),
    adapter: "overview_to_stats",
  },
];

export function createStatsReadHandlers(client: HaaabitApiClient) {
  const operations = createStatsReadOperations(client);

  return {
    stats_get_overview: async (input: unknown) => {
      const { payload, summary } = await operations.stats_get_overview(input);

      return createReadToolResult("stats_get_overview", payload, summary);
    },
  };
}

export function createStatsReadOperations(client: HaaabitApiClient): Record<string, ToolOperation> {
  return {
    stats_get_overview: async () => {
      const payload = overviewStatsResponseSchema.parse(await client.request("/stats/overview"));

      return {
        payload,
        summary: summarizeOverview(payload),
      };
    },
  };
}

function summarizeOverview(payload: {
  overview: {
    metrics: {
      activeHabitCount: number;
      todayCompletionRate: number;
      weeklyCompletionRate: number;
    };
  };
}) {
  const { activeHabitCount, todayCompletionRate, weeklyCompletionRate } = payload.overview.metrics;
  const delta = todayCompletionRate - weeklyCompletionRate;
  const percentToday = toPercent(todayCompletionRate);
  const percentWeek = toPercent(weeklyCompletionRate);
  const direction = delta < 0 ? "behind" : delta > 0 ? "ahead of" : "in line with";

  return `Tracking ${activeHabitCount} active habits. Today's completion rate is ${percentToday}, ${direction} the recent weekly pace of ${percentWeek}.`;
}

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
