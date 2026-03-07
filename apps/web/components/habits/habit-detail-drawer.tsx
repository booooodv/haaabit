"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import Link from "next/link";

import { CompletionRateChart } from "../dashboard/completion-rate-chart";
import { HabitHistoryList } from "./habit-history-list";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.3rem",
        padding: "0.9rem 1rem",
        borderRadius: "1rem",
        background: "#fff7eb",
        border: "1px solid #d9c5aa",
      }}
    >
      <span style={{ color: "#7c6244", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <strong style={{ fontSize: "1.3rem" }}>{value}</strong>
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
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(21, 18, 14, 0.35)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 30,
      }}
    >
      <aside
        style={{
          width: "min(32rem, 100%)",
          height: "100%",
          overflow: "auto",
          background: "#fffdf8",
          borderLeft: "1px solid #d8d0c4",
          boxShadow: "-20px 0 50px rgba(30, 22, 14, 0.12)",
          padding: "1.5rem",
          display: "grid",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>{detail.habit.name}</h2>
              <span
                style={{
                  display: "inline-flex",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  background: detail.habit.isActive ? "#e3efe8" : "#efe6d6",
                  color: detail.habit.isActive ? "#214f43" : "#5b4c3e",
                  fontSize: "0.85rem",
                }}
              >
                {detail.habit.isActive ? "Active" : "Archived"}
              </span>
            </div>
            <p style={{ margin: 0, color: "#5f5143" }}>
              {detail.habit.description ?? "No description yet."}
            </p>
          </div>

          <Link href={closeHref} style={{ color: "#173d35", fontWeight: 700 }}>
            Close
          </Link>
        </div>

        <div style={{ display: "grid", gap: "0.5rem", color: "#5e5247" }}>
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

        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <StatCard label="Current streak" value={detail.stats.currentStreak} />
          <StatCard label="Longest streak" value={detail.stats.longestStreak} />
          <StatCard label="Total completions" value={detail.stats.totalCompletions} />
          <StatCard label="Interruptions" value={detail.stats.interruptionCount} />
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Recent trends</h3>
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

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Recent history</h3>
          <HabitHistoryList rows={detail.recentHistory} />
        </div>
      </aside>
    </div>
  );
}
