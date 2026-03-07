import { redirect } from "next/navigation";

import { DashboardShell } from "../../../components/dashboard/dashboard-shell";
import { routes } from "../../../lib/navigation";
import {
  buildCookieHeader,
  getOverviewStatsFromCookieHeader,
  getTodaySummaryFromCookieHeader,
  listHabitsFromCookieHeader,
} from "../../../lib/server-auth";

export default async function DashboardPage() {
  const cookieHeader = await buildCookieHeader();
  const [activeHabits, archivedHabits, todaySummary, overview] = await Promise.all([
    listHabitsFromCookieHeader(cookieHeader, {
      status: "active",
    }),
    listHabitsFromCookieHeader(cookieHeader, {
      status: "archived",
    }),
    getTodaySummaryFromCookieHeader(cookieHeader),
    getOverviewStatsFromCookieHeader(cookieHeader),
  ]);

  if (activeHabits.length === 0 && archivedHabits.length === 0) {
    redirect(routes.newHabit);
  }

  if (activeHabits.length === 0) {
    redirect(routes.habits);
  }

  return (
    <DashboardShell initialOverview={overview} initialSummary={todaySummary} />
  );
}
