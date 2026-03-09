import type { TodayItem, TodaySummary } from "@haaabit/contracts/today";

import { compareDateKeys } from "./today-clock";
import {
  parseBuildTodaySummaryInput,
  parseTodaySummary,
  type TodayDayStateInput,
  type TodayHabitInput,
  type TodayPeriodProgressInput,
} from "./today.schema";

function getDayState(dayStates: TodayDayStateInput[], habitId: string, todayKey: string) {
  return dayStates.find((state) => state.habitId === habitId && state.dateKey === todayKey);
}

function getPeriodCompletions(
  habit: TodayHabitInput,
  periodProgress: TodayPeriodProgressInput[],
  day: {
    weekKey: string;
    monthKey: string;
  },
) {
  if (habit.frequencyType === "weekly_count") {
    return (
      periodProgress.find(
        (entry) => entry.habitId === habit.id && entry.period === "week" && entry.periodKey === day.weekKey,
      )?.completions ?? 0
    );
  }

  if (habit.frequencyType === "monthly_count") {
    return (
      periodProgress.find(
        (entry) => entry.habitId === habit.id && entry.period === "month" && entry.periodKey === day.monthKey,
      )?.completions ?? 0
    );
  }

  return 0;
}

function isVisibleToday(habit: TodayHabitInput, day: { todayKey: string; weekday: string }) {
  if (compareDateKeys(day.todayKey, habit.startDate) < 0) {
    return false;
  }

  switch (habit.frequencyType) {
    case "daily":
    case "weekly_count":
    case "monthly_count":
      return true;
    case "weekdays":
      return habit.weekdays.includes(day.weekday as TodayHabitInput["weekdays"][number]);
    default:
      return false;
  }
}

function getStatus(habit: TodayHabitInput, dayState: TodayDayStateInput | undefined, periodCompletions: number) {
  if (habit.frequencyType === "weekly_count" || habit.frequencyType === "monthly_count") {
    if (dayState?.completed) {
      return "completed";
    }

    return periodCompletions >= (habit.frequencyCount ?? Number.MAX_SAFE_INTEGER) ? "completed" : "available";
  }

  if (habit.kind === "quantity") {
    return (dayState?.value ?? 0) >= (habit.targetValue ?? Number.MAX_SAFE_INTEGER) ? "completed" : "pending";
  }

  return dayState?.completed ? "completed" : "pending";
}

function createItem(
  habit: TodayHabitInput,
  dayState: TodayDayStateInput | undefined,
  periodCompletions: number,
  date: string,
): TodayItem {
  return {
    habitId: habit.id,
    name: habit.name,
    kind: habit.kind,
    frequencyType: habit.frequencyType,
    status: getStatus(habit, dayState, periodCompletions),
    canUndo: Boolean(dayState?.completed || (dayState?.value ?? 0) > 0),
    date,
    progress: {
      currentValue: habit.kind === "quantity" ? dayState?.value ?? 0 : null,
      targetValue: habit.kind === "quantity" ? habit.targetValue : null,
      unit: habit.kind === "quantity" ? habit.unit : null,
      periodCompletions:
        habit.frequencyType === "weekly_count" || habit.frequencyType === "monthly_count" ? periodCompletions : null,
      periodTarget:
        habit.frequencyType === "weekly_count" || habit.frequencyType === "monthly_count" ? habit.frequencyCount : null,
    },
  };
}

function roundCompletionRate(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Number((completedCount / totalCount).toFixed(2));
}

export function buildTodaySummary(input: unknown): TodaySummary {
  const parsed = parseBuildTodaySummaryInput(input);
  const pendingItems: TodayItem[] = [];
  const completedItems: TodayItem[] = [];
  let countedPending = 0;
  let countedCompleted = 0;

  for (const habit of parsed.habits) {
    if (!isVisibleToday(habit, parsed.day)) {
      continue;
    }

    const dayState = getDayState(parsed.dayStates, habit.id, parsed.day.todayKey);
    const periodCompletions = getPeriodCompletions(habit, parsed.periodProgress, parsed.day);
    const item = createItem(habit, dayState, periodCompletions, parsed.day.todayKey);

    if (item.status === "completed") {
      completedItems.push(item);
      countedCompleted += 1;
    } else {
      pendingItems.push(item);
      if (item.status === "pending") {
        countedPending += 1;
      }
    }
  }

  return parseTodaySummary({
    date: parsed.day.todayKey,
    totalCount: countedPending + countedCompleted,
    pendingCount: countedPending,
    completedCount: countedCompleted,
    completionRate: roundCompletionRate(countedCompleted, countedPending + countedCompleted),
    pendingItems,
    completedItems,
  });
}
