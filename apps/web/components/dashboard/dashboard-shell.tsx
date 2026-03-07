"use client";

import type { OverviewStats } from "@haaabit/contracts/stats";
import type { TodaySummary } from "@haaabit/contracts/today";
import { useState, useTransition } from "react";

import { getOverviewStats } from "../../lib/auth-client";
import { TodayDashboard } from "../today/today-dashboard";
import { OverviewSection } from "./overview-section";

export function DashboardShell({
  initialOverview,
  initialSummary,
}: {
  initialOverview: OverviewStats;
  initialSummary: TodaySummary;
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [isRefreshingOverview, startTransition] = useTransition();

  function refreshOverview() {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const nextOverview = await getOverviewStats();
          setOverview(nextOverview);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <OverviewSection overview={overview} isRefreshing={isRefreshingOverview} />
      <TodayDashboard initialSummary={initialSummary} onActionSettled={refreshOverview} />
    </div>
  );
}
