import type { FastifyInstance } from "fastify";

import { commonAuthErrorResponses } from "@haaabit/contracts/api";
import { overviewStatsResponseSchema } from "@haaabit/contracts/stats";

import { getOverviewStatsHandler } from "./stats.controller";
import type { PublicApiRouteDefinition } from "../../plugins/openapi";

export const statsApiRouteDefinitions: PublicApiRouteDefinition[] = [
  {
    method: "GET",
    path: "/api/stats/overview",
    operationId: "getOverviewStats",
    summary: "Get overview analytics",
    description: "Returns account-level metrics, recent completion trends, and active-habit stability ranking.",
    tags: ["Stats"],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "The overview analytics payload.",
        schema: overviewStatsResponseSchema,
        examples: {
          overviewStats: {
            summary: "Overview analytics",
            value: {
              overview: {
                date: "2026-03-11",
                metrics: {
                  todayCompletedCount: 2,
                  todayCompletionRate: 0.5,
                  weeklyCompletionRate: 0.71,
                  activeHabitCount: 3,
                },
                trends: {
                  last7Days: Array.from({ length: 7 }, (_, index) => ({
                    date: `2026-03-${String(index + 5).padStart(2, "0")}`,
                    completedCount: index % 2 === 0 ? 2 : 1,
                    totalCount: 3,
                    completionRate: index % 2 === 0 ? 0.67 : 0.33,
                  })),
                  last30Days: Array.from({ length: 30 }, (_, index) => ({
                    date: `2026-02-${String(index + 1).padStart(2, "0")}`,
                    completedCount: index % 3 === 0 ? 3 : 2,
                    totalCount: 4,
                    completionRate: index % 3 === 0 ? 0.75 : 0.5,
                  })),
                },
                stabilityRanking: [
                  {
                    habitId: "habit_123",
                    name: "Deep Work",
                    kind: "quantity",
                    frequencyType: "daily",
                    completionRate: 0.8,
                    completedCount: 8,
                    totalCount: 10,
                  },
                ],
              },
            },
          },
        },
      },
      ...commonAuthErrorResponses,
    },
  },
];

export async function registerStatsRoutes(app: FastifyInstance) {
  app.get("/api/stats/overview", getOverviewStatsHandler);
}
