"use client";

import type { TodayItem } from "@haaabit/contracts/today";
import { useEffect, useState, useTransition } from "react";

type TodayItemProps = {
  item: TodayItem;
  onComplete: (habitId: string) => void;
  onSetTotal: (habitId: string, total: number) => void;
  onUndo: (habitId: string) => void;
};

function formatProgress(item: TodayItem) {
  if (item.kind === "quantity") {
    const current = item.progress.currentValue ?? 0;
    const target = item.progress.targetValue ?? 0;
    const unit = item.progress.unit ?? "";
    return `${current} / ${target} ${unit}`.trim();
  }

  if (item.frequencyType === "weekly_count" || item.frequencyType === "monthly_count") {
    const current = item.progress.periodCompletions ?? 0;
    const target = item.progress.periodTarget ?? 0;
    return `${current} / ${target} this ${item.frequencyType === "weekly_count" ? "week" : "month"}`;
  }

  return item.status === "completed" ? "Done today" : "Ready for today";
}

export function TodayItemCard(props: TodayItemProps) {
  const { item, onComplete, onSetTotal, onUndo } = props;
  const [isPending, startTransition] = useTransition();
  const [draftTotal, setDraftTotal] = useState(String(item.progress.currentValue ?? 0));

  useEffect(() => {
    setDraftTotal(String(item.progress.currentValue ?? 0));
  }, [item.progress.currentValue, item.habitId]);

  function handleComplete() {
    startTransition(async () => {
      onComplete(item.habitId);
    });
  }

  function handleSetTotal() {
    const total = Number(draftTotal);

    if (!Number.isFinite(total) || total < 0) {
      return;
    }

    startTransition(async () => {
      onSetTotal(item.habitId, total);
    });
  }

  function handleUndo() {
    startTransition(async () => {
      onUndo(item.habitId);
    });
  }

  const showUndo = item.status === "completed" || (item.progress.currentValue ?? 0) > 0;

  return (
    <article
      data-testid={`today-item-${item.name}`}
      style={{
        padding: "1.25rem",
        borderRadius: "1.25rem",
        border: item.status === "completed" ? "1px solid #b7cfbf" : "1px solid #d6cbb8",
        background: item.status === "completed" ? "#edf7ef" : "#fffdf8",
        boxShadow: "0 14px 32px rgba(55, 43, 28, 0.08)",
        display: "grid",
        gap: "0.9rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{item.name}</h3>
          <p style={{ margin: 0, color: "#6d6255" }}>{formatProgress(item)}</p>
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: item.status === "completed" ? "#356245" : "#7a5c2d",
          }}
        >
          {item.status}
        </span>
      </div>

      {item.kind === "quantity" ? (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "grid", gap: "0.35rem", color: "#5e5346", fontSize: "0.9rem" }}>
            Today&apos;s total
            <input
              aria-label="Today's total"
              type="number"
              min={0}
              value={draftTotal}
              onChange={(event) => setDraftTotal(event.target.value)}
              disabled={isPending}
              style={{
                width: "7rem",
                borderRadius: "0.8rem",
                border: "1px solid #cbbca5",
                padding: "0.65rem 0.75rem",
                background: "#fff",
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleSetTotal}
            disabled={isPending}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "0.8rem 1rem",
              background: "#1f5c4d",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Save total
          </button>

          {showUndo ? (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isPending}
              style={{
                borderRadius: "999px",
                padding: "0.8rem 1rem",
                border: "1px solid #a99a83",
                background: "transparent",
                color: "#453b2f",
                fontWeight: 700,
              }}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {item.status === "pending" ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isPending}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "0.8rem 1rem",
                background: "#1f5c4d",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Complete
            </button>
          ) : null}

          {showUndo ? (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isPending}
              style={{
                borderRadius: "999px",
                padding: "0.8rem 1rem",
                border: "1px solid #a99a83",
                background: "transparent",
                color: "#453b2f",
                fontWeight: 700,
              }}
            >
              Undo
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
