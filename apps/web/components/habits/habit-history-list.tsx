"use client";

import type { HabitDetailHistoryRow } from "@haaabit/contracts/habits";

import { Badge } from "../ui";
import styles from "./habit-history-list.module.css";

function formatPeriod(row: HabitDetailHistoryRow) {
  if (row.periodType === "day") {
    return row.periodKey;
  }

  return `${row.periodKey} · ${row.periodStart} → ${row.periodEnd}`;
}

function formatOutcome(row: HabitDetailHistoryRow) {
  if (row.valueTarget !== null) {
    return `${row.value ?? 0} / ${row.valueTarget} ${row.unit ?? ""}`.trim();
  }

  return `${row.completionCount} / ${row.completionTarget}`;
}

export function HabitHistoryList({ rows }: { rows: HabitDetailHistoryRow[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <article
          key={`${row.periodType}-${row.periodKey}`}
          className={`${styles.row} ${row.status === "completed" ? styles.completed : styles.missed}`}
        >
          <div className={styles.rowHeader}>
            <strong>{formatPeriod(row)}</strong>
            <Badge tone={row.status === "completed" ? "success" : "warning"}>{row.status}</Badge>
          </div>
          <span className={styles.outcome}>{formatOutcome(row)}</span>
        </article>
      ))}
    </div>
  );
}
