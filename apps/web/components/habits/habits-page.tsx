"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";

import {
  archiveHabit,
  listHabits,
  restoreHabit,
  type HabitRecord,
} from "../../lib/auth-client";
import { getHabitsCopy } from "../../lib/i18n/habits";
import { routes } from "../../lib/navigation";
import { useLocale } from "../locale";
import {
  Badge,
  Button,
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

function formatFrequency(habit: HabitRecord, copy: ReturnType<typeof getHabitsCopy>) {
  switch (habit.frequencyType) {
    case "daily":
      return copy.page.frequency.daily;
    case "weekly_count":
      return copy.page.frequency.weeklyCount(habit.frequencyCount ?? 1);
    case "monthly_count":
      return copy.page.frequency.monthlyCount(habit.frequencyCount ?? 1);
    case "weekdays":
      return copy.page.frequency.weekdays(habit.weekdays);
    default:
      return habit.frequencyType;
  }
}

function formatMeta(habit: HabitRecord, copy: ReturnType<typeof getHabitsCopy>) {
  if (habit.kind === "quantity") {
    return `${habit.targetValue ?? 0} ${habit.unit ?? copy.page.card.unitsFallback}`;
  }

  return copy.page.card.booleanKind;
}

export function HabitsPage({
  initialItems,
  initialStatus = "active",
  initialDetail = null,
  closeDetailHref = routes.habits,
}: HabitsPageProps) {
  const { locale } = useLocale();
  const copy = getHabitsCopy(locale);
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
  const requestIdRef = useRef(0);
  const overlayTriggerRef = useRef<HTMLElement | null>(null);
  const workingSetSummary = copy.page.toolbar.workingSetSummary(status, items.length);

  function rememberOverlayTrigger(target: HTMLElement) {
    overlayTriggerRef.current = target;
  }

  function restoreOverlayTriggerFocus() {
    const trigger = overlayTriggerRef.current;
    if (!trigger) {
      return;
    }

    requestAnimationFrame(() => {
      trigger.focus();
    });
  }

  function closeOverlayAndRestoreFocus() {
    setOverlay(null);
    restoreOverlayTriggerFocus();
  }

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
    const requestId = ++requestIdRef.current;
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
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(nextItems);
      setFeedback(options?.success ?? null);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setFeedback({
        tone: "danger",
        title: copy.page.feedback.updatingErrorTitle,
        message: loadError instanceof Error ? loadError.message : copy.page.feedback.updatingErrorTitle,
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsPending(false);
      }
    }
  }

  useEffect(() => {
    void refreshCurrentList({
      pendingTitle: copy.page.feedback.refreshPendingTitle,
      pendingMessage: copy.page.feedback.refreshPendingMessage,
    });
  }, [copy.page.feedback.refreshPendingMessage, copy.page.feedback.refreshPendingTitle, deferredCategory, deferredQuery, kind, status]);

  async function handleArchive(habitId: string) {
    const requestId = ++requestIdRef.current;
    setIsPending(true);
    setFeedback({
      tone: "neutral",
      title: copy.page.feedback.archivePendingTitle,
      message: copy.page.feedback.archivePendingMessage,
    });

    try {
      await archiveHabit(habitId);
      const nextItems = await fetchHabits(status, deferredQuery, deferredCategory, kind);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(nextItems);
      setFeedback({
        tone: "success",
        title: copy.page.feedback.archiveSuccessTitle,
        message: copy.page.feedback.archiveSuccessMessage,
      });
    } catch (actionError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setFeedback({
        tone: "danger",
        title: copy.page.feedback.updatingErrorTitle,
        message: actionError instanceof Error ? actionError.message : copy.page.feedback.updatingErrorTitle,
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsPending(false);
      }
    }
  }

  async function handleRestore(habitId: string) {
    const requestId = ++requestIdRef.current;
    setIsPending(true);
    setFeedback({
      tone: "neutral",
      title: copy.page.feedback.restorePendingTitle,
      message: copy.page.feedback.restorePendingMessage,
    });

    try {
      await restoreHabit(habitId);
      const nextItems = await fetchHabits(status, deferredQuery, deferredCategory, kind);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(nextItems);
      setFeedback({
        tone: "success",
        title: copy.page.feedback.restoreSuccessTitle,
        message: copy.page.feedback.restoreSuccessMessage,
      });
    } catch (actionError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setFeedback({
        tone: "danger",
        title: copy.page.feedback.updatingErrorTitle,
        message: actionError instanceof Error ? actionError.message : copy.page.feedback.updatingErrorTitle,
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsPending(false);
      }
    }
  }

  return (
    <div className={styles.stack} data-testid="habits-page">
      <Surface variant="hero">
        <PageFrame>
          <PageHeader
            eyebrow={copy.page.header.eyebrow}
            title={copy.page.header.title}
            description={copy.page.header.description}
          />

          <div className={styles.toolbar} data-testid="habits-toolbar">
            <Surface variant="soft" padding="md" className={styles.toolbarPanel}>
              <div className={styles.toolbarTop}>
                <div className={styles.toolbarIntro}>
                  <span className={styles.toolbarLabel}>{copy.page.toolbar.label}</span>
                  <strong className={styles.toolbarValue}>{workingSetSummary}</strong>
                  <p className={styles.toolbarDescription}>{copy.page.toolbar.description}</p>
                </div>

                <div className={styles.toolbarActions}>
                  <Button
                    type="button"
                    onClick={(event) => {
                      rememberOverlayTrigger(event.currentTarget);
                      setOverlay({ mode: "create", habit: null });
                    }}
                    size="lg"
                  >
                    {copy.page.toolbar.newHabit}
                  </Button>

                  <div className={styles.segmented} role="group" aria-label={copy.page.toolbar.statusGroupLabel}>
                    {(["active", "archived"] as const).map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={option === status ? "primary" : "secondary"}
                        onClick={() => setStatus(option)}
                        aria-pressed={option === status}
                      >
                        {option === "active" ? copy.page.toolbar.active : copy.page.toolbar.archived}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.filters} data-testid="habits-filters">
                <Field label={copy.page.filters.search} htmlFor="habit-search">
                  <Input
                    id="habit-search"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={copy.page.filters.searchPlaceholder}
                  />
                </Field>

                <Field label={copy.page.filters.category} htmlFor="habit-category-filter">
                  <Input
                    id="habit-category-filter"
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder={copy.page.filters.categoryPlaceholder}
                  />
                </Field>

                <Field label={copy.page.filters.kind} htmlFor="habit-kind-filter">
                  <Select
                    id="habit-kind-filter"
                    value={kind}
                    onChange={(event) => setKind(event.target.value as HabitKindFilter)}
                  >
                    <option value="all">{copy.page.filters.kindOptions.all}</option>
                    <option value="boolean">{copy.page.filters.kindOptions.boolean}</option>
                    <option value="quantity">{copy.page.filters.kindOptions.quantity}</option>
                  </Select>
                </Field>
              </div>
            </Surface>
          </div>

          {feedback ? (
            <InlineStatus tone={feedback.tone} title={feedback.title} testId="habits-feedback">
              {feedback.message}
            </InlineStatus>
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
                    <Badge tone="neutral">
                      {habit.kind === "quantity" ? copy.page.card.quantityKind : copy.page.card.booleanKind}
                    </Badge>
                    {habit.category ? <Badge tone="info">{habit.category}</Badge> : null}
                  </div>
                  <p className={styles.description}>{habit.description ?? copy.page.card.noDescription}</p>
                </div>

                <div className={styles.actions}>
                  <Link
                    href={routes.habitDetail(habit.id)}
                    className={styles.primaryAction}
                    data-testid="habit-card-primary-action"
                  >
                    {copy.page.card.primaryAction}
                  </Link>
                  <div className={styles.secondaryActions}>
                    {status === "active" ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(event) => {
                            rememberOverlayTrigger(event.currentTarget);
                            setOverlay({ mode: "edit", habit });
                          }}
                          disabled={isPending}
                        >
                          {copy.page.card.edit}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void handleArchive(habit.id)}
                          disabled={isPending}
                        >
                          {copy.page.card.archive}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleRestore(habit.id)}
                        disabled={isPending}
                      >
                        {copy.page.card.restore}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <strong className={styles.metaLabel}>{copy.page.card.metaLabels.frequency}</strong>
                  {formatFrequency(habit, copy)}
                </div>
                <div>
                  <strong className={styles.metaLabel}>{copy.page.card.metaLabels.target}</strong>
                  {formatMeta(habit, copy)}
                </div>
                <div>
                  <strong className={styles.metaLabel}>{copy.page.card.metaLabels.startDate}</strong>
                  {habit.startDate}
                </div>
                <div>
                  <strong className={styles.metaLabel}>{copy.page.card.metaLabels.state}</strong>
                  {habit.isActive ? copy.page.card.state.active : copy.page.card.state.archived}
                </div>
              </div>
            </article>
          ))
        ) : (
          <StatePanel
            title={
              status === "active"
                ? copy.page.card.emptyState.activeTitle
                : copy.page.card.emptyState.archivedTitle
            }
            description={
              status === "active"
                ? copy.page.card.emptyState.activeDescription
                : copy.page.card.emptyState.archivedDescription
            }
          />
        )}
      </div>

      {overlay ? (
        <OverlayPanel
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeOverlayAndRestoreFocus();
            }
          }}
          variant="dialog"
          title={overlay.mode === "create" ? copy.page.overlay.createTitle : copy.page.overlay.editTitle(overlay.habit.name)}
          description={
            overlay.mode === "create"
              ? copy.page.overlay.createDescription
              : copy.page.overlay.editDescription
          }
          closeLabel={copy.page.overlay.closeLabel}
          testId="habit-form-overlay"
        >
          <HabitCreateForm
            key={overlay.mode === "create" ? "create" : overlay.habit.id}
            mode={overlay.mode}
            initialHabit={overlay.habit}
            submitLabel={overlay.mode === "create" ? copy.page.overlay.createSubmit : copy.page.overlay.editSubmit}
            onCancel={closeOverlayAndRestoreFocus}
            onSubmitted={async () => {
              const nextMode = overlay.mode;
              setOverlay(null);
              restoreOverlayTriggerFocus();
              if (overlay.mode === "create" && status !== "active") {
                setStatus("active");
                return;
              }

              await refreshCurrentList({
                pendingTitle:
                  nextMode === "create"
                    ? copy.page.feedback.saveCreatePendingTitle
                    : copy.page.feedback.saveEditPendingTitle,
                pendingMessage: copy.page.feedback.savePendingMessage,
                success: {
                  tone: "success",
                  title:
                    nextMode === "create"
                      ? copy.page.feedback.createSuccessTitle
                      : copy.page.feedback.editSuccessTitle,
                  message:
                    nextMode === "create"
                      ? copy.page.feedback.createSuccessMessage
                      : copy.page.feedback.editSuccessMessage,
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
