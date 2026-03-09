import { habitPathParamsSchema } from "../contracts/api.js";
import {
  createHabitInputSchema,
  habitDetailResponseSchema,
  habitListFiltersSchema,
  habitItemResponseSchema,
  habitListResponseSchema,
  updateHabitInputSchema,
} from "../contracts/habits.js";
import { z } from "zod";

import type { HaaabitApiClient } from "../client/api-client.js";
import { createMutationToolResult, createReadToolResult, formatNameList } from "./read-results.js";
import type { InventoryTool } from "./inventory.js";

export const editHabitToolInputSchema = z.object({
  habitId: habitPathParamsSchema.shape.habitId,
}).and(updateHabitInputSchema);

export const habitsTools: InventoryTool[] = [
  {
    name: "habits_list",
    method: "GET",
    path: "/habits",
    description: "List habits for the authenticated user.",
    inputSchema: habitListFiltersSchema,
    responseSchema: habitListResponseSchema,
    outputSchema: habitListResponseSchema,
    adapter: "passthrough",
  },
  {
    name: "habits_add",
    method: "POST",
    path: "/habits",
    description: "Create a habit for the authenticated user.",
    inputSchema: createHabitInputSchema,
    responseSchema: habitItemResponseSchema,
    outputSchema: habitItemResponseSchema,
    adapter: "passthrough",
  },
  {
    name: "habits_get_detail",
    method: "GET",
    path: "/habits/:habitId",
    description: "Get full habit detail including stats and trends.",
    inputSchema: habitPathParamsSchema,
    responseSchema: habitDetailResponseSchema,
    outputSchema: habitDetailResponseSchema,
    adapter: "passthrough",
  },
  {
    name: "habits_edit",
    method: "PATCH",
    path: "/habits/:habitId",
    description: "Update an existing habit.",
    inputSchema: editHabitToolInputSchema,
    responseSchema: habitItemResponseSchema,
    outputSchema: habitItemResponseSchema,
    adapter: "passthrough",
  },
  {
    name: "habits_archive",
    method: "POST",
    path: "/habits/:habitId/archive",
    description: "Archive a habit while preserving its history.",
    inputSchema: habitPathParamsSchema,
    responseSchema: habitItemResponseSchema,
    outputSchema: habitItemResponseSchema,
    adapter: "passthrough",
  },
  {
    name: "habits_restore",
    method: "POST",
    path: "/habits/:habitId/restore",
    description: "Restore an archived habit.",
    inputSchema: habitPathParamsSchema,
    responseSchema: habitItemResponseSchema,
    outputSchema: habitItemResponseSchema,
    adapter: "passthrough",
  },
];

export function createHabitsReadHandlers(client: HaaabitApiClient) {
  return {
    habits_list: async (input: unknown) => {
      const parsed = habitListFiltersSchema.parse(input ?? {});
      const payload = habitListResponseSchema.parse(await client.request(createHabitsListPath(parsed)));
      const usesDefaultActiveFilter = isDefaultActiveFilter(parsed);
      const summary = summarizeHabitsList(payload, usesDefaultActiveFilter);

      return createReadToolResult("habits_list", payload, summary);
    },
    habits_get_detail: async (input: unknown) => {
      const parsed = habitPathParamsSchema.parse(input);
      const payload = habitDetailResponseSchema.parse(
        await client.request(`/habits/${encodeURIComponent(parsed.habitId)}`),
      );

      return createReadToolResult("habits_get_detail", payload, summarizeHabitDetail(payload));
    },
  };
}

