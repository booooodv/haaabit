import type { PrismaClient } from "../../generated/prisma/client";
import {
  serializeContractFrequencyType,
  serializeContractHabitKind,
  serializeContractWeekday,
  serializeContractWeekdays,
} from "../../shared/habit-contract-mappers";

import { HabitInactiveError } from "../habits/habit.service";
import { resolveHabitDay } from "../today/today-clock";

import {
  findHabitDayState,
  findLatestCheckinMutation,
  findOwnedHabitForCheckin,
  persistCheckinMutation,
  type PersistedCheckinHabit,
} from "./checkin.repository";
import {
  normalizeOptionalNote,
  parseCompleteHabitInput,
  parseSetHabitTotalInput,
  parseUndoHabitInput,
  type CheckinSourceInput,
} from "./checkin.schema";

const sourceMap = {
  web: "WEB",
  ai: "AI",
  system: "SYSTEM",
} as const;

const mutationTypeMap = {
  complete: "COMPLETE",
  setTotal: "SET_TOTAL",
  undo: "UNDO",
} as const;

type CheckinDependencies = {
  db: PrismaClient;
};

type ServiceTimestamp = Date | number | string | undefined;

type BaseCheckinParams = {
  userId: string;
  habitId: string;
  source: CheckinSourceInput;
  note?: string | null;
  timestamp?: ServiceTimestamp;
};

type HabitStateSnapshot = {
  dateKey: string;
  value: number | null;
  completed: boolean;
};

export class TodayActionUnavailableError extends Error {
  constructor() {
    super("This habit is not actionable in today right now");
  }
}

export class NothingToUndoError extends Error {
  constructor() {
    super("There is no successful today action to undo");
  }
}

function serializeHabit(habit: PersistedCheckinHabit) {
  return {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    kind: serializeContractHabitKind(habit.kind),
    frequencyType: serializeContractFrequencyType(habit.frequencyType),
    frequencyCount: habit.frequencyCount,
    targetValue: habit.targetValue,
    unit: habit.unit,
    startDate: habit.startDate,
    weekdays: serializeContractWeekdays(habit.weekdays),
  };
}

function getDefaultState(dateKey: string): HabitStateSnapshot {
  return {
    dateKey,
    value: null,
    completed: false,
  };
}

function isHabitActionableToday(
  habit: PersistedCheckinHabit,
  day: ReturnType<typeof resolveHabitDay>,
) {
  if (day.todayKey < habit.startDate) {
    return false;
  }

  if (habit.frequencyType === "WEEKDAYS") {
    return habit.weekdays.some((entry) => serializeContractWeekday(entry.day) === day.weekday);
  }

  return true;
}

async function resolveCheckinContext(
  dependencies: CheckinDependencies,
  params: {
    userId: string;
    habitId: string;
    timestamp?: ServiceTimestamp;
  },
) {
  const habit = await findOwnedHabitForCheckin(dependencies.db, {
    userId: params.userId,
    habitId: params.habitId,
  });
  const day = resolveHabitDay({
    timestamp: params.timestamp ?? new Date(),
    timeZone: habit.user.timezone,
  });
  const dayState = await findHabitDayState(dependencies.db, {
    habitId: habit.id,
    dateKey: day.todayKey,
  });

  return {
    habit,
    day,
    dayState: dayState
      ? {
          dateKey: dayState.dateKey,
          value: dayState.value,
          completed: dayState.completed,
        }
      : getDefaultState(day.todayKey),
  };
}

