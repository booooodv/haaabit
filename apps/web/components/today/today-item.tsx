"use client";

import type { TodayItem } from "@haaabit/contracts/today";
import { useEffect, useState } from "react";

import { Badge, Button, DisabledHint, Field, Input, cn } from "../ui";
import styles from "./today-item.module.css";

type TodayItemProps = {
  item: TodayItem;
  isPending?: boolean;
  onComplete: (habitId: string) => Promise<void>;
  onSetTotal: (habitId: string, total: number) => Promise<void>;
  onUndo: (habitId: string) => Promise<void>;
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
  const { item, isPending = false, onComplete, onSetTotal, onUndo } = props;
  const [draftTotal, setDraftTotal] = useState(String(item.progress.currentValue ?? 0));

  useEffect(() => {
    setDraftTotal(String(item.progress.currentValue ?? 0));
  }, [item.progress.currentValue, item.habitId]);

  function handleComplete() {
    void onComplete(item.habitId);
  }

  function handleSetTotal() {
    const total = Number(draftTotal);

    if (!Number.isFinite(total) || total < 0) {
      return;
    }

    void onSetTotal(item.habitId, total);
  }

  function handleUndo() {
    void onUndo(item.habitId);
  }

  const showUndo = item.status === "completed" || (item.progress.currentValue ?? 0) > 0;

  return (
    <article
      data-testid={`today-item-${item.habitId}`}
      className={cn(styles.card, item.status === "completed" && styles.completed)}
    >
      <div className={styles.header}>
        <div className={styles.copy}>
          <h3 className={styles.title}>{item.name}</h3>
          <p className={styles.progress}>{formatProgress(item)}</p>
        </div>
        <Badge tone={item.status === "completed" ? "success" : "warning"}>
          {item.status}
        </Badge>
      </div>

      {item.kind === "quantity" ? (
        <div className={styles.quantityRow}>
          <Field label="Today's total" htmlFor={`today-total-${item.habitId}`} className={styles.field}>
            <Input
              id={`today-total-${item.habitId}`}
              type="number"
              min={0}
              value={draftTotal}
              onChange={(event) => setDraftTotal(event.target.value)}
              disabled={isPending}
            />
          </Field>

          <div className={styles.actions}>
            <Button type="button" onClick={handleSetTotal} disabled={isPending} size="sm">
              Save total
            </Button>

            {showUndo ? (
              <Button type="button" variant="secondary" onClick={handleUndo} disabled={isPending} size="sm">
                Undo
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {item.status === "pending" ? (
            <Button type="button" onClick={handleComplete} disabled={isPending} size="sm">
              Complete
            </Button>
          ) : null}

          {showUndo ? (
            <Button type="button" variant="secondary" onClick={handleUndo} disabled={isPending} size="sm">
              Undo
            </Button>
          ) : null}
        </div>
      )}

      {isPending ? (
        <DisabledHint>Controls will unlock when this habit finishes syncing with today.</DisabledHint>
      ) : null}
    </article>
  );
}
