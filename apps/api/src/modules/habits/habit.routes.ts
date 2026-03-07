import type { FastifyInstance } from "fastify";

import {
  commonAuthErrorResponses,
  commonBadRequestResponses,
  commonNotFoundResponse,
  habitInactiveResponse,
  habitPathParamsSchema,
} from "@haaabit/contracts/api";
import {
  createHabitInputSchema,
  habitDetailResponseSchema,
  habitItemResponseSchema,
  habitListFiltersSchema,
  habitListResponseSchema,
  updateHabitInputSchema,
} from "@haaabit/contracts/habits";

import {
  archiveHabitHandler,
  createHabitHandler,
  getHabitDetailHandler,
  listHabitsHandler,
  restoreHabitHandler,
  updateHabitHandler,
} from "./habit.controller";
import type { PublicApiRouteDefinition } from "../../plugins/openapi";

export const habitApiRouteDefinitions: PublicApiRouteDefinition[] = [
  {
    method: "GET",
    path: "/api/habits",
    operationId: "listHabits",
    summary: "List habits",
    description: "Returns the authenticated user's habits filtered by status, search query, category, or kind.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      query: habitListFiltersSchema,
    },
    responses: {
      200: {
        description: "The requested habit collection.",
        schema: habitListResponseSchema,
        examples: {
          activeHabits: {
            summary: "Active habits",
            value: {
              items: [
                {
                  id: "habit_123",
                  userId: "user_123",
                  name: "Deep Work",
                  kind: "quantity",
                  description: "Focused blocks",
                  category: "focus",
                  targetValue: 4,
                  unit: "blocks",
                  startDate: "2026-03-01",
                  isActive: true,
                  frequencyType: "daily",
                  frequencyCount: null,
                  weekdays: [],
                  createdAt: "2026-03-01T08:00:00.000Z",
                  updatedAt: "2026-03-01T08:00:00.000Z",
                },
              ],
            },
          },
        },
      },
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "POST",
    path: "/api/habits",
    operationId: "createHabit",
    summary: "Create a habit",
    description: "Creates a new habit for the authenticated user and returns the full saved resource.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      body: createHabitInputSchema,
      bodyExamples: {
        quantityHabit: {
          summary: "Quantified daily habit",
          value: {
            name: "Deep Work",
            kind: "quantity",
            targetValue: 4,
            unit: "blocks",
            category: "focus",
            frequency: {
              type: "daily",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "The created habit.",
        schema: habitItemResponseSchema,
        examples: {
          createdHabit: {
            summary: "Created quantity habit",
            value: {
              item: {
                id: "habit_123",
                userId: "user_123",
                name: "Deep Work",
                kind: "quantity",
                description: null,
                category: "focus",
                targetValue: 4,
                unit: "blocks",
                startDate: "2026-03-01",
                isActive: true,
                frequencyType: "daily",
                frequencyCount: null,
                weekdays: [],
                createdAt: "2026-03-01T08:00:00.000Z",
                updatedAt: "2026-03-01T08:00:00.000Z",
              },
            },
          },
        },
      },
      400: commonBadRequestResponses.invalidHabitPayload,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "GET",
    path: "/api/habits/:habitId",
    operationId: "getHabit",
    summary: "Get habit detail",
    description: "Returns the full habit detail payload including summary stats, recent history, and trends.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      params: habitPathParamsSchema,
    },
    responses: {
      200: {
        description: "The requested habit detail.",
        schema: habitDetailResponseSchema,
        examples: {
          habitDetail: {
            summary: "Habit detail",
            value: {
              item: {
                habit: {
                  id: "habit_123",
                  userId: "user_123",
                  name: "Deep Work",
                  kind: "quantity",
                  description: null,
                  category: "focus",
                  targetValue: 4,
                  unit: "blocks",
                  startDate: "2026-03-01",
                  isActive: true,
                  frequencyType: "daily",
                  frequencyCount: null,
                  weekdays: [],
                  createdAt: "2026-03-01T08:00:00.000Z",
                  updatedAt: "2026-03-02T08:00:00.000Z",
                },
                stats: {
                  currentStreak: 2,
                  longestStreak: 5,
                  totalCompletions: 12,
                  interruptionCount: 1,
                },
                recentHistory: [],
                trends: {
                  last7Days: Array.from({ length: 7 }, (_, index) => ({
                    date: `2026-03-${String(index + 5).padStart(2, "0")}`,
                    status: "pending",
                    completionRate: null,
                    completedCount: 0,
                    completionTarget: 1,
                    value: 0,
                    valueTarget: 4,
                  })),
                  last30Days: Array.from({ length: 30 }, (_, index) => ({
                    date: `2026-02-${String(index + 1).padStart(2, "0")}`,
                    status: "not_due",
                    completionRate: null,
                    completedCount: 0,
                    completionTarget: 1,
                    value: 0,
                    valueTarget: 4,
                  })),
                },
              },
            },
          },
        },
      },
      404: commonNotFoundResponse,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "PATCH",
    path: "/api/habits/:habitId",
    operationId: "updateHabit",
    summary: "Update a habit",
    description: "Updates editable habit fields and returns the latest full habit resource.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      params: habitPathParamsSchema,
      body: updateHabitInputSchema,
      bodyExamples: {
        renameHabit: {
          summary: "Rename and retarget",
          value: {
            name: "Deep Work PM",
            targetValue: 5,
          },
        },
      },
    },
    responses: {
      200: {
        description: "The updated habit.",
        schema: habitItemResponseSchema,
        examples: {
          updatedHabit: {
            summary: "Updated habit",
            value: {
              item: {
                id: "habit_123",
                userId: "user_123",
                name: "Deep Work PM",
                kind: "quantity",
                description: null,
                category: "focus",
                targetValue: 5,
                unit: "blocks",
                startDate: "2026-03-01",
                isActive: true,
                frequencyType: "daily",
                frequencyCount: null,
                weekdays: [],
                createdAt: "2026-03-01T08:00:00.000Z",
                updatedAt: "2026-03-03T08:00:00.000Z",
              },
            },
          },
        },
      },
      400: commonBadRequestResponses.invalidHabitPayload,
      404: commonNotFoundResponse,
      409: habitInactiveResponse,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "POST",
    path: "/api/habits/:habitId/archive",
    operationId: "archiveHabit",
    summary: "Archive a habit",
    description: "Archives the habit immediately while preserving its historical data.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      params: habitPathParamsSchema,
    },
    responses: {
      200: {
        description: "The archived habit.",
        schema: habitItemResponseSchema,
        examples: {
          archivedHabit: {
            summary: "Archived habit",
            value: {
              item: {
                id: "habit_123",
                userId: "user_123",
                name: "Deep Work",
                kind: "quantity",
                description: null,
                category: "focus",
                targetValue: 4,
                unit: "blocks",
                startDate: "2026-03-01",
                isActive: false,
                frequencyType: "daily",
                frequencyCount: null,
                weekdays: [],
                createdAt: "2026-03-01T08:00:00.000Z",
                updatedAt: "2026-03-03T08:00:00.000Z",
              },
            },
          },
        },
      },
      404: commonNotFoundResponse,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "POST",
    path: "/api/habits/:habitId/restore",
    operationId: "restoreHabit",
    summary: "Restore an archived habit",
    description: "Restores an archived habit and makes it writable again.",
    tags: ["Habits"],
    security: [{ BearerAuth: [] }],
    request: {
      params: habitPathParamsSchema,
    },
    responses: {
      200: {
        description: "The restored habit.",
        schema: habitItemResponseSchema,
        examples: {
          restoredHabit: {
            summary: "Restored habit",
            value: {
              item: {
                id: "habit_123",
                userId: "user_123",
                name: "Deep Work",
                kind: "quantity",
                description: null,
                category: "focus",
                targetValue: 4,
                unit: "blocks",
                startDate: "2026-03-01",
                isActive: true,
                frequencyType: "daily",
                frequencyCount: null,
                weekdays: [],
                createdAt: "2026-03-01T08:00:00.000Z",
                updatedAt: "2026-03-04T08:00:00.000Z",
              },
            },
          },
        },
      },
      404: commonNotFoundResponse,
      ...commonAuthErrorResponses,
    },
  },
];

export async function registerHabitRoutes(app: FastifyInstance) {
  app.get("/api/habits", listHabitsHandler);
  app.post("/api/habits", createHabitHandler);
  app.get("/api/habits/:habitId", getHabitDetailHandler);
  app.patch("/api/habits/:habitId", updateHabitHandler);
  app.post("/api/habits/:habitId/archive", archiveHabitHandler);
  app.post("/api/habits/:habitId/restore", restoreHabitHandler);
}
