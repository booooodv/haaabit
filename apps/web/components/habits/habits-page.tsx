"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import {
  archiveHabit,
  listHabits,
  restoreHabit,
  type HabitRecord,
} from "../../lib/auth-client";
import { routes } from "../../lib/navigation";
import {
  Badge,
  Button,
  DisabledHint,
  Field,
  InlineStatus,
  Input,
  OverlayPanel,
  PageFrame,
  PageHeader,
  Select,
  StatePanel,
  Surface,
} from "../ui";
import { HabitCreateForm } from "./habit-create-form";
import { HabitDetailDrawer } from "./habit-detail-drawer";
import styles from "./habits-page.module.css";

type HabitsPageProps = {
  initialItems: HabitRecord[];
  initialStatus?: HabitStatus;
  initialDetail?: HabitDetail | null;
  closeDetailHref?: string;
};

type HabitStatus = "active" | "archived";
type HabitKindFilter = "all" | "boolean" | "quantity";
type OverlayState =
  | { mode: "create"; habit: null }
  | { mode: "edit"; habit: HabitRecord }
  | null;
type Feedback = {
  tone: "neutral" | "success" | "danger";
  title: string;
  message: string;
};

function formatFrequency(habit: HabitRecord) {
  switch (habit.frequencyType) {
    case "daily":
      return "Daily";
    case "weekly_count":
      return `${habit.frequencyCount ?? 1} times per week`;
    case "monthly_count":
      return `${habit.frequencyCount ?? 1} times per month`;
    case "weekdays":
      return habit.weekdays.join(", ");
    default:
      return habit.frequencyType;
  }
}

function formatMeta(habit: HabitRecord) {
  if (habit.kind === "quantity") {
    return `${habit.targetValue ?? 0} ${habit.unit ?? "units"}`;
  }

  return "Boolean";
}

