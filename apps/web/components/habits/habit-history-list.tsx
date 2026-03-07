"use client";

import type { HabitDetailHistoryRow } from "@haaabit/contracts/habits";

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
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {rows.map((row) => (
        <article
          key={`${row.periodType}-${row.periodKey}`}
          style={{
            display: "grid",
            gap: "0.35rem",
            padding: "0.9rem 1rem",
            borderRadius: "1rem",
            background: row.status === "completed" ? "#eef5ee" : "#f7efe7",
            border: row.status === "completed" ? "1px solid #bad1ba" : "1px solid #d9c5aa",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <strong>{formatPeriod(row)}</strong>
            <span style={{ textTransform: "capitalize" }}>{row.status}</span>
          </div>
          <span style={{ color: "#5e5247" }}>{formatOutcome(row)}</span>
        </article>
      ))}
    </div>
  );
}