async function persistMutation(
  dependencies: CheckinDependencies,
  params: {
    habit: PersistedCheckinHabit;
    currentState: HabitStateSnapshot;
    nextState: HabitStateSnapshot;
    type: keyof typeof mutationTypeMap;
    source: CheckinSourceInput;
    note?: string | null;
  },
) {
  const persisted = await persistCheckinMutation(dependencies.db, {
    habitId: params.habit.id,
    dateKey: params.nextState.dateKey,
    type: mutationTypeMap[params.type],
    source: sourceMap[params.source],
    note: normalizeOptionalNote(params.note),
    previousValue: params.currentState.value,
    nextValue: params.nextState.value,
    previousCompleted: params.currentState.completed,
    nextCompleted: params.nextState.completed,
  });

  return {
    habit: serializeHabit(params.habit),
    currentState: {
      id: persisted.dayState.id,
      dateKey: persisted.dayState.dateKey,
      value: persisted.dayState.value,
      completed: persisted.dayState.completed,
      createdAt: persisted.dayState.createdAt,
      updatedAt: persisted.dayState.updatedAt,
    },
    mutation: {
      id: persisted.mutation.id,
      dateKey: persisted.mutation.dateKey,
      type: persisted.mutation.type,
      source: persisted.mutation.source,
      note: persisted.mutation.note,
      previousValue: persisted.mutation.previousValue,
      nextValue: persisted.mutation.nextValue,
      previousCompleted: persisted.mutation.previousCompleted,
      nextCompleted: persisted.mutation.nextCompleted,
      createdAt: persisted.mutation.createdAt,
      updatedAt: persisted.mutation.updatedAt,
    },
  };
}

export async function completeHabitForToday(
  dependencies: CheckinDependencies,
  params: BaseCheckinParams,
) {
  const parsed = parseCompleteHabitInput({
    habitId: params.habitId,
    source: params.source,
    note: params.note,
  });
  const context = await resolveCheckinContext(dependencies, {
    userId: params.userId,
    habitId: parsed.habitId,
    timestamp: params.timestamp,
  });

  if (!context.habit.isActive) {
    throw new HabitInactiveError();
  }

  if (context.habit.kind !== "BOOLEAN") {
    throw new Error("Only boolean habits can use complete");
  }

  if (!isHabitActionableToday(context.habit, context.day)) {
    throw new TodayActionUnavailableError();
  }

  return persistMutation(dependencies, {
    habit: context.habit,
    currentState: context.dayState,
    nextState: {
      dateKey: context.day.todayKey,
      value: null,
      completed: true,
    },
    type: "complete",
    source: parsed.source,
    note: parsed.note,
  });
}

export async function setHabitTotalForToday(
  dependencies: CheckinDependencies,
  params: BaseCheckinParams & {
    total: number;
  },
) {
  const parsed = parseSetHabitTotalInput({
    habitId: params.habitId,
    total: params.total,
    source: params.source,
    note: params.note,
  });
  const context = await resolveCheckinContext(dependencies, {
    userId: params.userId,
    habitId: parsed.habitId,
    timestamp: params.timestamp,
  });

  if (!context.habit.isActive) {
    throw new HabitInactiveError();
  }

  if (context.habit.kind !== "QUANTITY") {
    throw new Error("Only quantified habits can use set-total");
  }

  return persistMutation(dependencies, {
    habit: context.habit,
    currentState: context.dayState,
    nextState: {
      dateKey: context.day.todayKey,
      value: parsed.total,
      completed: parsed.total >= (context.habit.targetValue ?? Number.MAX_SAFE_INTEGER),
    },
    type: "setTotal",
    source: parsed.source,
    note: parsed.note,
  });
}

export async function undoHabitForToday(
  dependencies: CheckinDependencies,
  params: BaseCheckinParams,
) {
  const parsed = parseUndoHabitInput({
    habitId: params.habitId,
    source: params.source,
    note: params.note,
  });
  const context = await resolveCheckinContext(dependencies, {
    userId: params.userId,
    habitId: parsed.habitId,
    timestamp: params.timestamp,
  });

  if (!context.habit.isActive) {
    throw new HabitInactiveError();
  }

  const latestMutation = await findLatestCheckinMutation(dependencies.db, {
    habitId: context.habit.id,
    dateKey: context.day.todayKey,
  });

  if (!latestMutation) {
    throw new NothingToUndoError();
  }

  const nextState = {
    dateKey: context.day.todayKey,
    value: latestMutation.previousValue,
    completed: latestMutation.previousCompleted,
  };

  return persistMutation(dependencies, {
    habit: context.habit,
    currentState: context.dayState,
    nextState,
    type: "undo",
    source: parsed.source,
    note: parsed.note,
  });
}
