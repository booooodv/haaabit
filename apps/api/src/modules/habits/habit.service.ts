import type { PrismaClient } from "../../generated/prisma/client";

import { parseCreateHabitInput } from "./habit.schema";
import { normalizeCreateHabitInput } from "./habit.schema";
import { createHabitRecord } from "./habit.repository";

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

type CreateHabitDependencies = {
  db: PrismaClient;
};

type CreateHabitParams = {
  userId: string;
  input: unknown;
  today?: string;
};

export async function createHabit(
  dependencies: CreateHabitDependencies,
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
