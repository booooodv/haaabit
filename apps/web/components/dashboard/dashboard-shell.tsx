"use client";

import type { OverviewStats } from "@haaabit/contracts/stats";
import type { TodaySummary } from "@haaabit/contracts/today";
import { useEffect, useState } from "react";

import { getOverviewStats, getTodaySummary } from "../../lib/auth-client";
import { Button, SkeletonBlock, StatePanel } from "../ui";
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
  const [isBootstrapping, setIsBootstrapping] = useState(!initialOverview || !initialSummary);
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (overview && summary) {
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    setIsBootstrapping(true);

    void (async () => {
      try {
        setLoadError(null);
        const [nextSummary, nextOverview] = await Promise.all([
          summary ? Promise.resolve(summary) : getTodaySummary(),
          overview ? Promise.resolve(overview) : getOverviewStats(),
        ]);

        if (!cancelled) {
          setSummary(nextSummary);
          setOverview(nextOverview);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [overview, retryNonce, summary]);

  async function refreshOverview() {
    setIsRefreshingOverview(true);

    try {
      const nextOverview = await getOverviewStats();
      setOverview(nextOverview);
    } finally {
      setIsRefreshingOverview(false);
    }
  }

  if (!overview || !summary) {
    return (
      <div className={styles.stack}>
        <StatePanel
          testId="dashboard-bootstrap-state"
          eyebrow="Dashboard"
          title={loadError ? "Dashboard needs another try" : "Preparing dashboard"}
          description={
            loadError
              ? loadError
              : isBootstrapping
                ? "Loading today data and overview metrics inside the protected shell."
                : "Dashboard data is still warming up."
          }
          tone={loadError ? "warning" : "neutral"}
          actions={
            loadError ? (
              <Button type="button" variant="secondary" onClick={() => setRetryNonce((value) => value + 1)}>
                Retry dashboard
              </Button>
            ) : null
          }
        >
          <div className={styles.loadingStack}>
            <SkeletonBlock height="1rem" width="7rem" />
            <SkeletonBlock height="1.2rem" width="14rem" />
            <SkeletonBlock height="5rem" />
            <SkeletonBlock height="7rem" />
          </div>
        </StatePanel>
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
