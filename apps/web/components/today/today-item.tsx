"use client";

import type { TodayItem } from "@haaabit/contracts/today";
import { useEffect, useState } from "react";

import { useLocale } from "../locale";
import { Badge, Button, DisabledHint, InlineStatus, Input, cn } from "../ui";
import styles from "./today-item.module.css";

type ItemFeedback = {
  tone: "neutral" | "success" | "danger";
  title: string;
  message: string;
};

type TodayItemProps = {
  item: TodayItem;
  feedback?: ItemFeedback | null;
  isPending?: boolean;
  onComplete: (habitId: string) => Promise<void>;
  onSetTotal: (habitId: string, total: number) => Promise<void>;
  onUndo: (habitId: string) => Promise<void>;
};

function formatProgress(item: TodayItem, copy: ReturnType<typeof useLocale>["copy"]["today"]["item"]) {
  if (item.kind === "quantity") {
    const current = item.progress.currentValue ?? 0;
    const target = item.progress.targetValue ?? 0;
    const unit = item.progress.unit ?? "";
    return `${current} / ${target} ${unit}`.trim();
  }

  if (item.frequencyType === "weekly_count" || item.frequencyType === "monthly_count") {
    const current = item.progress.periodCompletions ?? 0;
    const target = item.progress.periodTarget ?? 0;
    return copy.progress.period(current, target, item.frequencyType === "weekly_count" ? "week" : "month");
  }

  return item.status === "completed" ? copy.progress.doneToday : copy.progress.readyToday;
}

export function TodayItemCard(props: TodayItemProps) {
  const { item, feedback = null, isPending = false, onComplete, onSetTotal, onUndo } = props;
  const { copy } = useLocale();
  const [draftTotal, setDraftTotal] = useState("0");

  useEffect(() => {
    setDraftTotal("0");
  }, [item.progress.currentValue, item.habitId]);

  function handleComplete() {
    void onComplete(item.habitId);
  }

  function handleSetTotal() {
    const amount = Number(draftTotal);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    void onSetTotal(item.habitId, (item.progress.currentValue ?? 0) + amount);
  }

  function handleUndo() {
    void onUndo(item.habitId);
  }

  const showUndo = item.canUndo;
  const showHeaderActions = item.kind !== "quantity" && (item.status !== "completed" || showUndo);

  return (
    <article
      data-testid={`today-item-${item.habitId}`}
      className={cn(styles.card, item.status === "completed" && styles.completed)}
    >
      <div className={styles.header}>
        <div className={styles.copy}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{item.name}</h3>
            <Badge tone={item.status === "completed" ? "success" : "warning"}>
              {copy.today.item.status[item.status]}
            </Badge>
          </div>
          <p className={styles.progress}>{formatProgress(item, copy.today.item)}</p>
        </div>

        {showHeaderActions ? (
          <div className={styles.headerActions}>
            {item.status !== "completed" ? (
              <Button type="button" onClick={handleComplete} disabled={isPending} size="sm">
                {copy.today.actions.complete.label}
              </Button>
            ) : null}

            {showUndo ? (
              <Button type="button" variant="secondary" onClick={handleUndo} disabled={isPending} size="sm">
                {copy.today.actions.undo.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {item.kind === "quantity" ? (
        <div className={styles.quantitySection}>
          <label className={styles.quantityLabel} htmlFor={`today-total-${item.habitId}`}>
            {copy.today.item.totalLabel}
          </label>

          <div className={styles.quantityRow} data-testid="today-quantity-row">
            <Input
              id={`today-total-${item.habitId}`}
              type="number"
              min={1}
              value={draftTotal}
              onChange={(event) => setDraftTotal(event.target.value)}
              disabled={isPending}
              className={styles.quantityInput}
            />

            <div className={styles.actions}>
              <Button type="button" onClick={handleSetTotal} disabled={isPending}>
                {copy.today.item.saveTotal}
              </Button>

              {showUndo ? (
                <Button type="button" variant="secondary" onClick={handleUndo} disabled={isPending}>
                  {copy.today.actions.undo.label}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <InlineStatus
          tone={feedback.tone}
          title={feedback.title}
          testId={`today-item-feedback-${item.habitId}`}
        >
          {feedback.message}
        </InlineStatus>
      ) : null}

      {isPending ? (
        <DisabledHint>{copy.today.item.disabledHint}</DisabledHint>
      ) : null}
    </article>
  );
}
