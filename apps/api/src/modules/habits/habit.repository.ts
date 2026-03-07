import type { PrismaClient } from "../../generated/prisma/client";

import type { NormalizedCreateHabitInput } from "./habit.schema";

function toStoredHabitKind(kind: NormalizedCreateHabitInput["kind"]): string {
  switch (kind) {
    case "boolean":
      return "BOOLEAN";
    case "quantity":
      return "QUANTITY";
    default:
      throw new Error("Unsupported habit kind");
  }
}

function toStoredFrequencyType(frequencyType: NormalizedCreateHabitInput["frequencyType"]): string {
  switch (frequencyType) {
    case "daily":
      return "DAILY";
    case "weekly_count":
      return "WEEKLY_COUNT";
    case "weekdays":
      return "WEEKDAYS";
    case "monthly_count":
      return "MONTHLY_COUNT";
    default:
      throw new Error("Unsupported frequency type");
  }
}

function toStoredWeekday(day: NormalizedCreateHabitInput["weekdays"][number]): string {
  switch (day) {
    case "monday":
      return "MONDAY";
    case "tuesday":
      return "TUESDAY";
    case "wednesday":
      return "WEDNESDAY";
    case "thursday":
      return "THURSDAY";
    case "friday":
      return "FRIDAY";
    case "saturday":
      return "SATURDAY";
    case "sunday":
      return "SUNDAY";
    default:
      throw new Error("Unsupported weekday");
  }
}

export async function createHabitRecord(
  db: PrismaClient,
  params: {
    userId: string;
    habit: NormalizedCreateHabitInput;
  },
) {
  const { userId, habit } = params;

  return db.habit.create({
    data: {
      userId,
      kind: toStoredHabitKind(habit.kind),
      name: habit.name,
      description: habit.description,
      category: habit.category,
      frequencyType: toStoredFrequencyType(habit.frequencyType),
      frequencyCount: habit.frequencyCount,
      targetValue: habit.targetValue,
      unit: habit.unit,
      startDate: habit.startDate,
      isActive: habit.isActive,
      weekdays: habit.weekdays.length
        ? {
            create: habit.weekdays.map((day) => ({
              day: toStoredWeekday(day),
            })),
          }
        : undefined,
    },
    include: {
      weekdays: {
        orderBy: {
          day: "asc",
        },
      },
    },
  });
}

export async function listHabitRecords(db: PrismaClient, userId: string) {
  return db.habit.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      weekdays: {
        orderBy: {
          day: "asc",
        },
      },
    },
  });
}
