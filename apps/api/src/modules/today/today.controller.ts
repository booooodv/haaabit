import { ZodError } from "zod";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthSessionError, requireSession } from "../../auth/session";
import { completeHabitForToday, setHabitTotalForToday, undoHabitForToday } from "../checkins/checkin.service";

import { buildTodaySummary } from "./today-summary";
import { resolveHabitDay } from "./today-clock";

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

type PeriodCounter = {
  week: number;
  month: number;
};

function sendAuthError(reply: FastifyReply, error: AuthSessionError): void {
  reply.status(error.statusCode).send({
    code: error.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
    message: error.message,
  });
}

function getRequestTimestamp(request: FastifyRequest) {
  const header = request.headers["x-haaabit-now"];

  if (request.server.env.NODE_ENV === "test" && typeof header === "string" && header.length > 0) {
    return header;
  }

  return new Date();
}

function serializeHabit(habit: {
  id: string;
  name: string;
  kind: string;
  frequencyType: string;
  frequencyCount: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  weekdays: Array<{ day: string }>;
}) {
  return {
    id: habit.id,
    name: habit.name,
    kind: reverseHabitKindMap[habit.kind as keyof typeof reverseHabitKindMap],
    frequencyType: reverseFrequencyTypeMap[habit.frequencyType as keyof typeof reverseFrequencyTypeMap],
    frequencyCount: habit.frequencyCount,
    targetValue: habit.targetValue,
    unit: habit.unit,
    startDate: habit.startDate,
    weekdays: habit.weekdays.map((entry) => reverseWeekdayMap[entry.day as keyof typeof reverseWeekdayMap]),
  };
}

function incrementPeriodCounter(
  counters: Map<string, PeriodCounter>,
  habitId: string,
  key: keyof PeriodCounter,
) {
  const current = counters.get(habitId) ?? {
    week: 0,
    month: 0,
  };

  current[key] += 1;
  counters.set(habitId, current);
}

async function buildTodayResponse(
  request: FastifyRequest,
  userId: string,
  timestamp: Date | number | string,
) {
  const user = await request.server.db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      timezone: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const day = resolveHabitDay({
    timestamp,
    timeZone: user.timezone,
  });
  const rangeStart = day.weekStartKey < day.monthStartKey ? day.weekStartKey : day.monthStartKey;
  const rangeEnd = day.weekEndKey > day.monthEndKey ? day.weekEndKey : day.monthEndKey;

  const [habits, dayStates, completedStates] = await Promise.all([
    request.server.db.habit.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        weekdays: {
          orderBy: {
            day: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    request.server.db.habitDayState.findMany({
      where: {
        habit: {
          userId,
        },
        dateKey: day.todayKey,
      },
    }),
    request.server.db.habitDayState.findMany({
      where: {
        habit: {
          userId,
        },
        completed: true,
        dateKey: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    }),
  ]);

  const periodCounters = new Map<string, PeriodCounter>();

  for (const state of completedStates) {
    if (state.dateKey >= day.weekStartKey && state.dateKey <= day.weekEndKey) {
      incrementPeriodCounter(periodCounters, state.habitId, "week");
    }

    if (state.dateKey >= day.monthStartKey && state.dateKey <= day.monthEndKey) {
      incrementPeriodCounter(periodCounters, state.habitId, "month");
    }
  }

  const summary = buildTodaySummary({
    day,
    habits: habits.map((habit) => serializeHabit(habit)),
    dayStates: dayStates.map((state) => ({
      habitId: state.habitId,
      dateKey: state.dateKey,
      value: state.value,
      completed: state.completed,
    })),
    periodProgress: Array.from(periodCounters.entries()).flatMap(([habitId, counts]) => [
      {
        habitId,
        period: "week" as const,
        periodKey: day.weekKey,
        completions: counts.week,
      },
      {
        habitId,
        period: "month" as const,
        periodKey: day.monthKey,
        completions: counts.month,
      },
    ]),
  });

  return {
    summary,
  };
}

function sendRequestError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    reply.status(400).send({
      code: "BAD_REQUEST",
      message: "Invalid today payload",
      issues: error.flatten(),
    });
    return reply;
  }

  if (error instanceof Error && error.message === "Habit not found") {
    reply.status(404).send({
      code: "NOT_FOUND",
      message: error.message,
    });
    return reply;
  }

  if (error instanceof Error && /Only .* can use/.test(error.message)) {
    reply.status(400).send({
      code: "BAD_REQUEST",
      message: error.message,
    });
    return reply;
  }

  throw error;
}

export async function getTodayHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    return buildTodayResponse(request, session.user.id, getRequestTimestamp(request));
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendRequestError(reply, error);
  }
}

export async function completeTodayHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    const timestamp = getRequestTimestamp(request);
    const result = await completeHabitForToday(
      {
        db: request.server.db,
      },
      {
        userId: session.user.id,
        ...(request.body as Record<string, unknown>),
        timestamp,
      } as Parameters<typeof completeHabitForToday>[1],
    );

    return {
      affectedHabit: result.habit,
      ...(await buildTodayResponse(request, session.user.id, timestamp)),
    };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendRequestError(reply, error);
  }
}

export async function setTodayHabitTotalHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    const timestamp = getRequestTimestamp(request);
    const result = await setHabitTotalForToday(
      {
        db: request.server.db,
      },
      {
        userId: session.user.id,
        ...(request.body as Record<string, unknown>),
        timestamp,
      } as Parameters<typeof setHabitTotalForToday>[1],
    );

    return {
      affectedHabit: result.habit,
      ...(await buildTodayResponse(request, session.user.id, timestamp)),
    };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendRequestError(reply, error);
  }
}

export async function undoTodayHabitHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await requireSession(request);
    const timestamp = getRequestTimestamp(request);
    const result = await undoHabitForToday(
      {
        db: request.server.db,
      },
      {
        userId: session.user.id,
        ...(request.body as Record<string, unknown>),
        timestamp,
      } as Parameters<typeof undoHabitForToday>[1],
    );

    return {
      affectedHabit: result.habit,
      ...(await buildTodayResponse(request, session.user.id, timestamp)),
    };
  } catch (error) {
    if (error instanceof AuthSessionError) {
      sendAuthError(reply, error);
      return reply;
    }

    return sendRequestError(reply, error);
  }
}
