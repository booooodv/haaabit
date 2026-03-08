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

export function TodayDashboard({ initialSummary, onActionSettled }: TodayDashboardProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  async function applyAction(
    habitId: string,
    pendingTitle: string,
    successTitle: string,
    successMessage: string,
    action: () => Promise<{ summary: TodaySummary }>,
  ) {
    setFeedback({
      tone: "neutral",
      title: pendingTitle,
      message: "This action stays in place and unlocks when the current update finishes.",
    });
    setActiveHabitId(habitId);
    setIsMutating(true);

    try {
      const result = await action();
      setSummary(result.summary);
      await onActionSettled?.();
      setFeedback({
        tone: "success",
        title: successTitle,
        message: successMessage,
      });
    } catch (submissionError) {
      setFeedback({
        tone: "danger",
        title: "Unable to update today",
        message: submissionError instanceof Error ? submissionError.message : "Unable to update today",
      });
    } finally {
      setActiveHabitId(null);
      setIsMutating(false);
    }
  }

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
                  isPending={isMutating && activeHabitId === item.habitId}
                  onComplete={(habitId) =>
                    applyAction(
                      habitId,
                      "Marking habit complete",
                      "Habit updated",
                      "The pending list and completion totals are now in sync.",
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      "Saving today total",
                      "Total saved",
                      "The updated quantity now counts toward today's completion status.",
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
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : (
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
                  isPending={isMutating && activeHabitId === item.habitId}
                  onComplete={(habitId) =>
                    applyAction(
                      habitId,
                      "Marking habit complete",
                      "Habit updated",
                      "The completed list has been refreshed in place.",
                      () => completeTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                  onSetTotal={(habitId, total) =>
                    applyAction(
                      habitId,
                      "Saving today total",
                      "Total saved",
                      "The completed list now reflects the latest quantity value.",
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
                      () => undoTodayHabit({ habitId, source: "web" }).then((result) => ({ summary: result.summary })),
                    )
                  }
                />
              ))}
            </div>
          ) : (
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
