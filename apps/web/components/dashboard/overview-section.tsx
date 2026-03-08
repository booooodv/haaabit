import type { OverviewStats } from "@haaabit/contracts/stats";

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
  return (
    <section data-testid="dashboard-overview" className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Overview</p>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.description}>
          Account-level completion trends and active habit stability before you drop into today's list.
        </p>
      </div>

      <div data-testid="overview-metrics" className={styles.metrics}>
        <MetricCard
          label="Completed today"
          value={String(overview.metrics.todayCompletedCount)}
          hint={`${Math.round(overview.metrics.todayCompletionRate * 100)}% of due habits`}
          testId="overview-metric-today-completed"
        />
        <MetricCard
          label="This week"
          value={`${Math.round(overview.metrics.weeklyCompletionRate * 100)}%`}
          hint="Natural calendar week"
          testId="overview-metric-this-week"
        />
        <MetricCard
          label="Active habits"
          value={String(overview.metrics.activeHabitCount)}
          hint="Current working set"
          testId="overview-metric-active-habits"
        />
      </div>

      <div className={styles.detailGrid}>
        <CompletionRateChart
          title="30-day completion rate"
          subtitle="Daily-granularity account trend"
          points={overview.trends.last30Days}
          testId="overview-trend-chart"
        />

        <section data-testid="overview-ranking" className={styles.ranking}>
          <div className={styles.rankingHeader}>
            <h3>Stability ranking</h3>
            <p>
              Active habits ranked by recent completion rate.
            </p>
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
                    {entry.completedCount}/{entry.totalCount} recent due days
                  </span>
                </div>
              ))
            ) : (
              <p className={styles.rankingMeta}>No active habits with recent due history yet.</p>
            )}
          </div>
        </section>
      </div>

      {isRefreshing ? <p className={styles.refreshing}>Refreshing overview…</p> : null}
    </section>
  );
}
