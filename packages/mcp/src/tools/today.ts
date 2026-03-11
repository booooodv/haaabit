import { completeHabitInputSchema, setHabitTotalInputSchema, undoHabitInputSchema } from "../contracts/checkins.js";
import { todayActionResponseSchema, todayAffectedHabitSchema, todaySummaryResponseSchema, todaySummarySchema } from "../contracts/today.js";
import { z } from "zod";

import type { HaaabitApiClient } from "../client/api-client.js";
import type { ToolOperation } from "./operation-types.js";
import { createMutationToolResult, createReadToolResult, formatNameList } from "./read-results.js";
import type { InventoryTool } from "./catalog.js";

export const todayTools: InventoryTool[] = [
  {
    name: "today_get_summary",
    method: "GET",
    path: "/today",
    description: "Read today's canonical checklist first when the user asks what is due, what remains, or whether today is already complete.",
    responseSchema: todaySummaryResponseSchema,
    outputSchema: z.object({
      today: todaySummarySchema,
    }),
    adapter: "summary_to_today",
  },
  {
    name: "today_complete",
    method: "POST",
    path: "/today/complete",
    description: "Mark a boolean habit complete for today only when the user clearly asks to check off a specific today item.",
    inputSchema: completeHabitInputSchema,
    responseSchema: todayActionResponseSchema,
    outputSchema: z.object({
      habit: todayAffectedHabitSchema,
      today: todaySummarySchema,
    }),
    adapter: "action_to_today",
  },
  {
    name: "today_set_total",
    method: "POST",
    path: "/today/set-total",
    description: "Set today's numeric progress for a quantified habit when the user gives a concrete amount, total, or measurement for today.",
    inputSchema: setHabitTotalInputSchema,
    responseSchema: todayActionResponseSchema,
    outputSchema: z.object({
      habit: todayAffectedHabitSchema,
      today: todaySummarySchema,
    }),
    adapter: "action_to_today",
  },
  {
    name: "today_undo",
    method: "POST",
    path: "/today/undo",
    description: "Undo today's latest mutation only when the user explicitly asks to revert or correct the most recent today action.",
    inputSchema: undoHabitInputSchema,
    responseSchema: todayActionResponseSchema,
    outputSchema: z.object({
      habit: todayAffectedHabitSchema,
      today: todaySummarySchema,
    }),
    adapter: "action_to_today",
  },
];

export function createTodayReadHandlers(client: HaaabitApiClient) {
  const operations = createTodayReadOperations(client);

  return {
    today_get_summary: async (input: unknown) => {
      const { payload, summary } = await operations.today_get_summary(input);

      return createReadToolResult("today_get_summary", payload, summary);
    },
  };
}

export function createTodayWriteHandlers(client: HaaabitApiClient) {
  const operations = createTodayWriteOperations(client);

  return {
    today_complete: async (input: unknown) => {
      const { payload, summary } = await operations.today_complete(input);

      return createMutationToolResult("today_complete", payload, summary);
    },
    today_set_total: async (input: unknown) => {
      const { payload, summary } = await operations.today_set_total(input);

      return createMutationToolResult("today_set_total", payload, summary);
    },
    today_undo: async (input: unknown) => {
      const { payload, summary } = await operations.today_undo(input);

      return createMutationToolResult("today_undo", payload, summary);
    },
  };
}

export function createTodayReadOperations(client: HaaabitApiClient): Record<string, ToolOperation> {
  return {
    today_get_summary: async () => {
      const payload = todaySummaryResponseSchema.parse(await client.request("/today"));

      return {
        payload,
        summary: summarizeToday(payload),
      };
    },
  };
}

export function createTodayWriteOperations(client: HaaabitApiClient): Record<string, ToolOperation> {
  return {
    today_complete: async (input: unknown) => {
      const parsed = completeHabitInputSchema.parse(input);
      const payload = todayActionResponseSchema.parse(
        await client.request("/today/complete", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(parsed),
        }),
      );

      return {
        payload,
        summary: summarizeCompletedHabit(payload),
      };
    },
    today_set_total: async (input: unknown) => {
      const parsed = setHabitTotalInputSchema.parse(input);
      const payload = todayActionResponseSchema.parse(
        await client.request("/today/set-total", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(parsed),
        }),
      );

      return {
        payload,
        summary: summarizeSetTotal(payload),
      };
    },
    today_undo: async (input: unknown) => {
      const parsed = undoHabitInputSchema.parse(input);
      const payload = todayActionResponseSchema.parse(
        await client.request("/today/undo", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(parsed),
        }),
      );

      return {
        payload,
        summary: summarizeUndo(payload),
      };
    },
  };
}

