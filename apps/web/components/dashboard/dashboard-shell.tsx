"use client";

import type { OverviewStats } from "@haaabit/contracts/stats";
import type { TodaySummary } from "@haaabit/contracts/today";
import { useEffect, useState, useTransition } from "react";

import { getOverviewStats, getTodaySummary } from "../../lib/auth-client";
import { Notice, Surface } from "../ui";
import { TodayDashboard } from "../today/today-dashboard";
import { OverviewSection } from "./overview-section";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({
  initialOverview,
  initialSummary,
}: {
  initialOverview: OverviewStats | null;
  initialSummary: TodaySummary | null;
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [summary, setSummary] = useState(initialSummary);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isBootstrapping, startBootstrapping] = useTransition();
  const [isRefreshingOverview, startTransition] = useTransition();

  useEffect(() => {
    if (overview && summary) {
      return;
    }

    startBootstrapping(async () => {
      try {
        setLoadError(null);
        const [nextSummary, nextOverview] = await Promise.all([
          summary ? Promise.resolve(summary) : getTodaySummary(),
          overview ? Promise.resolve(overview) : getOverviewStats(),
        ]);

        setSummary(nextSummary);
        setOverview(nextOverview);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load dashboard");
      }
    });
  }, [overview, summary]);

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

  if (!overview || !summary) {
    return (
      <div className={styles.stack}>
        <Surface variant="soft" className={styles.fallback}>
          <h1>Dashboard</h1>
          <p className={styles.loadingText}>
            {isBootstrapping ? "Loading live today data..." : "Preparing your dashboard..."}
          </p>
          {loadError ? (
            <Notice tone="warning" title="Live data is still warming up">
              {loadError}
            </Notice>
          ) : null}
        </Surface>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <OverviewSection overview={overview} isRefreshing={isRefreshingOverview} />
      <TodayDashboard initialSummary={summary} onActionSettled={refreshOverview} />
    </div>
  );
}
