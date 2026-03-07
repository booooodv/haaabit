import type { FastifyInstance } from "fastify";

import {
  commonAuthErrorResponses,
  commonBadRequestResponses,
  habitInactiveResponse,
} from "@haaabit/contracts/api";
import { completeHabitInputSchema, setHabitTotalInputSchema, undoHabitInputSchema } from "@haaabit/contracts/checkins";
import { todayActionResponseSchema, todaySummaryResponseSchema } from "@haaabit/contracts/today";

import {
  completeTodayHabitHandler,
  getTodayHandler,
  setTodayHabitTotalHandler,
  undoTodayHabitHandler,
} from "./today.controller";
import type { PublicApiRouteDefinition } from "../../plugins/openapi";

export const todayApiRouteDefinitions: PublicApiRouteDefinition[] = [
  {
    method: "GET",
    path: "/api/today",
    operationId: "getTodaySummary",
    summary: "Get today summary",
    description: "Returns today's pending and completed habits for the authenticated user.",
    tags: ["Today"],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "The canonical today summary.",
        schema: todaySummaryResponseSchema,
        examples: {
          todaySummary: {
            summary: "Pending and completed items",
            value: {
              summary: {
                date: "2026-03-11",
                totalCount: 2,
                pendingCount: 1,
                completedCount: 1,
                completionRate: 0.5,
                pendingItems: [
                  {
                    habitId: "habit_pending",
                    name: "Read",
                    kind: "quantity",
                    frequencyType: "daily",
                    status: "pending",
                    date: "2026-03-11",
                    progress: {
                      currentValue: 5,
                      targetValue: 10,
                      unit: "pages",
                      periodCompletions: null,
                      periodTarget: null,
                    },
                  },
                ],
                completedItems: [
                  {
                    habitId: "habit_done",
                    name: "Morning walk",
                    kind: "boolean",
                    frequencyType: "daily",
                    status: "completed",
                    date: "2026-03-11",
                    progress: {
                      currentValue: null,
                      targetValue: null,
                      unit: null,
                      periodCompletions: null,
                      periodTarget: null,
                    },
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
  {
    method: "POST",
    path: "/api/today/complete",
    operationId: "completeTodayHabit",
    summary: "Complete a boolean habit for today",
    description: "Marks a boolean habit complete and returns the affected habit plus the refreshed today summary.",
    tags: ["Today"],
    security: [{ BearerAuth: [] }],
    request: {
      body: completeHabitInputSchema,
      bodyExamples: {
        completeHabit: {
          summary: "Complete a boolean habit",
          value: {
            habitId: "habit_boolean",
            source: "ai",
          },
        },
      },
    },
    responses: {
      200: {
        description: "The affected habit and refreshed today summary.",
        schema: todayActionResponseSchema,
        examples: {
          completedHabit: {
            summary: "Boolean habit completed",
            value: {
              affectedHabit: {
                id: "habit_boolean",
                userId: "user_123",
                name: "Morning walk",
                kind: "boolean",
                frequencyType: "daily",
                frequencyCount: null,
                targetValue: null,
                unit: null,
                startDate: "2026-03-01",
                weekdays: [],
              },
              summary: {
                date: "2026-03-11",
                totalCount: 1,
                pendingCount: 0,
                completedCount: 1,
                completionRate: 1,
                pendingItems: [],
                completedItems: [
                  {
                    habitId: "habit_boolean",
                    name: "Morning walk",
                    kind: "boolean",
                    frequencyType: "daily",
                    status: "completed",
                    date: "2026-03-11",
                    progress: {
                      currentValue: null,
                      targetValue: null,
                      unit: null,
                      periodCompletions: null,
                      periodTarget: null,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      400: commonBadRequestResponses.invalidTodayPayload,
      409: habitInactiveResponse,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "POST",
    path: "/api/today/set-total",
    operationId: "setTodayHabitTotal",
    summary: "Set today's total for a quantified habit",
    description: "Sets the quantified total for today and returns the affected habit plus the refreshed today summary.",
    tags: ["Today"],
    security: [{ BearerAuth: [] }],
    request: {
      body: setHabitTotalInputSchema,
      bodyExamples: {
        quantifiedCheckin: {
          summary: "Set total for a quantified habit",
          value: {
            habitId: "habit_quantity",
            total: 10,
            source: "ai",
          },
        },
      },
    },
    responses: {
      200: {
        description: "The affected habit and refreshed today summary.",
        schema: todayActionResponseSchema,
        examples: {
          quantifiedCompletion: {
            summary: "Quantified habit total saved",
            value: {
              affectedHabit: {
                id: "habit_quantity",
                userId: "user_123",
                name: "Read",
                kind: "quantity",
                frequencyType: "daily",
                frequencyCount: null,
                targetValue: 10,
                unit: "pages",
                startDate: "2026-03-01",
                weekdays: [],
              },
              summary: {
                date: "2026-03-11",
                totalCount: 1,
                pendingCount: 0,
                completedCount: 1,
                completionRate: 1,
                pendingItems: [],
                completedItems: [
                  {
                    habitId: "habit_quantity",
                    name: "Read",
                    kind: "quantity",
                    frequencyType: "daily",
                    status: "completed",
                    date: "2026-03-11",
                    progress: {
                      currentValue: 10,
                      targetValue: 10,
                      unit: "pages",
                      periodCompletions: null,
                      periodTarget: null,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      400: {
        ...commonBadRequestResponses.invalidTodayPayload,
        examples: {
          invalidTotal: {
            summary: "Wrong action for habit kind",
            value: {
              code: "BAD_REQUEST",
              message: "Only quantified habits can use set-total",
            },
          },
        },
      },
      409: habitInactiveResponse,
      ...commonAuthErrorResponses,
    },
  },
  {
    method: "POST",
    path: "/api/today/undo",
    operationId: "undoTodayHabit",
    summary: "Undo today's latest habit mutation",
    description: "Restores the prior value for today's habit state and returns the affected habit plus the refreshed today summary.",
    tags: ["Today"],
    security: [{ BearerAuth: [] }],
    request: {
      body: undoHabitInputSchema,
      bodyExamples: {
        undoMutation: {
          summary: "Undo today's latest mutation",
          value: {
            habitId: "habit_quantity",
            source: "ai",
          },
        },
      },
    },
    responses: {
      200: {
        description: "The affected habit and refreshed today summary after undo.",
        schema: todayActionResponseSchema,
        examples: {
          undoneMutation: {
            summary: "Mutation undone",
            value: {
              affectedHabit: {
                id: "habit_quantity",
                userId: "user_123",
                name: "Read",
                kind: "quantity",
                frequencyType: "daily",
                frequencyCount: null,
                targetValue: 10,
                unit: "pages",
                startDate: "2026-03-01",
                weekdays: [],
              },
              summary: {
                date: "2026-03-11",
                totalCount: 1,
                pendingCount: 1,
                completedCount: 0,
                completionRate: 0,
                pendingItems: [
                  {
                    habitId: "habit_quantity",
                    name: "Read",
                    kind: "quantity",
                    frequencyType: "daily",
                    status: "pending",
                    date: "2026-03-11",
                    progress: {
                      currentValue: 0,
                      targetValue: 10,
                      unit: "pages",
                      periodCompletions: null,
                      periodTarget: null,
                    },
                  },
                ],
                completedItems: [],
              },
            },
          },
        },
      },
      409: habitInactiveResponse,
      ...commonAuthErrorResponses,
    },
  },
];

export async function registerTodayRoutes(app: FastifyInstance) {
  app.get("/api/today", getTodayHandler);
  app.post("/api/today/complete", completeTodayHabitHandler);
  app.post("/api/today/set-total", setTodayHabitTotalHandler);
  app.post("/api/today/undo", undoTodayHabitHandler);
}
