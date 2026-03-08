import { redirect } from "next/navigation";

import { DashboardShell } from "../../../components/dashboard/dashboard-shell";
import { routes } from "../../../lib/navigation";
import {
  buildCookieHeader,
  getOverviewStatsFromCookieHeader,
  getTodaySummaryFromCookieHeader,
  listHabitsFromCookieHeader,
} from "../../../lib/server-auth";

type DashboardPageProps = {
  searchParams?: Promise<{
    simulateLoading?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;

  if (params?.simulateLoading === "1") {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  const cookieHeader = await buildCookieHeader();
  const [activeHabits, archivedHabits] = await Promise.all([
    listHabitsFromCookieHeader(cookieHeader, {
      status: "active",
    }),
    listHabitsFromCookieHeader(cookieHeader, {
      status: "archived",
    }),
  ]);

  const [todaySummaryResult, overviewResult] = await Promise.allSettled([
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
    <DashboardShell
      initialOverview={overviewResult.status === "fulfilled" ? overviewResult.value : null}
      initialSummary={todaySummaryResult.status === "fulfilled" ? todaySummaryResult.value : null}
    />
  );
}
