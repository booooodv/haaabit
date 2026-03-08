"use client";

import type { HabitDetail } from "@haaabit/contracts/habits";
import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import {
  archiveHabit,
  listHabits,
  restoreHabit,
  type HabitRecord,
} from "../../lib/auth-client";
import { routes } from "../../lib/navigation";
import { Badge, Button, Field, Input, Notice, OverlayPanel, PageFrame, PageHeader, Select, Surface } from "../ui";
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const deferredCategory = useDeferredValue(category);

  async function loadHabits(nextStatus: HabitStatus, nextQuery: string, nextCategory: string, nextKind: HabitKindFilter) {
    const nextItems = await listHabits({
      status: nextStatus,
      query: nextQuery.trim() || undefined,
      category: nextCategory.trim() || undefined,
      kind: nextKind === "all" ? undefined : nextKind,
    });

    setItems(nextItems);
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        setError(null);
        await loadHabits(status, deferredQuery, deferredCategory, kind);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load habits");
      }
    });
  }, [deferredCategory, deferredQuery, kind, status]);

  function refreshCurrentList() {
    startTransition(async () => {
      try {
        setError(null);
        await loadHabits(status, deferredQuery, deferredCategory, kind);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to refresh habits");
      }
    });
  }

  function handleArchive(habitId: string) {
    startTransition(async () => {
      try {
        setError(null);
        await archiveHabit(habitId);
        await loadHabits(status, deferredQuery, deferredCategory, kind);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to archive habit");
      }
    });
  }

  function handleRestore(habitId: string) {
    startTransition(async () => {
      try {
        setError(null);
        await restoreHabit(habitId);
        await loadHabits(status, deferredQuery, deferredCategory, kind);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to restore habit");
      }
    });
  }

  return (
    <div className={styles.stack}>
      <Surface variant="hero">
        <PageFrame>
          <PageHeader
            eyebrow="Maintenance surface"
            title="Habits"
            description="Search, edit, archive, and restore habits without touching historical records."
            actions={
              <Button type="button" onClick={() => setOverlay({ mode: "create", habit: null })} size="lg">
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
              />
            </Field>

            <Field label="Category" htmlFor="habit-category-filter">
              <Input
                id="habit-category-filter"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Filter by category"
              />
            </Field>

            <Field label="Kind" htmlFor="habit-kind-filter">
              <Select id="habit-kind-filter" value={kind} onChange={(event) => setKind(event.target.value as HabitKindFilter)}>
                <option value="all">All kinds</option>
                <option value="boolean">Boolean</option>
                <option value="quantity">Quantity</option>
              </Select>
            </Field>
          </div>

          {error ? (
            <Notice tone="danger" title="Unable to update habits">
              {error}
            </Notice>
          ) : isPending ? (
            <p className={styles.statusText}>Updating habits...</p>
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
                      <Button type="button" variant="secondary" onClick={() => setOverlay({ mode: "edit", habit })}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => handleArchive(habit.id)}>
                        Archive
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => handleRestore(habit.id)}>
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
          <Surface variant="soft" padding="md">
            <p className={styles.emptyState}>
              {status === "active"
                ? "No active habits match the current filters."
                : "No archived habits match the current filters."}
            </p>
          </Surface>
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
              setOverlay(null);
              if (overlay.mode === "create" && status !== "active") {
                setStatus("active");
                return;
              }

              refreshCurrentList();
            }}
          />
        </OverlayPanel>
      ) : null}

      {initialDetail ? <HabitDetailDrawer detail={initialDetail} closeHref={closeDetailHref} /> : null}
    </div>
  );
}