export function HabitsPage({
  initialItems,
  initialStatus = "active",
  initialDetail = null,
  closeDetailHref = routes.habits,
}: HabitsPageProps) {
  const [status, setStatus] = useState<HabitStatus>(initialStatus);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [kind, setKind] = useState<HabitKindFilter>("all");
  const [items, setItems] = useState(initialItems);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const deferredCategory = useDeferredValue(category);

  async function fetchHabits(
    nextStatus: HabitStatus,
    nextQuery: string,
    nextCategory: string,
    nextKind: HabitKindFilter,
  ) {
    return listHabits({
      status: nextStatus,
      query: nextQuery.trim() || undefined,
      category: nextCategory.trim() || undefined,
      kind: nextKind === "all" ? undefined : nextKind,
    });
  }

  async function refreshCurrentList(options?: {
    pendingTitle?: string;
    pendingMessage?: string;
    success?: Feedback | null;
  }) {
    setIsPending(true);

    if (options?.pendingTitle && options.pendingMessage) {
      setFeedback({
        tone: "neutral",
        title: options.pendingTitle,
        message: options.pendingMessage,
      });
    }

    try {
      const nextItems = await fetchHabits(status, deferredQuery, deferredCategory, kind);
      setItems(nextItems);
      setFeedback(options?.success ?? null);
    } catch (loadError) {
      setFeedback({
        tone: "danger",
        title: "Unable to update habits",
        message: loadError instanceof Error ? loadError.message : "Unable to update habits",
      });
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    void refreshCurrentList({
      pendingTitle: "Refreshing habits",
      pendingMessage: "Filters and saved changes stay in place while this list updates.",
    });
  }, [deferredCategory, deferredQuery, kind, status]);

  async function handleArchive(habitId: string) {
    setIsPending(true);
    setFeedback({
      tone: "neutral",
      title: "Archiving habit",
      message: "The list will refresh in place when this update settles.",
    });

    try {
      await archiveHabit(habitId);
      const nextItems = await fetchHabits(status, deferredQuery, deferredCategory, kind);
      setItems(nextItems);
      setFeedback({
        tone: "success",
        title: "Habit archived",
        message: "Archived habits move out of the active list without losing history.",
      });
    } catch (actionError) {
      setFeedback({
        tone: "danger",
        title: "Unable to update habits",
        message: actionError instanceof Error ? actionError.message : "Unable to archive habit",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleRestore(habitId: string) {
    setIsPending(true);
    setFeedback({
      tone: "neutral",
      title: "Restoring habit",
      message: "The archived list will refresh in place when this update settles.",
    });

    try {
      await restoreHabit(habitId);
      const nextItems = await fetchHabits(status, deferredQuery, deferredCategory, kind);
      setItems(nextItems);
      setFeedback({
        tone: "success",
        title: "Habit restored",
        message: "The habit is back in the active working set and keeps its history.",
      });
    } catch (actionError) {
      setFeedback({
        tone: "danger",
        title: "Unable to update habits",
        message: actionError instanceof Error ? actionError.message : "Unable to restore habit",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={styles.stack} data-testid="habits-page">
      <Surface variant="hero">
        <PageFrame>
          <PageHeader
            eyebrow="Maintenance surface"
            title="Habits"
            description="Search, edit, archive, and restore habits without touching historical records."
            actions={
              <Button
                type="button"
                onClick={() => setOverlay({ mode: "create", habit: null })}
                size="lg"
                disabled={isPending}
              >
                New habit
              </Button>
            }
          />

          <div className={styles.segmented}>
            {(["active", "archived"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={option === status ? "primary" : "secondary"}
                onClick={() => setStatus(option)}
                disabled={isPending}
              >
                {option === "active" ? "Active" : "Archived"}
              </Button>
            ))}
          </div>

          <div className={styles.filters}>
            <Field label="Search" htmlFor="habit-search">
              <Input
                id="habit-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or category"
                disabled={isPending}
              />
            </Field>

            <Field label="Category" htmlFor="habit-category-filter">
              <Input
                id="habit-category-filter"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Filter by category"
                disabled={isPending}
              />
            </Field>

            <Field label="Kind" htmlFor="habit-kind-filter">
              <Select
                id="habit-kind-filter"
                value={kind}
                onChange={(event) => setKind(event.target.value as HabitKindFilter)}
                disabled={isPending}
              >
                <option value="all">All kinds</option>
                <option value="boolean">Boolean</option>
                <option value="quantity">Quantity</option>
              </Select>
            </Field>
          </div>

          {feedback ? (
            <InlineStatus tone={feedback.tone} title={feedback.title} testId="habits-feedback">
              {feedback.message}
            </InlineStatus>
          ) : null}
          {isPending ? (
            <DisabledHint>Filters and habit actions unlock when the current refresh finishes.</DisabledHint>
          ) : null}
        </PageFrame>
      </Surface>

      <div className={styles.list}>
        {items.length > 0 ? (
          items.map((habit) => (
            <article key={habit.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={styles.badgeRow}>
                    <h2 className={styles.heading}>{habit.name}</h2>
                    <Badge tone="neutral">{habit.kind}</Badge>
                    {habit.category ? <Badge tone="info">{habit.category}</Badge> : null}
                  </div>
                  <p className={styles.description}>{habit.description ?? "No description yet."}</p>
                </div>

                <div className={styles.actions}>
                  <Link href={routes.habitDetail(habit.id)} className={styles.linkAction}>
                    View details
                  </Link>
                  {status === "active" ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setOverlay({ mode: "edit", habit })}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleArchive(habit.id)}
                        disabled={isPending}
                      >
                        Archive
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleRestore(habit.id)}
                      disabled={isPending}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <strong className={styles.metaLabel}>Frequency</strong>
                  {formatFrequency(habit)}
                </div>
                <div>
                  <strong className={styles.metaLabel}>Target</strong>
                  {formatMeta(habit)}
                </div>
                <div>
                  <strong className={styles.metaLabel}>Start date</strong>
                  {habit.startDate}
                </div>
                <div>
                  <strong className={styles.metaLabel}>State</strong>
                  {habit.isActive ? "Active" : "Archived"}
                </div>
              </div>
            </article>
          ))
        ) : (
          <StatePanel
            title={status === "active" ? "No active habits match these filters" : "No archived habits match these filters"}
            description={
              status === "active"
                ? "Adjust search, category, or kind to bring habits back into view."
                : "Archived habits stay here until you restore them to the active list."
            }
          />
        )}
      </div>

      {overlay ? (
        <OverlayPanel
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setOverlay(null);
            }
          }}
          variant="dialog"
          title={overlay.mode === "create" ? "Create habit" : `Edit ${overlay.habit.name}`}
          description={
            overlay.mode === "create"
              ? "Add a new habit without leaving the management list."
              : "Update future behavior only. History remains unchanged."
          }
          testId="habit-form-overlay"
        >
          <HabitCreateForm
            key={overlay.mode === "create" ? "create" : overlay.habit.id}
            mode={overlay.mode}
            initialHabit={overlay.habit}
            submitLabel={overlay.mode === "create" ? "Create habit" : "Save changes"}
            onCancel={() => setOverlay(null)}
            onSubmitted={async () => {
              const nextMode = overlay.mode;
              setOverlay(null);
              if (overlay.mode === "create" && status !== "active") {
                setStatus("active");
                return;
              }

              await refreshCurrentList({
                pendingTitle: nextMode === "create" ? "Saving new habit" : "Saving habit changes",
                pendingMessage: "The list will refresh in place once the latest habit changes land.",
                success: {
                  tone: "success",
                  title: nextMode === "create" ? "Habit created" : "Habit updated",
                  message:
                    nextMode === "create"
                      ? "The new habit is now part of the current working set."
                      : "Future behavior has been updated without rewriting history.",
                },
              });
            }}
          />
        </OverlayPanel>
      ) : null}

      {initialDetail ? <HabitDetailDrawer detail={initialDetail} closeHref={closeDetailHref} /> : null}
    </div>
  );
}
