"use client";

import type { OverviewStats } from "@haaabit/contracts/stats";

import { useLocale } from "../locale";
import { CompletionRateChart } from "./completion-rate-chart";
import styles from "./overview-section.module.css";

function MetricCard({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint: string;
  testId: string;
}) {
  return (
    <div data-testid={testId} className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      <span className={styles.metricHint}>{hint}</span>
    </div>
  );
}

export function OverviewSection({
  overview,
  isRefreshing = false,
}: {
  overview: OverviewStats;
  isRefreshing?: boolean;
}) {
  const { copy } = useLocale();

  return (
    <section data-testid="dashboard-overview" className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{copy.dashboard.overview.eyebrow}</p>
        <h2 className={styles.title}>{copy.dashboard.overview.title}</h2>
        <p className={styles.description}>{copy.dashboard.overview.description}</p>
      </div>

      <div data-testid="overview-metrics" className={styles.metrics}>
        <MetricCard
          label={copy.dashboard.overview.metrics.todayCompleted}
          value={String(overview.metrics.todayCompletedCount)}
          hint={copy.dashboard.overview.metrics.todayCompletedHint(Math.round(overview.metrics.todayCompletionRate * 100))}
          testId="overview-metric-today-completed"
        />
        <MetricCard
          label={copy.dashboard.overview.metrics.thisWeek}
          value={`${Math.round(overview.metrics.weeklyCompletionRate * 100)}%`}
          hint={copy.dashboard.overview.metrics.thisWeekHint}
          testId="overview-metric-this-week"
        />
        <MetricCard
          label={copy.dashboard.overview.metrics.activeHabits}
          value={String(overview.metrics.activeHabitCount)}
          hint={copy.dashboard.overview.metrics.activeHabitsHint}
          testId="overview-metric-active-habits"
        />
      </div>

      <div className={styles.detailGrid}>
        <CompletionRateChart
          title={copy.dashboard.overview.trend.title}
          subtitle={copy.dashboard.overview.trend.subtitle}
          notDueLabel={copy.dashboard.overview.chart.notDue}
          points={overview.trends.last30Days}
          testId="overview-trend-chart"
        />

        <section data-testid="overview-ranking" className={styles.ranking}>
          <div className={styles.rankingHeader}>
            <h3>{copy.dashboard.overview.ranking.title}</h3>
            <p>{copy.dashboard.overview.ranking.description}</p>
          </div>

          <div className={styles.rankingItems}>
            {overview.stabilityRanking.length > 0 ? (
              overview.stabilityRanking.slice(0, 5).map((entry, index) => (
                <div key={entry.habitId} data-testid={`overview-ranking-item-${entry.habitId}`} className={styles.rankingItem}>
                  <div className={styles.rankingTop}>
                    <strong>
                      {index + 1}. {entry.name}
                    </strong>
                    <span className={styles.rankingRate}>
                      {Math.round(entry.completionRate * 100)}%
                    </span>
                  </div>
                  <span className={styles.rankingMeta}>
                    {copy.dashboard.overview.ranking.recentDays(entry.completedCount, entry.totalCount)}
                  </span>
                </div>
              ))
            ) : (
              <p className={styles.rankingMeta}>{copy.dashboard.overview.ranking.empty}</p>
            )}
          </div>
        </section>
      </div>

      {isRefreshing ? <p className={styles.refreshing}>{copy.dashboard.overview.refreshing}</p> : null}
    </section>
  );
}
