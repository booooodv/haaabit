import type {
  CreateHabitInput,
  HabitDetail,
  HabitDetailHistoryRow,
  HabitFrequency,
  HabitRecord,
  UpdateHabitInput,
} from "@haaabit/contracts/habits";
import type { PrismaClient } from "../../generated/prisma/client";
import {
  serializeContractFrequencyType,
  serializeContractHabitKind,
  serializeContractWeekdays,
} from "../../shared/habit-contract-mappers";
import { buildHabitTrendSlice } from "../stats/stats.shared";

import { addDays, compareDateKeys, getMonthBounds, getWeekBounds, getWeekday, resolveHabitDay } from "../today/today-clock";

import {
  createHabitRecord,
  findOwnedHabitDetailRecord,
  findOwnedHabitRecord,
  listHabitRecordsByFilter,
  setHabitActiveState,
  updateHabitRecord,
} from "./habit.repository";
import {
  normalizeCreateHabitInput,
  parseCreateHabitInput,
  parseHabitListFilters,
  parseUpdateHabitInput,
} from "./habit.schema";

const weekdayOrder = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
} as const;

type PersistedHabitRecord = {
  id: string;
  userId: string;
  name: string;
  kind: string;
  description: string | null;
  category: string | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  isActive: boolean;
  frequencyType: string;
  frequencyCount: number | null;
  weekdays: Array<{ day: string }>;
  createdAt: Date;
  updatedAt: Date;
};

type PersistedHabitDetailRecord = PersistedHabitRecord & {
  user: {
    timezone: string;
  };
  dayStates: Array<{
    dateKey: string;
    value: number | null;
    completed: boolean;
  }>;
};

type HistoryStatus = "completed" | "missed" | "pending";

type ComputedHistoryRow = Omit<HabitDetailHistoryRow, "status"> & {
  status: HistoryStatus;
};

export class HabitNotFoundError extends Error {
  constructor() {
    super("Habit not found");
    this.name = "HabitNotFoundError";
  }
}

export class HabitInactiveError extends Error {
  constructor() {
    super("Archived habits are read-only until restored");
    this.name = "HabitInactiveError";
  }
}

function getSerializedWeekdays(record: PersistedHabitRecord) {
  return serializeContractWeekdays(record.weekdays).sort((left, right) => weekdayOrder[left] - weekdayOrder[right]);
}

