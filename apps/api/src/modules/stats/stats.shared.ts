import type { HabitTrendPoint } from "@haaabit/contracts/habits";

import type { TodayHabitInput } from "../today/today.schema";
import { buildTodaySummary } from "../today/today-summary";
import { compareDateKeys, getMonthBounds, getWeekBounds, getWeekday, addDays } from "../today/today-clock";

type TrendDayState = {
  dateKey: string;
  value: number | null;
  completed: boolean;
};

type TrendHabitRecord = {
  id: string;
  name: string;
  kind: string;
  frequencyType: string;
  frequencyCount: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  weekdays: Array<{ day: string }>;
  dayStates: TrendDayState[];
};

const reverseHabitKindMap = {
  BOOLEAN: "boolean",
  QUANTITY: "quantity",
} as const;

const reverseFrequencyTypeMap = {
  DAILY: "daily",
  WEEKLY_COUNT: "weekly_count",
  WEEKDAYS: "weekdays",
  MONTHLY_COUNT: "monthly_count",
} as const;

const reverseWeekdayMap = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

function countCompletedStatesInRange(states: TrendDayState[], rangeStart: string, rangeEnd: string) {
  return states.filter(
    (state) =>
      state.completed &&
      compareDateKeys(state.dateKey, rangeStart) >= 0 &&
      compareDateKeys(state.dateKey, rangeEnd) <= 0,
  ).length;
}

function getDayStateMap(record: TrendHabitRecord) {
  return new Map(record.dayStates.map((state) => [state.dateKey, state]));
}

function roundRate(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Number((completedCount / totalCount).toFixed(2));
}

function minDateKey(left: string, right: string) {
  return compareDateKeys(left, right) <= 0 ? left : right;
}

export function serializeHabitForToday(record: TrendHabitRecord): TodayHabitInput {
  return {
    id: record.id,
    name: record.name,
    kind: reverseHabitKindMap[record.kind as keyof typeof reverseHabitKindMap],
    frequencyType: reverseFrequencyTypeMap[record.frequencyType as keyof typeof reverseFrequencyTypeMap],
    frequencyCount: record.frequencyCount,
    targetValue: record.targetValue,
    unit: record.unit,
    startDate: record.startDate,
    weekdays: record.weekdays.map((entry) => reverseWeekdayMap[entry.day as keyof typeof reverseWeekdayMap]),
  };
}

export function buildDailySummaryForDate(
  habits: TrendHabitRecord[],
  params: {
    dateKey: string;
    timeZone: string;
  },
) {
  const day = {
    todayKey: params.dateKey,
    ...getWeekBounds(params.dateKey),
    ...getMonthBounds(params.dateKey),
    weekday: getWeekday(params.dateKey),
    cutoffHour: 4,
    timeZone: params.timeZone,
  };

  return buildTodaySummary({
    day,
    habits: habits.map((habit) => serializeHabitForToday(habit)),
    dayStates: habits.flatMap((habit) =>
      habit.dayStates
        .filter((state) => state.dateKey === params.dateKey)
        .map((state) => ({
          habitId: habit.id,
          dateKey: state.dateKey,
          value: state.value,
          completed: state.completed,
        })),
    ),
    periodProgress: habits.flatMap((habit) => {
      const weekCompletions = countCompletedStatesInRange(
        habit.dayStates,
        day.weekStartKey,
        params.dateKey,
      );
      const monthCompletions = countCompletedStatesInRange(
        habit.dayStates,
        day.monthStartKey,
        params.dateKey,
      );

      return [
        {
          habitId: habit.id,
          period: "week" as const,
          periodKey: day.weekKey,
          completions: weekCompletions,
        },
        {
          habitId: habit.id,
          period: "month" as const,
          periodKey: day.monthKey,
          completions: monthCompletions,
        },
      ];
    }),
  });
}

function isDueOnDate(record: TrendHabitRecord, dateKey: string) {
  if (compareDateKeys(dateKey, record.startDate) < 0) {
    return false;
  }

  if (record.frequencyType === "WEEKDAYS") {
    return record.weekdays.some((entry) => reverseWeekdayMap[entry.day as keyof typeof reverseWeekdayMap] === getWeekday(dateKey));
  }

  return true;
}

