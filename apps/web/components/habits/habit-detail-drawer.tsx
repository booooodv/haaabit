"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";

import { Badge, OverlayPanel } from "../ui";
import { CompletionRateChart } from "../dashboard/completion-rate-chart";
import { HabitHistoryList } from "./habit-history-list";
import styles from "./habit-detail-drawer.module.css";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statCard}>
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
        <div className={styles.headerMeta}>
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
          <span>
            <strong>Frequency:</strong> {detail.habit.frequencyType}
          </span>
          <span>
            <strong>Category:</strong> {detail.habit.category ?? "Uncategorized"}
          </span>
          <span>
            <strong>Target:</strong>{" "}
            {detail.habit.kind === "quantity"
              ? `${detail.habit.targetValue ?? 0} ${detail.habit.unit ?? "units"}`
              : "Boolean"}
          </span>
        </div>

        <div className={styles.stats}>
          <StatCard label="Current streak" value={detail.stats.currentStreak} />
          <StatCard label="Longest streak" value={detail.stats.longestStreak} />
          <StatCard label="Total completions" value={detail.stats.totalCompletions} />
          <StatCard label="Interruptions" value={detail.stats.interruptionCount} />
        </div>

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
