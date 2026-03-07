"use client";

import {
  createHabitInputSchema,
  updateHabitInputSchema,
  type Weekday,
} from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createHabit, updateHabit, type HabitRecord } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";

const weekdayOptions: Array<{ label: string; value: Weekday }> = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

type HabitCreateFormProps = {
  mode?: "create" | "edit";
  initialHabit?: HabitRecord | null;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmitted?: (habit: HabitRecord) => void | Promise<void>;
};

function getFrequencyType(initialHabit?: HabitRecord | null) {
  return initialHabit?.frequencyType ?? "daily";
}

function getFrequencyCount(initialHabit?: HabitRecord | null) {
  return initialHabit?.frequencyCount ?? 1;
}

function getWeekdays(initialHabit?: HabitRecord | null) {
  return initialHabit?.weekdays ?? [];
}

export function HabitCreateForm({
  mode = "create",
  initialHabit = null,
  submitLabel,
  onCancel,
  onSubmitted,
}: HabitCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [frequencyType, setFrequencyType] = useState(getFrequencyType(initialHabit));
  const [kind, setKind] = useState(initialHabit?.kind ?? "boolean");

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const currentFrequencyType = String(formData.get("frequencyType") ?? frequencyType) as HabitRecord["frequencyType"];
      const currentKind = (mode === "edit" ? initialHabit?.kind : String(formData.get("kind") ?? kind)) as HabitRecord["kind"];
      const name = String(formData.get("name") ?? "");
      const countValue = Number(formData.get("frequencyCount") ?? "0");
      const weekdays = formData.getAll("weekdays").map((value) => String(value)) as Weekday[];

      const frequency =
        currentFrequencyType === "daily"
          ? { type: "daily" as const }
          : currentFrequencyType === "weekly_count"
            ? { type: "weekly_count" as const, count: countValue }
            : currentFrequencyType === "monthly_count"
              ? { type: "monthly_count" as const, count: countValue }
              : { type: "weekdays" as const, days: weekdays };

      try {
        if (mode === "edit" && initialHabit) {
          const parsed = updateHabitInputSchema.parse({
            name,
            description: String(formData.get("description") ?? "").trim() || null,
            category: String(formData.get("category") ?? "").trim() || null,
            unit:
              currentKind === "quantity" ? String(formData.get("unit") ?? "").trim() || null : null,
            targetValue:
              currentKind === "quantity"
                ? Number(formData.get("targetValue") ?? "0") || undefined
                : undefined,
            startDate: String(formData.get("startDate") ?? ""),
            frequency,
          });
          const saved = await updateHabit(initialHabit.id, parsed);
          await onSubmitted?.(saved);
          router.refresh();
          return;
        }

        const parsed = createHabitInputSchema.parse({
          name,
          kind: currentKind,
          description: String(formData.get("description") ?? "").trim() || undefined,
          category: String(formData.get("category") ?? "").trim() || undefined,
          unit: currentKind === "quantity" ? String(formData.get("unit") ?? "").trim() || undefined : undefined,
          targetValue:
            currentKind === "quantity"
              ? Number(formData.get("targetValue") ?? "0") || undefined
              : undefined,
          startDate: String(formData.get("startDate") ?? "").trim() || undefined,
          frequency,
        });
        const saved = await createHabit(parsed);

        if (onSubmitted) {
          await onSubmitted(saved);
          router.refresh();
          return;
        }

        router.push(routes.dashboard);
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to save habit");
      }
    });
  }

  const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Save changes" : "Save habit");

  return (
    <form
      action={handleSubmit}
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-name">Habit name</label>
        <input id="habit-name" name="name" type="text" required defaultValue={initialHabit?.name ?? ""} />
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-kind">Habit type</label>
        <select
          id="habit-kind"
          name="kind"
          defaultValue={initialHabit?.kind ?? "boolean"}
          disabled={mode === "edit"}
          onChange={(event) => setKind(event.target.value as HabitRecord["kind"])}
        >
          <option value="boolean">Boolean</option>
          <option value="quantity">Quantity</option>
        </select>
        {mode === "edit" ? <span style={{ color: "#76685a", fontSize: "0.9rem" }}>Kind is locked after creation.</span> : null}
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-start-date">Start date</label>
        <input id="habit-start-date" name="startDate" type="date" defaultValue={initialHabit?.startDate ?? ""} />
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-frequency">Frequency</label>
        <select
          id="habit-frequency"
          name="frequencyType"
          value={frequencyType}
          onChange={(event) => setFrequencyType(event.target.value as HabitRecord["frequencyType"])}
        >
          <option value="daily">daily</option>
          <option value="weekly_count">weekly_count</option>
          <option value="weekdays">weekdays</option>
          <option value="monthly_count">monthly_count</option>
        </select>
      </div>

      {frequencyType === "weekly_count" || frequencyType === "monthly_count" ? (
        <div style={{ display: "grid", gap: "0.4rem" }}>
          <label htmlFor="habit-frequency-count">Count target</label>
          <input
            id="habit-frequency-count"
            name="frequencyCount"
            type="number"
            min={1}
            defaultValue={getFrequencyCount(initialHabit)}
          />
        </div>
      ) : null}

      {frequencyType === "weekdays" ? (
        <fieldset style={{ border: "1px solid #d7cdbf", borderRadius: "1rem", padding: "1rem" }}>
          <legend>Weekdays</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1rem" }}>
            {weekdayOptions.map((weekday) => (
              <label key={weekday.value} style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                <input
                  name="weekdays"
                  type="checkbox"
                  value={weekday.value}
                  defaultChecked={getWeekdays(initialHabit).includes(weekday.value)}
                />
                {weekday.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-description">Description</label>
        <input id="habit-description" name="description" type="text" defaultValue={initialHabit?.description ?? ""} />
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label htmlFor="habit-category">Category</label>
        <input id="habit-category" name="category" type="text" defaultValue={initialHabit?.category ?? ""} />
      </div>

      {kind === "quantity" ? (
        <>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label htmlFor="habit-target">Target value</label>
            <input
              id="habit-target"
              name="targetValue"
              type="number"
              min={1}
              defaultValue={initialHabit?.targetValue ?? ""}
            />
          </div>

          <div style={{ display: "grid", gap: "0.4rem" }}>
            <label htmlFor="habit-unit">Unit</label>
            <input id="habit-unit" name="unit" type="text" defaultValue={initialHabit?.unit ?? ""} />
          </div>
        </>
      ) : null}

      {error ? <p style={{ margin: 0, color: "#9b2d30" }}>{error}</p> : null}

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        {onCancel ? (
          <button type="button" onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  );
}