function getPeriodProgressForDate(record: TrendHabitRecord, dateKey: string) {
  if (record.frequencyType === "WEEKLY_COUNT") {
    const bounds = getWeekBounds(dateKey);
    const effectiveStart = compareDateKeys(record.startDate, bounds.weekStartKey) > 0 ? record.startDate : bounds.weekStartKey;
    const completionTarget = record.frequencyCount ?? 1;
    const completedCount = countCompletedStatesInRange(record.dayStates, effectiveStart, dateKey);
    const finalCompletedCount = countCompletedStatesInRange(
      record.dayStates,
      effectiveStart,
      minDateKey(bounds.weekEndKey, dateKey),
    );

    return {
      completedCount,
      completionTarget,
      completionRate: Number(Math.min(1, completedCount / completionTarget).toFixed(2)),
      finalCompletedCount,
      periodKey: bounds.weekKey,
      isCurrentPeriod: false,
      periodEndKey: bounds.weekEndKey,
    };
  }

  if (record.frequencyType === "MONTHLY_COUNT") {
    const bounds = getMonthBounds(dateKey);
    const effectiveStart = compareDateKeys(record.startDate, bounds.monthStartKey) > 0 ? record.startDate : bounds.monthStartKey;
    const completionTarget = record.frequencyCount ?? 1;
    const completedCount = countCompletedStatesInRange(record.dayStates, effectiveStart, dateKey);
    const finalCompletedCount = countCompletedStatesInRange(
      record.dayStates,
      effectiveStart,
      minDateKey(bounds.monthEndKey, dateKey),
    );

    return {
      completedCount,
      completionTarget,
      completionRate: Number(Math.min(1, completedCount / completionTarget).toFixed(2)),
      finalCompletedCount,
      periodKey: bounds.monthKey,
      isCurrentPeriod: false,
      periodEndKey: bounds.monthEndKey,
    };
  }

  return null;
}

export function buildHabitTrendPoint(
  record: TrendHabitRecord,
  params: {
    dateKey: string;
    todayKey: string;
  },
): HabitTrendPoint {
  if (!isDueOnDate(record, params.dateKey)) {
    return {
      date: params.dateKey,
      status: "not_due",
      completionRate: null,
      completedCount: 0,
      completionTarget: null,
      value: null,
      valueTarget: null,
    };
  }

  const state = getDayStateMap(record).get(params.dateKey);

  if (record.frequencyType === "DAILY" || record.frequencyType === "WEEKDAYS") {
    const completed = state?.completed ?? false;

    return {
      date: params.dateKey,
      status: completed ? "completed" : compareDateKeys(params.dateKey, params.todayKey) === 0 ? "pending" : "missed",
      completionRate: completed ? 1 : 0,
      completedCount: completed ? 1 : 0,
      completionTarget: 1,
      value: record.kind === "QUANTITY" ? (state?.value ?? 0) : null,
      valueTarget: record.kind === "QUANTITY" ? record.targetValue : null,
    };
  }

  const progress = getPeriodProgressForDate(record, params.dateKey);
  const currentPeriodKey =
    record.frequencyType === "WEEKLY_COUNT"
      ? getWeekBounds(params.todayKey).weekKey
      : getMonthBounds(params.todayKey).monthKey;
  const isCurrentPeriod = progress?.periodKey === currentPeriodKey;
  const isCompleted = (progress?.completedCount ?? 0) >= (progress?.completionTarget ?? Number.MAX_SAFE_INTEGER);
  const finalCompleted = (progress?.finalCompletedCount ?? 0) >= (progress?.completionTarget ?? Number.MAX_SAFE_INTEGER);

  return {
    date: params.dateKey,
    status: isCompleted ? "completed" : isCurrentPeriod ? "pending" : finalCompleted ? "pending" : "missed",
    completionRate: progress?.completionRate ?? 0,
    completedCount: progress?.completedCount ?? 0,
    completionTarget: progress?.completionTarget ?? null,
    value: null,
    valueTarget: null,
  };
}

export function buildHabitTrendSlice(
  record: TrendHabitRecord,
  params: {
    todayKey: string;
    days: number;
  },
) {
  const points: HabitTrendPoint[] = [];
  const startKey = addDays(params.todayKey, -(params.days - 1));

  for (let cursor = startKey; compareDateKeys(cursor, params.todayKey) <= 0; cursor = addDays(cursor, 1)) {
    points.push(
      buildHabitTrendPoint(record, {
        dateKey: cursor,
        todayKey: params.todayKey,
      }),
    );
  }

  return points;
}

export function calculateRecentCompletionRate(
  record: TrendHabitRecord,
  params: {
    todayKey: string;
    days: number;
  },
) {
  const points = buildHabitTrendSlice(record, params);
  const duePoints = points.filter((point) => point.completionTarget !== null);
  const completedCount = duePoints.filter((point) => point.status === "completed").length;
  const totalCount = duePoints.length;

  return {
    completedCount,
    totalCount,
    completionRate: roundRate(completedCount, totalCount),
  };
}
