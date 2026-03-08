"use client";

import type { TodaySummary } from "@haaabit/contracts/today";
import { useState } from "react";

import {
  completeTodayHabit,
  setTodayHabitTotal,
  undoTodayHabit,
} from "../../lib/auth-client";
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
      title: "Updating today",
      message: "Your lists and summary will stay in sync when this update settles.",
    });
    setCardFeedback({
      habitId,
      tone: "neutral",
      title: pendingTitle,
      message: "Saving this update without leaving the card.",
    });
    setActiveHabitId(habitId);
    setIsMutating(true);

    try {
      const result = await action();
      setSummary(result.summary);
      await onActionSettled?.();
      setFeedback({
        tone: "success",
        title: "Today updated",
        message: successMessage,
      });
      setCardFeedback({
        habitId,
        tone: "success",
        title: successTitle,
        message: cardSuccessMessage,
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to update today";

      setFeedback({
        tone: "danger",
        title: "Today needs another try",
        message,
      });
      setCardFeedback({
        habitId,
        tone: "danger",
        title: "Unable to update today",
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
              <p className={styles.eyebrow}>Daily focus</p>
              <h1>Today</h1>
              <p className={styles.summaryDescription}>
                {summary.pendingCount} pending · {summary.completedCount} completed
              </p>
            </div>

            <div className={styles.rateCard}>
              <div className={styles.rateLabel}>Completion rate</div>
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
          title="Nothing due today"
          description="Today's list is clear for now. Future or off-cycle habits will show up here when they become actionable."
        />
      ) : null}

      {hasAllDone ? (
        <StatePanel
          testId="today-primary-state"
          tone="success"
          title="All done for today"
          description="Everything due today is already complete. Finished habits stay visible below in case you need to review or undo."
        />
      ) : null}

      <div className={styles.sections}>
        <section className={styles.group}>
          <div className={styles.groupHeader}>
            <h2>Pending</h2>
            <span className={styles.groupCount}>{summary.pendingCount} pending</span>
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
                      "Marking habit complete",
                      "Habit updated",
                      "The pending list and completion totals are now in sync.",
                      "Marked complete. You can undo from this card if needed.",
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      "Saving today total",
                      "Total saved",
                      "The updated quantity now counts toward today's completion status.",
                      "Saved in place. Today's quantity is now up to date.",
                      () =>
                        setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({
                          summary: result.summary,
                        })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(
                      habitId,
                      "Reverting latest update",
                      "Update reverted",
                      "Today's totals now reflect the previous saved value.",
                      "Reverted to the previous saved value.",
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : hasNothingDue || hasAllDone ? null : (
            <StatePanel
              title="Nothing pending right now"
              description="New or incomplete habits will stay here until you finish them."
              compact
            />
          )}
        </section>

        <section className={styles.group}>
          <div className={styles.groupHeader}>
            <h2>Completed</h2>
            <span className={styles.groupCount}>{summary.completedCount} completed</span>
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
                      "Marking habit complete",
                      "Habit updated",
                      "The completed list has been refreshed in place.",
                      "Marked complete. You can undo from this card if needed.",
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      "Saving today total",
                      "Total saved",
                      "The completed list now reflects the latest quantity value.",
                      "Saved in place. Today's quantity is now up to date.",
                      () =>
                        setTodayHabitTotal({ habitId, total, source: "web" }).then((result) => ({
                          summary: result.summary,
                        })),
                    )
                  }
                  onUndo={(habitId) =>
                    applyAction(
                      habitId,
                      "Reverting latest update",
                      "Update reverted",
                      "This habit has moved back to the appropriate today state.",
                      "Reverted to the previous saved value.",
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : hasNothingDue ? null : (
            <StatePanel
              title="Nothing completed yet"
              description="Finished habits stay visible so you can undo or inspect today's result without leaving context."
              compact
            />
          )}
        </section>
      </div>
    </section>
  );
}
