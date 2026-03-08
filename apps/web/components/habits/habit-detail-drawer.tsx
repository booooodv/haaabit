"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";

import { Badge, OverlayPanel } from "../ui";
import { CompletionRateChart } from "../dashboard/completion-rate-chart";
import { HabitHistoryList } from "./habit-history-list";
import styles from "./habit-detail-drawer.module.css";

function StatCard({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className={styles.statCard} data-testid={testId}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}

export function HabitDetailDrawer({
  detail,
  closeHref,
}: {
  detail: HabitDetail;
  closeHref: string;
}) {
  const router = useRouter();

  return (
    <OverlayPanel
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          router.push(closeHref);
        }
      }}
      variant="drawer"
      title={detail.habit.name}
      description={detail.habit.description ?? "No description yet."}
      closeHref={closeHref}
      testId="habit-detail-overlay"
    >
      <div className={styles.stack}>
        <section className={styles.summary} data-testid="habit-detail-summary" aria-label="Habit summary">
          <div className={styles.summaryHeader}>
            <div className={styles.headerMeta}>
              <span className={styles.kicker}>Health snapshot</span>
              <div className={styles.badgeRow}>
                <Badge tone={detail.habit.isActive ? "success" : "warning"}>
                  {detail.habit.isActive ? "Active" : "Archived"}
                </Badge>
                {detail.habit.category ? <Badge tone="info">{detail.habit.category}</Badge> : null}
                <Badge tone="neutral">{detail.habit.kind}</Badge>
              </div>
              <p className={styles.description}>{detail.habit.description ?? "No description yet."}</p>
            </div>

            <div className={styles.facts}>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Frequency</span>
                <strong>{detail.habit.frequencyType}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Category</span>
                <strong>{detail.habit.category ?? "Uncategorized"}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>Target</span>
                <strong>
                  {detail.habit.kind === "quantity"
                    ? `${detail.habit.targetValue ?? 0} ${detail.habit.unit ?? "units"}`
                    : "Boolean"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.stats} data-testid="habit-detail-stats">
            <StatCard label="Current streak" value={detail.stats.currentStreak} testId="habit-detail-stat-current-streak" />
            <StatCard label="Longest streak" value={detail.stats.longestStreak} testId="habit-detail-stat-longest-streak" />
            <StatCard label="Total completions" value={detail.stats.totalCompletions} testId="habit-detail-stat-total-completions" />
            <StatCard label="Interruptions" value={detail.stats.interruptionCount} testId="habit-detail-stat-interruptions" />
          </div>
        </section>

        <div className={styles.section}>
          <h3>Recent trends</h3>
          <CompletionRateChart
            title="Last 7 days"
            subtitle="Daily-granularity habit progress"
            points={detail.trends.last7Days}
          />
          <CompletionRateChart
            title="Last 30 days"
            subtitle="Longer habit completion trend"
            points={detail.trends.last30Days}
          />
        </div>

        <div className={styles.section}>
          <h3>Recent history</h3>
          <HabitHistoryList rows={detail.recentHistory} />
        </div>
      </div>
    </OverlayPanel>
  );
}
