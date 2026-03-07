import type { PrismaClient } from "../../generated/prisma/client";
import type { CreateHabitInput, HabitFrequency, UpdateHabitInput } from "@haaabit/contracts/habits";

import {
  normalizeCreateHabitInput,
  parseCreateHabitInput,
  parseHabitListFilters,
  parseUpdateHabitInput,
} from "./habit.schema";
import {
  createHabitRecord,
  findOwnedHabitRecord,
  listHabitRecordsByFilter,
  setHabitActiveState,
  updateHabitRecord,
} from "./habit.repository";

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

const weekdayOrder = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
} as const;

type HabitRecord = {
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

function serializeHabit(record: HabitRecord) {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    kind: reverseHabitKindMap[record.kind as keyof typeof reverseHabitKindMap],
    description: record.description,
    category: record.category,
    targetValue: record.targetValue,
    unit: record.unit,
    startDate: record.startDate,
    isActive: record.isActive,
    frequencyType: reverseFrequencyTypeMap[record.frequencyType as keyof typeof reverseFrequencyTypeMap],
    frequencyCount: record.frequencyCount,
    weekdays: record.weekdays
      .map((entry) => reverseWeekdayMap[entry.day as keyof typeof reverseWeekdayMap])
      .sort((left, right) => weekdayOrder[left] - weekdayOrder[right]),
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

function toFrequencyInput(record: HabitRecord): HabitFrequency {
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
        days: record.weekdays
          .map((entry) => reverseWeekdayMap[entry.day as keyof typeof reverseWeekdayMap])
          .sort((left, right) => weekdayOrder[left] - weekdayOrder[right]),
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

function toCreateHabitInput(record: HabitRecord): CreateHabitInput {
  return {
    name: record.name,
    kind: reverseHabitKindMap[record.kind as keyof typeof reverseHabitKindMap],
    description: record.description ?? undefined,
    category: record.category ?? undefined,
    targetValue: record.targetValue ?? undefined,
    unit: record.unit ?? undefined,
    startDate: record.startDate,
    isActive: record.isActive,
    frequency: toFrequencyInput(record),
  };
}

function mergeUpdateInput(existing: HabitRecord, patch: UpdateHabitInput): CreateHabitInput {
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
