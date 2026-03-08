"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";

import { getHabitsCopy } from "../../lib/i18n/habits";
import { Badge, OverlayPanel } from "../ui";
import { CompletionRateChart } from "../dashboard/completion-rate-chart";
import { useLocale } from "../locale";
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

function formatFrequency(detail: HabitDetail, copy: ReturnType<typeof getHabitsCopy>) {
  switch (detail.habit.frequencyType) {
    case "daily":
      return copy.page.frequency.daily;
    case "weekly_count":
      return copy.page.frequency.weeklyCount(detail.habit.frequencyCount ?? 1);
    case "monthly_count":
      return copy.page.frequency.monthlyCount(detail.habit.frequencyCount ?? 1);
    case "weekdays":
      return copy.page.frequency.weekdays(detail.habit.weekdays);
    default:
      return detail.habit.frequencyType;
  }
}

export function HabitDetailDrawer({
  detail,
  closeHref,
}: {
  detail: HabitDetail;
  closeHref: string;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = getHabitsCopy(locale);

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
      description={detail.habit.description ?? copy.detail.noDescription}
      closeLabel={copy.detail.closeLabel}
      closeHref={closeHref}
      testId="habit-detail-overlay"
    >
      <div className={styles.stack}>
        <section className={styles.summary} data-testid="habit-detail-summary" aria-label={copy.detail.summaryAriaLabel}>
          <div className={styles.summaryHeader}>
            <div className={styles.headerMeta}>
              <span className={styles.kicker}>{copy.detail.kicker}</span>
              <div className={styles.badgeRow}>
                <Badge tone={detail.habit.isActive ? "success" : "warning"}>
                  {detail.habit.isActive ? copy.detail.status.active : copy.detail.status.archived}
                </Badge>
                {detail.habit.category ? <Badge tone="info">{detail.habit.category}</Badge> : null}
                <Badge tone="neutral">
                  {detail.habit.kind === "quantity" ? copy.page.card.quantityKind : copy.page.card.booleanKind}
                </Badge>
              </div>
              <p className={styles.description}>{detail.habit.description ?? copy.detail.noDescription}</p>
            </div>

            <div className={styles.facts}>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>{copy.detail.facts.frequency}</span>
                <strong>{formatFrequency(detail, copy)}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>{copy.detail.facts.category}</span>
                <strong>{detail.habit.category ?? copy.detail.facts.uncategorized}</strong>
              </div>
              <div className={styles.factCard}>
                <span className={styles.factLabel}>{copy.detail.facts.target}</span>
                <strong>
                  {detail.habit.kind === "quantity"
                    ? `${detail.habit.targetValue ?? 0} ${detail.habit.unit ?? copy.detail.facts.unitsFallback}`
                    : copy.detail.facts.boolean}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.stats} data-testid="habit-detail-stats">
            <StatCard label={copy.detail.stats.currentStreak} value={detail.stats.currentStreak} testId="habit-detail-stat-current-streak" />
            <StatCard label={copy.detail.stats.longestStreak} value={detail.stats.longestStreak} testId="habit-detail-stat-longest-streak" />
            <StatCard label={copy.detail.stats.totalCompletions} value={detail.stats.totalCompletions} testId="habit-detail-stat-total-completions" />
            <StatCard label={copy.detail.stats.interruptions} value={detail.stats.interruptionCount} testId="habit-detail-stat-interruptions" />
          </div>
        </section>

        <div className={styles.section}>
          <h3>{copy.detail.sections.trends}</h3>
          <CompletionRateChart
            title={copy.detail.sections.last7Days}
            subtitle={copy.detail.sections.last7DaysSubtitle}
            notDueLabel={copy.detail.chartNotDue}
            points={detail.trends.last7Days}
          />
          <CompletionRateChart
            title={copy.detail.sections.last30Days}
            subtitle={copy.detail.sections.last30DaysSubtitle}
            notDueLabel={copy.detail.chartNotDue}
            points={detail.trends.last30Days}
          />
        </div>

        <div className={styles.section}>
          <h3>{copy.detail.sections.history}</h3>
          <HabitHistoryList rows={detail.recentHistory} />
        </div>
      </div>
    </OverlayPanel>
  );
}