function serializeHabit(record: PersistedHabitRecord): HabitRecord {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    kind: serializeContractHabitKind(record.kind),
    description: record.description,
    category: record.category,
    targetValue: record.targetValue,
    unit: record.unit,
    startDate: record.startDate,
    isActive: record.isActive,
    frequencyType: serializeContractFrequencyType(record.frequencyType),
    frequencyCount: record.frequencyCount,
    weekdays: getSerializedWeekdays(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

type HabitServiceDependencies = {
  db: PrismaClient;
};

type CreateHabitParams = {
  userId: string;
  input: unknown;
  today?: string;
};

function toFrequencyInput(record: PersistedHabitRecord): HabitFrequency {
  switch (record.frequencyType) {
    case "DAILY":
      return { type: "daily" };
    case "WEEKLY_COUNT":
      return {
        type: "weekly_count",
        count: record.frequencyCount ?? 1,
      };
    case "WEEKDAYS":
      return {
        type: "weekdays",
        days: getSerializedWeekdays(record),
      };
    case "MONTHLY_COUNT":
      return {
        type: "monthly_count",
        count: record.frequencyCount ?? 1,
      };
    default:
      throw new Error("Unsupported frequency type");
  }
}

function toCreateHabitInput(record: PersistedHabitRecord): CreateHabitInput {
  return {
    name: record.name,
    kind: serializeContractHabitKind(record.kind),
    description: record.description ?? undefined,
    category: record.category ?? undefined,
    targetValue: record.targetValue ?? undefined,
    unit: record.unit ?? undefined,
    startDate: record.startDate,
    isActive: record.isActive,
    frequency: toFrequencyInput(record),
  };
}

function mergeUpdateInput(existing: PersistedHabitRecord, patch: UpdateHabitInput): CreateHabitInput {
  const current = toCreateHabitInput(existing);

  return {
    ...current,
    name: patch.name ?? current.name,
    description: patch.description === undefined ? current.description : (patch.description ?? undefined),
    category: patch.category === undefined ? current.category : (patch.category ?? undefined),
    targetValue: patch.targetValue ?? current.targetValue,
    unit: patch.unit === undefined ? current.unit : (patch.unit ?? undefined),
    startDate: patch.startDate ?? current.startDate,
    frequency: patch.frequency ?? current.frequency,
  };
}

async function requireOwnedHabit(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    habitId: string;
  },
) {
  const record = await findOwnedHabitRecord(dependencies.db, params);

  if (!record) {
    throw new HabitNotFoundError();
  }

  return record;
}

function addMonths(dateKey: string, months: number) {
  const [year, month] = dateKey.split("-").map((value) => Number(value));
  const nextYear = year + Math.floor((month - 1 + months) / 12);
  const nextMonth = ((month - 1 + months) % 12) + 1;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

function minDateKey(left: string, right: string) {
  return compareDateKeys(left, right) <= 0 ? left : right;
}

function buildDayStateMap(record: PersistedHabitDetailRecord) {
  return new Map(
    record.dayStates.map((state) => [
      state.dateKey,
      {
        completed: state.completed,
        value: state.value,
      },
    ]),
  );
}

function isDueOnDate(record: PersistedHabitDetailRecord, dateKey: string) {
  switch (record.frequencyType) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return getSerializedWeekdays(record).includes(getWeekday(dateKey));
    default:
      return false;
  }
}

function countCompletedDays(
  dayStates: Map<string, { completed: boolean; value: number | null }>,
  rangeStart: string,
  rangeEnd: string,
) {
  let count = 0;
  let cursor = rangeStart;

  while (compareDateKeys(cursor, rangeEnd) <= 0) {
    if (dayStates.get(cursor)?.completed) {
      count += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return count;
}

function createDayHistoryRow(
  record: PersistedHabitDetailRecord,
  dayStates: Map<string, { completed: boolean; value: number | null }>,
  dateKey: string,
  todayKey: string,
): ComputedHistoryRow {
  const state = dayStates.get(dateKey);
  const isCurrentDay = dateKey === todayKey;

  return {
    periodType: "day",
    periodKey: dateKey,
    periodStart: dateKey,
    periodEnd: dateKey,
    status: state?.completed ? "completed" : isCurrentDay ? "pending" : "missed",
    completionCount: state?.completed ? 1 : 0,
    completionTarget: 1,
    value: record.kind === "QUANTITY" ? (state?.value ?? 0) : null,
    valueTarget: record.kind === "QUANTITY" ? record.targetValue : null,
    unit: record.kind === "QUANTITY" ? record.unit : null,
  };
}

function buildDayBasedHistory(
  record: PersistedHabitDetailRecord,
  dayStates: Map<string, { completed: boolean; value: number | null }>,
  todayKey: string,
) {
  const rows: ComputedHistoryRow[] = [];
  let cursor = record.startDate;

  while (compareDateKeys(cursor, todayKey) <= 0) {
    if (isDueOnDate(record, cursor)) {
      rows.push(createDayHistoryRow(record, dayStates, cursor, todayKey));
    }

    cursor = addDays(cursor, 1);
  }

  return rows;
}

function buildWeeklyHistory(
  record: PersistedHabitDetailRecord,
  dayStates: Map<string, { completed: boolean; value: number | null }>,
  todayKey: string,
) {
  const rows: ComputedHistoryRow[] = [];
  let periodStart = getWeekBounds(record.startDate).weekStartKey;
  const currentWeek = getWeekBounds(todayKey).weekKey;
  const completionTarget = record.frequencyCount ?? 1;

  while (compareDateKeys(periodStart, todayKey) <= 0) {
    const bounds = getWeekBounds(periodStart);
    const effectiveStart = compareDateKeys(record.startDate, bounds.weekStartKey) > 0 ? record.startDate : bounds.weekStartKey;
    const effectiveEnd = minDateKey(bounds.weekEndKey, todayKey);
    const completionCount = countCompletedDays(dayStates, effectiveStart, effectiveEnd);
    const isCurrentPeriod = bounds.weekKey === currentWeek;

    rows.push({
      periodType: "week",
      periodKey: bounds.weekKey,
      periodStart: bounds.weekStartKey,
      periodEnd: bounds.weekEndKey,
      status: completionCount >= completionTarget ? "completed" : isCurrentPeriod ? "pending" : "missed",
      completionCount,
      completionTarget,
      value: null,
      valueTarget: null,
      unit: null,
    });

    periodStart = addDays(bounds.weekStartKey, 7);
  }

  return rows;
}

function buildMonthlyHistory(
  record: PersistedHabitDetailRecord,
  dayStates: Map<string, { completed: boolean; value: number | null }>,
  todayKey: string,
) {
  const rows: ComputedHistoryRow[] = [];
  let periodStart = getMonthBounds(record.startDate).monthStartKey;
  const currentMonth = getMonthBounds(todayKey).monthKey;
  const completionTarget = record.frequencyCount ?? 1;

  while (compareDateKeys(periodStart, todayKey) <= 0) {
    const bounds = getMonthBounds(periodStart);
    const effectiveStart = compareDateKeys(record.startDate, bounds.monthStartKey) > 0
      ? record.startDate
      : bounds.monthStartKey;
    const effectiveEnd = minDateKey(bounds.monthEndKey, todayKey);
    const completionCount = countCompletedDays(dayStates, effectiveStart, effectiveEnd);
    const isCurrentPeriod = bounds.monthKey === currentMonth;

    rows.push({
      periodType: "month",
      periodKey: bounds.monthKey,
      periodStart: bounds.monthStartKey,
      periodEnd: bounds.monthEndKey,
      status: completionCount >= completionTarget ? "completed" : isCurrentPeriod ? "pending" : "missed",
      completionCount,
      completionTarget,
      value: null,
      valueTarget: null,
      unit: null,
    });

    periodStart = addMonths(bounds.monthStartKey, 1);
  }

  return rows;
}

function buildComputedHistory(record: PersistedHabitDetailRecord, todayKey: string) {
  const dayStates = buildDayStateMap(record);

  switch (record.frequencyType) {
    case "DAILY":
    case "WEEKDAYS":
      return buildDayBasedHistory(record, dayStates, todayKey);
    case "WEEKLY_COUNT":
      return buildWeeklyHistory(record, dayStates, todayKey);
    case "MONTHLY_COUNT":
      return buildMonthlyHistory(record, dayStates, todayKey);
    default:
      throw new Error("Unsupported frequency type");
  }
}

function isSettledRow(row: ComputedHistoryRow): row is HabitDetailHistoryRow {
  return row.status !== "pending";
}

function buildStats(rows: ComputedHistoryRow[]): HabitDetail["stats"] {
  const settledRows = rows.filter(isSettledRow);
  let currentStreak = 0;

  for (let index = settledRows.length - 1; index >= 0; index -= 1) {
    if (settledRows[index]?.status !== "completed") {
      break;
    }

    currentStreak += 1;
  }

  let longestStreak = 0;
  let runningStreak = 0;

  for (const row of settledRows) {
    if (row.status === "completed") {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions: settledRows.filter((row) => row.status === "completed").length,
    interruptionCount: settledRows.filter((row) => row.status === "missed").length,
  };
}

export async function createHabit(
  dependencies: HabitServiceDependencies,
  params: CreateHabitParams,
) {
  const parsed = parseCreateHabitInput(params.input);
  const normalized = normalizeCreateHabitInput(parsed, {
    today: params.today ?? new Date().toISOString().slice(0, 10),
  });
  const record = await createHabitRecord(dependencies.db, {
    userId: params.userId,
    habit: normalized,
  });

  return serializeHabit(record);
}

export async function listHabits(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    filters?: unknown;
  },
) {
  const filters = parseHabitListFilters(params.filters ?? {});
  const records = await listHabitRecordsByFilter(dependencies.db, {
    userId: params.userId,
    filters,
  });

  return records.map((record) => serializeHabit(record));
}

export async function getHabitDetail(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    habitId: string;
    timestamp?: Date | number | string;
  },
): Promise<HabitDetail> {
  const user = await dependencies.db.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      timezone: true,
    },
  });

  if (!user) {
    throw new HabitNotFoundError();
  }

  const day = resolveHabitDay({
    timestamp: params.timestamp ?? new Date(),
    timeZone: user.timezone,
  });
  const record = await findOwnedHabitDetailRecord(dependencies.db, {
    userId: params.userId,
    habitId: params.habitId,
    rangeStart: "0000-01-01",
    rangeEnd: day.todayKey,
  });

  if (!record) {
    throw new HabitNotFoundError();
  }

  const computedHistory = buildComputedHistory(record, day.todayKey);

  return {
    habit: serializeHabit(record),
    stats: buildStats(computedHistory),
    recentHistory: computedHistory.filter(isSettledRow).reverse().slice(0, 10),
    trends: {
      last7Days: buildHabitTrendSlice(record, {
        todayKey: day.todayKey,
        days: 7,
      }),
      last30Days: buildHabitTrendSlice(record, {
        todayKey: day.todayKey,
        days: 30,
      }),
    },
  };
}

export async function updateHabit(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    habitId: string;
    input: unknown;
  },
) {
  const patch = parseUpdateHabitInput(params.input);
  const existing = await requireOwnedHabit(dependencies, params);

  if (!existing.isActive) {
    throw new HabitInactiveError();
  }

  const normalized = normalizeCreateHabitInput(mergeUpdateInput(existing, patch), {
    today: existing.startDate,
  });
  const updated = await updateHabitRecord(dependencies.db, {
    habitId: existing.id,
    habit: normalized,
  });

  return serializeHabit(updated);
}

export async function archiveHabit(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    habitId: string;
  },
) {
  const existing = await requireOwnedHabit(dependencies, params);
  const updated = await setHabitActiveState(dependencies.db, {
    habitId: existing.id,
    isActive: false,
  });

  return serializeHabit(updated);
}

export async function restoreHabit(
  dependencies: HabitServiceDependencies,
  params: {
    userId: string;
    habitId: string;
  },
) {
  const existing = await requireOwnedHabit(dependencies, params);
  const updated = await setHabitActiveState(dependencies.db, {
    habitId: existing.id,
    isActive: true,
  });

  return serializeHabit(updated);
}