export function createHabitsWriteHandlers(client: HaaabitApiClient) {
  return {
    habits_add: async (input: unknown) => {
      const parsed = createHabitInputSchema.parse(input);
      const payload = habitItemResponseSchema.parse(
        await client.request("/habits", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(parsed),
        }),
      );

      return createMutationToolResult("habits_add", payload, summarizeCreatedHabit(payload.item));
    },
    habits_edit: async (input: unknown) => {
      const parsed = editHabitToolInputSchema.parse(input);
      const { habitId, ...patch } = parsed;
      const payload = habitItemResponseSchema.parse(
        await client.request(`/habits/${encodeURIComponent(habitId)}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(patch),
        }),
      );

      return createMutationToolResult("habits_edit", payload, summarizeEditedHabit(payload.item, patch));
    },
    habits_archive: async (input: unknown) => {
      const parsed = habitPathParamsSchema.parse(input);
      const payload = habitItemResponseSchema.parse(
        await client.request(`/habits/${encodeURIComponent(parsed.habitId)}/archive`, {
          method: "POST",
        }),
      );

      return createMutationToolResult("habits_archive", payload, summarizeArchivedHabit(payload.item.name));
    },
    habits_restore: async (input: unknown) => {
      const parsed = habitPathParamsSchema.parse(input);
      const payload = habitItemResponseSchema.parse(
        await client.request(`/habits/${encodeURIComponent(parsed.habitId)}/restore`, {
          method: "POST",
        }),
      );

      return createMutationToolResult("habits_restore", payload, summarizeRestoredHabit(payload.item.name));
    },
  };
}

function createHabitsListPath(filters: {
  status: "active" | "archived";
  query?: string;
  category?: string;
  kind?: "boolean" | "quantity";
}) {
  const params = new URLSearchParams();

  params.set("status", filters.status);

  if (filters.query) {
    params.set("query", filters.query);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.kind) {
    params.set("kind", filters.kind);
  }

  return `/habits?${params.toString()}`;
}

function isDefaultActiveFilter(filters: {
  status: "active" | "archived";
  query?: string;
  category?: string;
  kind?: "boolean" | "quantity";
}) {
  return (
    filters.status === "active" &&
    filters.query === undefined &&
    filters.category === undefined &&
    filters.kind === undefined
  );
}

function summarizeHabitsList(
  payload: {
    items: Array<{
      name: string;
    }>;
  },
  usesDefaultActiveFilter: boolean,
) {
  if (payload.items.length === 0) {
    return usesDefaultActiveFilter
      ? "No habits matched the default active filter."
      : "No habits matched the requested filters.";
  }

  const names = formatNameList(payload.items.map((item) => item.name));
  const prefix = usesDefaultActiveFilter
    ? `${payload.items.length} habits matched the default active filter`
    : `${payload.items.length} habits matched the requested filters`;

  return `${prefix}: ${names}.`;
}

function summarizeHabitDetail(payload: {
  item: {
    habit: {
      name: string;
    };
    stats: {
      currentStreak: number;
      longestStreak: number;
    };
    trends: {
      last7Days: Array<{
        status: "completed" | "pending" | "missed" | "not_due";
      }>;
    };
  };
}) {
  const name = payload.item.habit.name;
  const latestPoint = payload.item.trends.last7Days.at(-1);
  const opening = describeLatestTrend(name, latestPoint?.status);
  const { currentStreak, longestStreak } = payload.item.stats;

  return `${opening} Current streak is ${currentStreak}; longest streak is ${longestStreak}.`;
}

function describeLatestTrend(
  habitName: string,
  status: "completed" | "pending" | "missed" | "not_due" | undefined,
) {
  switch (status) {
    case "completed":
      return `${habitName} is already complete today.`;
    case "not_due":
      return `${habitName} is not due today.`;
    case "missed":
      return `${habitName} shows a recent miss and may need attention.`;
    case "pending":
    default:
      return `${habitName} needs attention today.`;
  }
}

function summarizeCreatedHabit(item: {
  name: string;
  kind: "boolean" | "quantity";
  targetValue: number | null;
  unit: string | null;
  category: string | null;
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
  frequencyCount: number | null;
  weekdays: string[];
}) {
  return `Created ${item.name} (${describeHabitShape(item)}).`;
}

function summarizeEditedHabit(
  item: {
    name: string;
    targetValue: number | null;
    unit: string | null;
    category: string | null;
    description: string | null;
    startDate: string;
    frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
    frequencyCount: number | null;
    weekdays: string[];
  },
  patch: Partial<{
    name: string;
    description: string | null;
    category: string | null;
    targetValue: number;
    unit: string | null;
    startDate: string;
    frequency: {
      type: "daily" | "weekly_count" | "weekdays" | "monthly_count";
      count?: number;
      days?: string[];
    };
  }>,
) {
  const changes: string[] = [];

  if (patch.name !== undefined) {
    changes.push(`name ${item.name}`);
  }

  if (patch.description !== undefined) {
    changes.push(item.description ? `description ${item.description}` : "description cleared");
  }

  if (patch.category !== undefined) {
    changes.push(item.category ? `category ${item.category}` : "category cleared");
  }

  if (patch.targetValue !== undefined || patch.unit !== undefined) {
    changes.push(describeTarget(item.targetValue, item.unit));
  }

  if (patch.startDate !== undefined) {
    changes.push(`start date ${item.startDate}`);
  }

  if (patch.frequency !== undefined) {
    changes.push(`frequency ${describeFrequency(item.frequencyType, item.frequencyCount, item.weekdays)}`);
  }

  return `Updated ${item.name}: ${changes.join("; ")}.`;
}

function describeHabitShape(item: {
  kind: "boolean" | "quantity";
  targetValue: number | null;
  unit: string | null;
  category: string | null;
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
  frequencyCount: number | null;
  weekdays: string[];
}) {
  const parts: string[] = [item.kind];

  if (item.kind === "quantity") {
    parts.push(describeTarget(item.targetValue, item.unit));
  }

  parts.push(describeFrequency(item.frequencyType, item.frequencyCount, item.weekdays));

  if (item.category) {
    parts.push(`category ${item.category}`);
  }

  return parts.join(", ");
}

function describeTarget(targetValue: number | null, unit: string | null) {
  if (targetValue === null) {
    return "target cleared";
  }

  return unit ? `target ${targetValue} ${unit}` : `target ${targetValue}`;
}

function describeFrequency(
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count",
  frequencyCount: number | null,
  weekdays: string[],
) {
  switch (frequencyType) {
    case "weekly_count":
      return `${frequencyCount ?? 0} times per week`;
    case "monthly_count":
      return `${frequencyCount ?? 0} times per month`;
    case "weekdays":
      return `weekdays ${weekdays.join(", ")}`;
    case "daily":
    default:
      return "daily";
  }
}

function summarizeArchivedHabit(name: string) {
  return `Archived ${name}. Archived habits are now read-only.`;
}

function summarizeRestoredHabit(name: string) {
  return `Restored ${name}. This habit is usable again.`;
}
