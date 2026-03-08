"use client";

import type { OverviewStats } from "@haaabit/contracts/stats";
import type { TodaySummary } from "@haaabit/contracts/today";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getOverviewStats, getTodaySummary } from "../../lib/auth-client";
import { useLocale } from "../locale";
import { Button, SkeletonBlock, StatePanel } from "../ui";
import { routes } from "../../lib/navigation";
import { TodayDashboard } from "../today/today-dashboard";
import { OverviewSection } from "./overview-section";
import styles from "./dashboard-shell.module.css";

export function DashboardShell({
  emptyState = null,
  initialLoadError = null,
  initialOverview,
  initialSummary,
}: {
  emptyState?: "no-habits" | "archived-only" | null;
  initialLoadError?: string | null;
  initialOverview: OverviewStats | null;
  initialSummary: TodaySummary | null;
}) {
  const router = useRouter();
  const { copy } = useLocale();
  const [overview, setOverview] = useState(initialOverview);
  const [summary, setSummary] = useState(initialSummary);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [isBootstrapping, setIsBootstrapping] = useState(
    emptyState ? false : !initialLoadError && (!initialOverview || !initialSummary),
  );
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [skipBootstrapUntilRetry, setSkipBootstrapUntilRetry] = useState(Boolean(initialLoadError));

  useEffect(() => {
    if (emptyState) {
      setIsBootstrapping(false);
      return;
    }

    if (overview && summary) {
      setIsBootstrapping(false);
      return;
    }

    if (skipBootstrapUntilRetry) {
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
  }, [emptyState, overview, retryNonce, skipBootstrapUntilRetry, summary]);

  async function refreshOverview() {
    setIsRefreshingOverview(true);

    try {
      const nextOverview = await getOverviewStats();
      setOverview(nextOverview);
    } finally {
      setIsRefreshingOverview(false);
    }
  }

  function handleRetryDashboard() {
    setSkipBootstrapUntilRetry(false);
    setRetryNonce((value) => value + 1);
  }

  if (emptyState === "no-habits") {
    return (
      <div className={styles.stack}>
        <StatePanel
          testId="dashboard-primary-state"
          eyebrow={copy.dashboard.emptyStates.noHabits.eyebrow}
          title={copy.dashboard.emptyStates.noHabits.title}
          description={copy.dashboard.emptyStates.noHabits.description}
          actions={
            <Button type="button" onClick={() => router.push(routes.newHabit)}>
              {copy.dashboard.emptyStates.noHabits.action}
            </Button>
          }
        />
      </div>
    );
  }

  if (emptyState === "archived-only") {
    return (
      <div className={styles.stack}>
        <StatePanel
          testId="dashboard-primary-state"
          eyebrow={copy.dashboard.emptyStates.archivedOnly.eyebrow}
          title={copy.dashboard.emptyStates.archivedOnly.title}
          description={copy.dashboard.emptyStates.archivedOnly.description}
          actions={
            <div className={styles.actionRow}>
              <Button type="button" onClick={() => router.push(`${routes.habits}?status=archived`)}>
                {copy.dashboard.emptyStates.archivedOnly.reviewArchived}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(routes.newHabit)}>
                {copy.dashboard.emptyStates.archivedOnly.createHabit}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (!overview || !summary) {
    return (
      <div className={styles.stack}>
        <StatePanel
          testId="dashboard-bootstrap-state"
          eyebrow={copy.dashboard.loading.eyebrow}
          title={loadError ? copy.dashboard.loading.errorTitle : copy.dashboard.loading.title}
          description={
            loadError
              ? loadError
              : isBootstrapping
                ? copy.dashboard.loading.descriptionLoading
                : copy.dashboard.loading.descriptionIdle
          }
          tone={loadError ? "warning" : "neutral"}
          actions={
            loadError ? (
              <Button type="button" variant="secondary" onClick={handleRetryDashboard}>
                {copy.dashboard.loading.retry}
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
      <TodayDashboard initialSummary={summary} onActionSettled={refreshOverview} />
      <OverviewSection overview={overview} isRefreshing={isRefreshingOverview} />
    </div>
  );
}
