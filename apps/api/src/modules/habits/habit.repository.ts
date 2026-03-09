import type { Prisma, PrismaClient } from "../../generated/prisma/client";

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

type HabitListFilters = {
  status?: "active" | "archived";
  query?: string;
  category?: string;
  kind?: NormalizedCreateHabitInput["kind"];
};

function buildHabitWhereInput(params: {
  userId: string;
  habitId?: string;
  filters?: HabitListFilters;
}): Prisma.HabitWhereInput {
  const where: Prisma.HabitWhereInput = {
    userId: params.userId,
  };

  if (params.habitId) {
    where.id = params.habitId;
  }

  if (params.filters?.status) {
    where.isActive = params.filters.status === "active";
  }

  if (params.filters?.category) {
    where.category = params.filters.category;
  }

  if (params.filters?.kind) {
    where.kind = toStoredHabitKind(params.filters.kind);
  }

  if (params.filters?.query) {
    where.OR = [
      {
        name: {
          contains: params.filters.query,
        },
      },
      {
        category: {
          contains: params.filters.query,
        },
      },
    ];
  }

  return where;
}

export async function listHabitRecordsByFilter(
  db: PrismaClient,
  params: {
    userId: string;
    filters?: HabitListFilters;
  },
) {
  return db.habit.findMany({
    where: buildHabitWhereInput(params),
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

export async function findOwnedHabitRecord(
  db: PrismaClient,
  params: {
    userId: string;
    habitId: string;
  },
) {
  return db.habit.findFirst({
    where: buildHabitWhereInput(params),
    include: {
      weekdays: {
        orderBy: {
          day: "asc",
        },
      },
    },
  });
}

export async function findOwnedHabitDetailRecord(
  db: PrismaClient,
  params: {
    userId: string;
    habitId: string;
    rangeStart: string;
    rangeEnd: string;
  },
) {
  return db.habit.findFirst({
    where: buildHabitWhereInput(params),
    include: {
      user: {
        select: {
          timezone: true,
        },
      },
      weekdays: {
        orderBy: {
          day: "asc",
        },
      },
      dayStates: {
        where: {
          dateKey: {
            gte: params.rangeStart,
            lte: params.rangeEnd,
          },
        },
        orderBy: {
          dateKey: "asc",
        },
      },
    },
  });
}

export async function updateHabitRecord(
  db: PrismaClient,
  params: {
    habitId: string;
    habit: NormalizedCreateHabitInput;
  },
) {
  return db.habit.update({
    where: {
      id: params.habitId,
    },
    data: {
      kind: toStoredHabitKind(params.habit.kind),
      name: params.habit.name,
      description: params.habit.description,
      category: params.habit.category,
      frequencyType: toStoredFrequencyType(params.habit.frequencyType),
      frequencyCount: params.habit.frequencyCount,
      targetValue: params.habit.targetValue,
      unit: params.habit.unit,
      startDate: params.habit.startDate,
      isActive: params.habit.isActive,
      weekdays: {
        deleteMany: {},
        ...(params.habit.weekdays.length
          ? {
              create: params.habit.weekdays.map((day) => ({
                day: toStoredWeekday(day),
              })),
            }
          : {}),
      },
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

export async function setHabitActiveState(
  db: PrismaClient,
  params: {
    habitId: string;
    isActive: boolean;
  },
) {
  return db.habit.update({
    where: {
      id: params.habitId,
    },
    data: {
      isActive: params.isActive,
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
