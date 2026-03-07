import type { Prisma, PrismaClient } from "../../generated/prisma/client";

export type PersistedCheckinHabit = {
  id: string;
  userId: string;
  name: string;
  kind: string;
  frequencyType: string;
  frequencyCount: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  user: {
    timezone: string;
  };
  weekdays: Array<{
    day: string;
  }>;
};

export type PersistedHabitDayState = {
  id: string;
  habitId: string;
  dateKey: string;
  value: number | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PersistedCheckinMutation = {
  id: string;
  habitId: string;
  dayStateId: string;
  dateKey: string;
  type: string;
  source: string;
  note: string | null;
  previousValue: number | null;
  nextValue: number | null;
  previousCompleted: boolean;
  nextCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function findOwnedHabitForCheckin(
  db: DbClient,
  params: {
    userId: string;
    habitId: string;
  },
): Promise<PersistedCheckinHabit> {
  const habit = await db.habit.findFirst({
    where: {
      id: params.habitId,
      userId: params.userId,
    },
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
    },
  });

  if (!habit) {
    throw new Error("Habit not found");
  }

  return habit;
}

export async function findHabitDayState(
  db: DbClient,
  params: {
    habitId: string;
    dateKey: string;
  },
) {
  return db.habitDayState.findUnique({
    where: {
      habitId_dateKey: {
        habitId: params.habitId,
        dateKey: params.dateKey,
      },
    },
  });
}

export async function findLatestCheckinMutation(
  db: DbClient,
  params: {
    habitId: string;
    dateKey: string;
  },
) {
  return db.checkInMutation.findFirst({
    where: {
      habitId: params.habitId,
      dateKey: params.dateKey,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}

export async function persistCheckinMutation(
  db: PrismaClient,
  params: {
    habitId: string;
    dateKey: string;
    type: string;
    source: string;
    note: string | null;
    previousValue: number | null;
    nextValue: number | null;
    previousCompleted: boolean;
    nextCompleted: boolean;
  },
): Promise<{
  dayState: PersistedHabitDayState;
  mutation: PersistedCheckinMutation;
}> {
  return db.$transaction(async (tx) => {
    const dayState = await tx.habitDayState.upsert({
      where: {
        habitId_dateKey: {
          habitId: params.habitId,
          dateKey: params.dateKey,
        },
      },
      create: {
        habitId: params.habitId,
        dateKey: params.dateKey,
        value: params.nextValue,
        completed: params.nextCompleted,
      },
      update: {
        value: params.nextValue,
        completed: params.nextCompleted,
      },
    });

    const mutation = await tx.checkInMutation.create({
      data: {
        habitId: params.habitId,
        dayStateId: dayState.id,
        dateKey: params.dateKey,
        type: params.type,
        source: params.source,
        note: params.note,
        previousValue: params.previousValue,
        nextValue: params.nextValue,
        previousCompleted: params.previousCompleted,
        nextCompleted: params.nextCompleted,
      },
    });

    return {
      dayState,
      mutation,
    };
  });
}
