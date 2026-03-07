import type { OverviewStats } from "@haaabit/contracts/stats";

import { CompletionRateChart } from "./completion-rate-chart";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "1rem 1.1rem",
        borderRadius: "1.2rem",
        background: "#fffdf8",
        border: "1px solid #d9cfbf",
      }}
    >
      <span style={{ color: "#7b6e60", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
        {label}
      </span>
      <strong style={{ fontSize: "1.65rem", color: "#1c4038" }}>{value}</strong>
      <span style={{ color: "#66584b", fontSize: "0.92rem" }}>{hint}</span>
    </div>
  );
}

export function OverviewSection({ overview }: { overview: OverviewStats }) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1.25rem",
        padding: "1.5rem",
        borderRadius: "1.75rem",
        background: "linear-gradient(135deg, #f7f3e8 0%, #efe4d1 100%)",
        border: "1px solid #d8c6ad",
        boxShadow: "0 18px 60px rgba(40, 28, 15, 0.08)",
      }}
    >
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <p style={{ margin: 0, color: "#756858", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
          Overview
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Analytics</h1>
        <p style={{ margin: 0, color: "#5c5145" }}>
          Account-level completion trends and active habit stability before you drop into today's list.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
        }}
      >
        <MetricCard
          label="Completed today"
          value={String(overview.metrics.todayCompletedCount)}
          hint={`${Math.round(overview.metrics.todayCompletionRate * 100)}% of due habits`}
        />
        <MetricCard
          label="This week"
          value={`${Math.round(overview.metrics.weeklyCompletionRate * 100)}%`}
          hint="Natural calendar week"
        />
        <MetricCard
          label="Active habits"
          value={String(overview.metrics.activeHabitCount)}
          hint="Current working set"
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(16rem, 0.9fr)",
        }}
      >
        <CompletionRateChart
          title="30-day completion rate"
          subtitle="Daily-granularity account trend"
          points={overview.trends.last30Days}
        />

        <section
          style={{
            display: "grid",
            gap: "0.8rem",
            padding: "1.15rem",
            borderRadius: "1.25rem",
            background: "#fffdf8",
            border: "1px solid #d9cdb8",
          }}
        >
          <div style={{ display: "grid", gap: "0.2rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Stability ranking</h3>
            <p style={{ margin: 0, color: "#67594d", fontSize: "0.92rem" }}>
              Active habits ranked by recent completion rate.
            </p>
          </div>

          <div style={{ display: "grid", gap: "0.7rem" }}>
            {overview.stabilityRanking.length > 0 ? (
              overview.stabilityRanking.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.habitId}
                  style={{
                    display: "grid",
                    gap: "0.2rem",
                    paddingBottom: "0.7rem",
                    borderBottom: "1px solid #ece2d2",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                    <strong style={{ color: "#2a2017" }}>
                      {index + 1}. {entry.name}
                    </strong>
                    <span style={{ color: "#173d35", fontWeight: 700 }}>
                      {Math.round(entry.completionRate * 100)}%
                    </span>
                  </div>
                  <span style={{ color: "#756756", fontSize: "0.88rem" }}>
                    {entry.completedCount}/{entry.totalCount} recent due days
                  </span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: "#756756" }}>No active habits with recent due history yet.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
