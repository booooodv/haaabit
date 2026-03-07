import { redirect } from "next/navigation";

import { TodayDashboard } from "../../../components/today/today-dashboard";
import { routes } from "../../../lib/navigation";
import { buildCookieHeader, getTodaySummaryFromCookieHeader, listHabitsFromCookieHeader } from "../../../lib/server-auth";

export default async function DashboardPage() {
  const cookieHeader = await buildCookieHeader();
  const [habits, todaySummary] = await Promise.all([
    listHabitsFromCookieHeader(cookieHeader),
    getTodaySummaryFromCookieHeader(cookieHeader),
  ]);

  if (habits.length === 0) {
    redirect(routes.newHabit);
  }

  return (
    <TodayDashboard initialSummary={todaySummary} />
  );
}