function summarizeToday(payload: {
  summary: {
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    pendingItems: Array<{ name: string }>;
    completedItems: Array<{ name: string }>;
  };
}) {
  const { totalCount, pendingCount, completedCount, pendingItems, completedItems } = payload.summary;

  if (totalCount === 0) {
    return "No habits are scheduled for today.";
  }

  if (pendingCount === 0) {
    const completedNames = formatNameList(completedItems.map((item) => item.name));

    return `Today is complete: ${completedCount} of ${totalCount} habits finished (${completedNames}).`;
  }

  const pendingNames = formatNameList(pendingItems.map((item) => item.name));

  return `${pendingCount} still need attention today; ${completedCount} of ${totalCount} are done. Pending: ${pendingNames}.`;
}

function summarizeCompletedHabit(payload: {
  affectedHabit: {
    name: string;
  };
  summary: {
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    pendingItems: Array<{ name: string }>;
  };
}) {
  return `Completed ${payload.affectedHabit.name}. ${summarizeTodayRefresh(payload.summary)}`;
}

function summarizeSetTotal(payload: {
  affectedHabit: {
    id: string;
    name: string;
    targetValue: number | null;
    unit: string | null;
  };
  summary: {
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    pendingItems: Array<{
      habitId: string;
      name: string;
      progress: {
        currentValue: number | null;
        targetValue: number | null;
        unit: string | null;
      };
    }>;
    completedItems: Array<{
      habitId: string;
      name: string;
      progress: {
        currentValue: number | null;
        targetValue: number | null;
        unit: string | null;
      };
    }>;
  };
}) {
  const item = findTodayItem(payload.summary, payload.affectedHabit.id);
  const currentValue = item?.progress.currentValue ?? 0;
  const targetValue = item?.progress.targetValue ?? payload.affectedHabit.targetValue;
  const unit = item?.progress.unit ?? payload.affectedHabit.unit;

  return `${payload.affectedHabit.name} is now ${formatProgress(currentValue, targetValue, unit)}. ${summarizeTodayRefresh(payload.summary)}`;
}

function summarizeUndo(payload: {
  affectedHabit: {
    name: string;
    kind: "boolean" | "quantity";
  };
  summary: {
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    pendingItems: Array<{ name: string }>;
  };
}) {
  const actionLabel = payload.affectedHabit.kind === "quantity" ? "set total" : "completion";

  return `Undid today's ${actionLabel} for ${payload.affectedHabit.name}. ${summarizeTodayRefresh(payload.summary)}`;
}

function summarizeTodayRefresh(summary: {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  pendingItems: Array<{ name: string }>;
}) {
  if (summary.totalCount === 0) {
    return "No habits are scheduled for today.";
  }

  if (summary.pendingCount === 0) {
    return `No habits are pending now; ${summary.completedCount} of ${summary.totalCount} are done.`;
  }

  const pendingNames = formatNameList(summary.pendingItems.map((item) => item.name));

  return `${summary.pendingCount} still need attention today. Pending: ${pendingNames}.`;
}

function findTodayItem(
  summary: {
    pendingItems: Array<{
      habitId: string;
      progress: {
        currentValue: number | null;
        targetValue: number | null;
        unit: string | null;
      };
    }>;
    completedItems: Array<{
      habitId: string;
      progress: {
        currentValue: number | null;
        targetValue: number | null;
        unit: string | null;
      };
    }>;
  },
  habitId: string,
) {
  return [...summary.pendingItems, ...summary.completedItems].find((item) => item.habitId === habitId);
}

function formatProgress(currentValue: number | null, targetValue: number | null, unit: string | null) {
  const left = currentValue ?? 0;
  const right = targetValue ?? 0;

  return unit ? `${left}/${right} ${unit}` : `${left}/${right}`;
}
