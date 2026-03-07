import type { PrismaClient } from "../../generated/prisma/client";

export type PersistedStatsHabitRecord = {
  id: string;
  name: string;
  kind: string;
  frequencyType: string;
  frequencyCount: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  weekdays: Array<{ day: string }>;
  dayStates: Array<{
    dateKey: string;
    value: number | null;
    completed: boolean;
  }>;
};

export async function findUserTimezone(
  db: PrismaClient,
  params: {
    userId: string;
  },
) {
  return db.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      timezone: true,
    },
  });
}

export async function listActiveHabitStatsRecords(
  db: PrismaClient,
  params: {
    userId: string;
    rangeStart: string;
    rangeEnd: string;
  },
) {
  return db.habit.findMany({
    where: {
      userId: params.userId,
      isActive: true,
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
