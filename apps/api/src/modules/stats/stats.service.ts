import type { OverviewStats } from "@haaabit/contracts/stats";

import { normalizeUserTimeZone } from "../../shared/timezone";
import {
  serializeContractFrequencyType,
  serializeContractHabitKind,
} from "../../shared/habit-contract-mappers";
import { parseOverviewStats } from "./stats.schema";
import { findUserTimezone, listActiveHabitStatsRecords } from "./stats.repository";
import { addDays, compareDateKeys, getWeekBounds, resolveHabitDay } from "../today/today-clock";
import { buildDailySummaryForDate, buildHabitTrendSlice, calculateRecentCompletionRate } from "./stats.shared";

type StatsServiceDependencies = {
  db: import("../../generated/prisma/client").PrismaClient;
};

function sumCompletionRateWindow(
  trends: OverviewStats["trends"]["last30Days"],
  params: {
    rangeStart: string;
    rangeEnd: string;
  },
) {
  const points = trends.filter(
    (point) =>
      compareDateKeys(point.date, params.rangeStart) >= 0 &&
      compareDateKeys(point.date, params.rangeEnd) <= 0,
  );

  const completedCount = points.reduce((sum, point) => sum + point.completedCount, 0);
  const totalCount = points.reduce((sum, point) => sum + point.totalCount, 0);

  if (totalCount === 0) {
    return 0;
  }

  return Number((completedCount / totalCount).toFixed(2));
}

export async function getOverviewStats(
  dependencies: StatsServiceDependencies,
  params: {
    userId: string;
    timestamp?: Date | number | string;
  },
) {
  const user = await findUserTimezone(dependencies.db, {
    userId: params.userId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const timeZone = normalizeUserTimeZone(user.timezone);
  const day = resolveHabitDay({
    timestamp: params.timestamp ?? new Date(),
    timeZone,
  });
  const rangeStart = addDays(day.todayKey, -29);
  const activeHabits = await listActiveHabitStatsRecords(dependencies.db, {
    userId: params.userId,
    rangeStart,
    rangeEnd: day.todayKey,
  });

  const last30Days = [];

  for (let cursor = rangeStart; compareDateKeys(cursor, day.todayKey) <= 0; cursor = addDays(cursor, 1)) {
    const summary = buildDailySummaryForDate(activeHabits, {
      dateKey: cursor,
      timeZone,
    });

    last30Days.push({
      date: cursor,
      completedCount: summary.completedCount,
      totalCount: summary.totalCount,
      completionRate: summary.completionRate,
    });
  }

  const last7Days = last30Days.slice(-7);
  const todayPoint = last30Days[last30Days.length - 1] ?? {
    completedCount: 0,
    completionRate: 0,
  };
  const currentWeek = getWeekBounds(day.todayKey);
  const stabilityRanking = activeHabits
    .map((habit) => {
      const recent = calculateRecentCompletionRate(habit, {
        todayKey: day.todayKey,
        days: 30,
      });

      return {
        habitId: habit.id,
        name: habit.name,
        kind: serializeContractHabitKind(habit.kind),
        frequencyType: serializeContractFrequencyType(habit.frequencyType),
        completionRate: recent.completionRate,
        completedCount: recent.completedCount,
        totalCount: recent.totalCount,
      };
    })
    .sort((left, right) => {
      if (right.completionRate !== left.completionRate) {
        return right.completionRate - left.completionRate;
      }

      if (right.completedCount !== left.completedCount) {
        return right.completedCount - left.completedCount;
      }

      return left.name.localeCompare(right.name);
    });

  return parseOverviewStats({
    date: day.todayKey,
    metrics: {
      todayCompletedCount: todayPoint.completedCount,
      todayCompletionRate: todayPoint.completionRate,
      weeklyCompletionRate: sumCompletionRateWindow(last30Days, {
        rangeStart: currentWeek.weekStartKey,
        rangeEnd: day.todayKey,
      }),
      activeHabitCount: activeHabits.length,
    },
    trends: {
      last7Days,
      last30Days,
    },
    stabilityRanking,
  });
}
