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
import { HabitCreateForm } from "./habit-create-form";
import { HabitDetailDrawer } from "./habit-detail-drawer";

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
          background: "linear-gradient(135deg, #f7f0e6 0%, #efe2ce 100%)",
          border: "1px solid #d9c5aa",
          boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <p style={{ margin: 0, color: "#7a5b33", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
              Maintenance surface
            </p>
            <h1 style={{ margin: 0, fontSize: "2.1rem" }}>Habits</h1>
            <p style={{ margin: 0, color: "#5f4e3e" }}>
              Search, edit, archive, and restore habits without touching historical records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOverlay({ mode: "create", habit: null })}
            style={{
              border: "none",
              borderRadius: "999px",
              background: "#173d35",
              color: "#f7f3e8",
              padding: "0.9rem 1.25rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            New habit
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {(["active", "archived"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              style={{
                borderRadius: "999px",
                border: option === status ? "1px solid #173d35" : "1px solid #cfbea8",
                background: option === status ? "#173d35" : "#fff7eb",
                color: option === status ? "#f7f3e8" : "#5d4e40",
                padding: "0.6rem 1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {option === "active" ? "Active" : "Archived"}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          }}
        >
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Search
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or category"
            />
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Category
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Filter by category"
            />
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Kind
            <select value={kind} onChange={(event) => setKind(event.target.value as HabitKindFilter)}>
              <option value="all">All kinds</option>
              <option value="boolean">Boolean</option>
              <option value="quantity">Quantity</option>
            </select>
          </label>
        </div>

        {error ? (
          <p style={{ margin: 0, color: "#9b2d30" }}>{error}</p>
        ) : isPending ? (
          <p style={{ margin: 0, color: "#6a5c4e" }}>Updating habits…</p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {items.length > 0 ? (
          items.map((habit) => (
            <article
              key={habit.id}
              style={{
                display: "grid",
                gap: "0.9rem",
                padding: "1.35rem",
                borderRadius: "1.35rem",
                background: "#fffdf8",
                border: "1px solid #d8d0c4",
                boxShadow: "0 16px 40px rgba(40, 28, 15, 0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: "0.3rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{habit.name}</h2>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        background: "#efe6d6",
                        color: "#5b4c3e",
                        fontSize: "0.85rem",
                      }}
                    >
                      {habit.kind}
                    </span>
                    {habit.category ? (
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          background: "#e3efe8",
                          color: "#214f43",
                          fontSize: "0.85rem",
                        }}
                      >
                        {habit.category}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: 0, color: "#5f5143" }}>{habit.description ?? "No description yet."}</p>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "start" }}>
                  {status === "active" ? (
                    <>
                      <Link href={routes.habitDetail(habit.id)}>View details</Link>
                      <button type="button" onClick={() => setOverlay({ mode: "edit", habit })}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleArchive(habit.id)}>
                        Archive
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={routes.habitDetail(habit.id)}>View details</Link>
                      <button type="button" onClick={() => handleRestore(habit.id)}>
                        Restore
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
                  color: "#6b5e50",
                }}
              >
                <div>
                  <strong style={{ display: "block", color: "#30251a" }}>Frequency</strong>
                  {formatFrequency(habit)}
                </div>
                <div>
                  <strong style={{ display: "block", color: "#30251a" }}>Target</strong>
                  {formatMeta(habit)}
                </div>
                <div>
                  <strong style={{ display: "block", color: "#30251a" }}>Start date</strong>
                  {habit.startDate}
                </div>
                <div>
                  <strong style={{ display: "block", color: "#30251a" }}>State</strong>
                  {habit.isActive ? "Active" : "Archived"}
                </div>
              </div>
            </article>
          ))
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
            {status === "active"
              ? "No active habits match the current filters."
              : "No archived habits match the current filters."}
          </div>
        )}
      </div>

      {overlay ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 18, 14, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: "min(42rem, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fffdf8",
              borderRadius: "1.6rem",
              border: "1px solid #d8d0c4",
              boxShadow: "0 30px 80px rgba(30, 22, 14, 0.22)",
              padding: "1.5rem",
              display: "grid",
              gap: "1rem",
            }}
          >
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <h2 style={{ margin: 0 }}>{overlay.mode === "create" ? "Create habit" : `Edit ${overlay.habit.name}`}</h2>
              <p style={{ margin: 0, color: "#6f6255" }}>
                {overlay.mode === "create"
                  ? "Add a new habit without leaving the management list."
                  : "Update future behavior only. History remains unchanged."}
              </p>
            </div>

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
          </div>
        </div>
      ) : null}

      {initialDetail ? <HabitDetailDrawer detail={initialDetail} closeHref={closeDetailHref} /> : null}
    </section>
  );
}
