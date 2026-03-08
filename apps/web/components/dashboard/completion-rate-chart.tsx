import type { HabitTrendPoint } from "@haaabit/contracts/habits";
import type { OverviewTrendPoint } from "@haaabit/contracts/stats";

import styles from "./completion-rate-chart.module.css";

type ChartPoint = OverviewTrendPoint | HabitTrendPoint;

function getPointLabel(point: ChartPoint, notDueLabel: string) {
  if ("totalCount" in point) {
    return `${point.completedCount}/${point.totalCount}`;
  }

  if (point.completionTarget === null) {
    return notDueLabel;
  }

  return `${point.completedCount}/${point.completionTarget}`;
}

function getPointColor(point: ChartPoint) {
  if ("totalCount" in point) {
    return point.completionRate >= 0.75 ? "#173d35" : point.completionRate > 0 ? "#9d6b2e" : "#d8c3a4";
  }

  switch (point.status) {
    case "completed":
      return "#173d35";
    case "pending":
      return "#b17b2d";
    case "missed":
      return "#c98574";
    case "not_due":
      return "#d8cfc0";
  }
}

function getPointHeight(point: ChartPoint) {
  const rate = point.completionRate ?? 0;
  return Math.max(18, Math.round(rate * 88));
}

export function CompletionRateChart({
  title,
  subtitle,
  notDueLabel = "Not due",
  points,
  testId,
}: {
  title: string;
  subtitle: string;
  notDueLabel?: string;
  points: ChartPoint[];
  testId?: string;
}) {
  return (
    <section data-testid={testId} className={styles.chart}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div
        className={styles.plot}
        style={{
          gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
        }}
      >
        {points.map((point) => (
          <div
            key={point.date}
            title={`${point.date} · ${getPointLabel(point, notDueLabel)}`}
            className={styles.point}
          >
            <div
              className={styles.bar}
              style={{
                height: `${getPointHeight(point)}px`,
                background: getPointColor(point),
                opacity: point.completionRate === null ? 0.45 : 1,
              }}
            />
            <span className={styles.label}>{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
