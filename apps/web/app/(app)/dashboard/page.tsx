import { redirect } from "next/navigation";

import { OverviewSection } from "../../../components/dashboard/overview-section";
import { TodayDashboard } from "../../../components/today/today-dashboard";
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
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <OverviewSection overview={overview} />
      <TodayDashboard initialSummary={todaySummary} />
    </div>
  );
}
