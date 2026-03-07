import { redirect } from "next/navigation";

import { TodayDashboard } from "../../../components/today/today-dashboard";
import { routes } from "../../../lib/navigation";
import { buildCookieHeader, getTodaySummaryFromCookieHeader, listHabitsFromCookieHeader } from "../../../lib/server-auth";

export default async function DashboardPage() {
  const cookieHeader = await buildCookieHeader();
  const [activeHabits, archivedHabits, todaySummary] = await Promise.all([
    listHabitsFromCookieHeader(cookieHeader, {
      status: "active",
    }),
    listHabitsFromCookieHeader(cookieHeader, {
      status: "archived",
    }),
    getTodaySummaryFromCookieHeader(cookieHeader),
  ]);

  if (activeHabits.length === 0 && archivedHabits.length === 0) {
    redirect(routes.newHabit);
  }

  if (activeHabits.length === 0) {
    redirect(routes.habits);
  }

  return (
    <TodayDashboard initialSummary={todaySummary} />
  );
}
