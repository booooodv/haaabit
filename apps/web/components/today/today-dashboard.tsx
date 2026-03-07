"use client";

import type { TodaySummary } from "@haaabit/contracts/today";
import { useState, useTransition } from "react";

import {
  completeTodayHabit,
  setTodayHabitTotal,
  undoTodayHabit,
} from "../../lib/auth-client";
import { TodayItemCard } from "./today-item";

type TodayDashboardProps = {
  initialSummary: TodaySummary;
};

export function TodayDashboard({ initialSummary }: TodayDashboardProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  function applyAction(action: () => Promise<{ summary: TodaySummary }>) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await action();
        setSummary(result.summary);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to update today");
      }
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.75rem",
          borderRadius: "1.75rem",
          background: "linear-gradient(135deg, #fff8ec 0%, #f6efe4 100%)",
          border: "1px solid #dbcfbe",
          boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <p style={{ margin: 0, color: "#756858", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
              Daily focus
            </p>
            <h1 style={{ margin: 0, fontSize: "2.1rem" }}>Today</h1>
            <p style={{ margin: 0, color: "#5c5145" }}>
              {summary.pendingCount} pending · {summary.completedCount} completed
            </p>
          </div>

          <div
            style={{
              minWidth: "12rem",
              padding: "1rem 1.15rem",
              borderRadius: "1.2rem",
              background: "#173d35",
              color: "#f7f3e8",
            }}
          >
            <div style={{ fontSize: "0.85rem", opacity: 0.78 }}>Completion rate</div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>{Math.round(summary.completionRate * 100)}%</div>
          </div>
        </div>

        {error ? (
          <p style={{ margin: 0, color: "#a12b2b" }}>{error}</p>
        ) : isRefreshing ? (
          <p style={{ margin: 0, color: "#6c5b44" }}>Updating today…</p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <section style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
            <h2 style={{ margin: 0 }}>Pending</h2>
            <span style={{ color: "#6a5c4e" }}>{summary.pendingCount} pending</span>
          </div>

          {summary.pendingItems.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {summary.pendingItems.map((item) => (
                <TodayItemCard
                  key={`${item.habitId}-${item.status}-${item.progress.currentValue ?? "none"}`}
                  item={item}
                  onComplete={(habitId) =>
                    applyAction(() => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })))
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(() =>
                      setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(() => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })))
                  }
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                borderRadius: "1.25rem",
                border: "1px dashed #cdbfa9",
                padding: "1.5rem",
                color: "#6a5c4e",
                background: "#fffcf5",
              }}
            >
              Nothing pending right now.
            </div>
          )}
        </section>

        <section style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
            <h2 style={{ margin: 0 }}>Completed</h2>
            <span style={{ color: "#6a5c4e" }}>{summary.completedCount} completed</span>
          </div>

          {summary.completedItems.length > 0 ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              {summary.completedItems.map((item) => (
                <TodayItemCard
                  key={`${item.habitId}-${item.status}-${item.progress.currentValue ?? "none"}`}
                  item={item}
                  onComplete={(habitId) =>
                    applyAction(() => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })))
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(() =>
                      setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(() => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })))
                  }
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                borderRadius: "1.25rem",
                border: "1px dashed #cdbfa9",
                padding: "1.5rem",
                color: "#6a5c4e",
                background: "#fffcf5",
              }}
            >
              Completed habits will land here.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
