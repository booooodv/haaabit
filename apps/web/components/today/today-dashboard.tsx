"use client";

import type { TodaySummary } from "@haaabit/contracts/today";
import { useState } from "react";

import {
  completeTodayHabit,
  setTodayHabitTotal,
  undoTodayHabit,
} from "../../lib/auth-client";
import { useLocale } from "../locale";
import { InlineStatus, PageFrame, StatePanel, Surface } from "../ui";
import { TodayItemCard } from "./today-item";
import styles from "./today-dashboard.module.css";

type TodayDashboardProps = {
  initialSummary: TodaySummary;
  onActionSettled?: () => Promise<void>;
};

type Feedback = {
  tone: "neutral" | "success" | "danger";
  title: string;
  message: string;
};

type CardFeedback = Feedback & {
  habitId: string;
};

export function TodayDashboard({ initialSummary, onActionSettled }: TodayDashboardProps) {
  const { copy } = useLocale();
  const [summary, setSummary] = useState(initialSummary);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [cardFeedback, setCardFeedback] = useState<CardFeedback | null>(null);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  async function applyAction(
    habitId: string,
    pendingTitle: string,
    successTitle: string,
    successMessage: string,
    cardSuccessMessage: string,
    action: () => Promise<{ summary: TodaySummary }>,
  ) {
    setFeedback({
      tone: "neutral",
      title: copy.today.feedback.updatingTitle,
      message: copy.today.feedback.updatingMessage,
    });
    setCardFeedback({
      habitId,
      tone: "neutral",
      title: pendingTitle,
      message: copy.today.feedback.updatingMessage,
    });
    setActiveHabitId(habitId);
    setIsMutating(true);

    try {
      const result = await action();
      setSummary(result.summary);
      await onActionSettled?.();
      setFeedback({
        tone: "success",
        title: copy.today.feedback.updatedTitle,
        message: successMessage,
      });
      setCardFeedback({
        habitId,
        tone: "success",
        title: successTitle,
        message: cardSuccessMessage,
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : copy.today.feedback.updateErrorTitle;

      setFeedback({
        tone: "danger",
        title: copy.today.feedback.retryTitle,
        message,
      });
      setCardFeedback({
        habitId,
        tone: "danger",
        title: copy.today.feedback.updateErrorTitle,
        message,
      });
    } finally {
      setActiveHabitId(null);
      setIsMutating(false);
    }
  }

  const hasNothingDue = summary.pendingCount === 0 && summary.completedCount === 0;
  const hasAllDone = summary.pendingCount === 0 && summary.completedCount > 0;

  return (
    <section className={styles.stack} data-testid="today-dashboard">
      <Surface variant="hero">
        <PageFrame className={styles.heroFrame}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryCopy}>
              <p className={styles.eyebrow}>{copy.today.hero.eyebrow}</p>
              <h1>{copy.today.hero.title}</h1>
              <p className={styles.summaryDescription}>
                {copy.today.hero.summary(summary.pendingCount, summary.completedCount)}
              </p>
            </div>

            <div className={styles.rateCard}>
              <div className={styles.rateLabel}>{copy.today.hero.completionRate}</div>
              <div className={styles.rateValue}>{Math.round(summary.completionRate * 100)}%</div>
            </div>
          </div>

          {feedback ? (
            <InlineStatus tone={feedback.tone} title={feedback.title} testId="today-feedback">
              {feedback.message}
            </InlineStatus>
          ) : null}
        </PageFrame>
      </Surface>

      {hasNothingDue ? (
        <StatePanel
          testId="today-primary-state"
          title={copy.today.states.nothingDue.title}
          description={copy.today.states.nothingDue.description}
        />
      ) : null}

      {hasAllDone ? (
        <StatePanel
          testId="today-primary-state"
          tone="success"
          title={copy.today.states.allDone.title}
          description={copy.today.states.allDone.description}
        />
      ) : null}

      <div className={styles.sections}>
        <section className={styles.group}>
          <div className={styles.groupHeader}>
            <h2>{copy.today.groups.pending.title}</h2>
            <span className={styles.groupCount}>{copy.today.groups.pending.count(summary.pendingCount)}</span>
          </div>
          {summary.pendingItems.length > 0 ? (
            <div className={styles.cards}>
              {summary.pendingItems.map((item) => (
                <TodayItemCard
                  key={`${item.habitId}-${item.status}-${item.progress.currentValue ?? "none"}`}
                  item={item}
                  feedback={cardFeedback?.habitId === item.habitId ? cardFeedback : null}
                  isPending={isMutating && activeHabitId === item.habitId}
                  onComplete={(habitId) =>
                    applyAction(
                      habitId,
                      copy.today.actions.complete.pendingTitle,
                      copy.today.actions.complete.successTitle,
                      copy.today.actions.complete.successMessage,
                      copy.today.actions.complete.cardSuccessMessage,
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      copy.today.actions.setTotal.pendingTitle,
                      copy.today.actions.setTotal.successTitle,
                      copy.today.actions.setTotal.successMessagePending,
                      copy.today.actions.setTotal.cardSuccessMessage,
                      () =>
                        setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({
                          summary: result.summary,
                        })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(
                      habitId,
                      copy.today.actions.undo.pendingTitle,
                      copy.today.actions.undo.successTitle,
                      copy.today.actions.undo.successMessagePending,
                      copy.today.actions.undo.cardSuccessMessage,
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : hasNothingDue || hasAllDone ? null : (
            <StatePanel
              title={copy.today.states.nothingPending.title}
              description={copy.today.states.nothingPending.description}
              compact
            />
          )}
        </section>

        <section className={styles.group}>
          <div className={styles.groupHeader}>
            <h2>{copy.today.groups.completed.title}</h2>
            <span className={styles.groupCount}>{copy.today.groups.completed.count(summary.completedCount)}</span>
          </div>
          {summary.completedItems.length > 0 ? (
            <div className={styles.cards}>
              {summary.completedItems.map((item) => (
                <TodayItemCard
                  key={`${item.habitId}-${item.status}-${item.progress.currentValue ?? "none"}`}
                  item={item}
                  feedback={cardFeedback?.habitId === item.habitId ? cardFeedback : null}
                  isPending={isMutating && activeHabitId === item.habitId}
                  onComplete={(habitId) =>
                    applyAction(
                      habitId,
                      copy.today.actions.complete.pendingTitle,
                      copy.today.actions.complete.successTitle,
                      copy.today.actions.complete.successMessage,
                      copy.today.actions.complete.cardSuccessMessage,
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      copy.today.actions.setTotal.pendingTitle,
                      copy.today.actions.setTotal.successTitle,
                      copy.today.actions.setTotal.successMessageCompleted,
                      copy.today.actions.setTotal.cardSuccessMessage,
                      () =>
                        setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({
                          summary: result.summary,
                        })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(
                      habitId,
                      copy.today.actions.undo.pendingTitle,
                      copy.today.actions.undo.successTitle,
                      copy.today.actions.undo.successMessageCompleted,
                      copy.today.actions.undo.cardSuccessMessage,
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : hasNothingDue ? null : (
            <StatePanel
              title={copy.today.states.nothingCompleted.title}
              description={copy.today.states.nothingCompleted.description}
              compact
            />
          )}
        </section>
      </div>
    </section>
  );
}
