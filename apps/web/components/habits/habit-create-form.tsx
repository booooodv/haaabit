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
import { Button, CheckboxGroup, Field, Input, Notice, Select } from "../ui";
import styles from "./habit-create-form.module.css";

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

  const resolvedSubmitLabel = submitLabel ?? (mode === "edit" ? "Save changes" : "Create habit");

  return (
    <form action={handleSubmit} className={styles.form}>
      {mode === "edit" ? (
        <Notice tone="info" title="Future-only edits">
          Changes update future behavior without rewriting historical records.
        </Notice>
      ) : null}

      <div className={styles.split}>
        <Field label="Habit name" htmlFor="habit-name" required>
          <Input id="habit-name" name="name" type="text" required defaultValue={initialHabit?.name ?? ""} />
        </Field>

        <Field
          label="Habit type"
          htmlFor="habit-kind"
          description={mode === "edit" ? "Locked after creation." : "Choose whether the habit is binary or quantity-based."}
        >
          <Select
            id="habit-kind"
            name="kind"
            defaultValue={initialHabit?.kind ?? "boolean"}
            disabled={mode === "edit"}
            onChange={(event) => setKind(event.target.value as HabitRecord["kind"])}
          >
            <option value="boolean">Boolean</option>
            <option value="quantity">Quantity</option>
          </Select>
        </Field>
      </div>

      <div className={styles.split}>
        <Field label="Start date" htmlFor="habit-start-date" description="Leave blank to start today.">
          <Input id="habit-start-date" name="startDate" type="date" defaultValue={initialHabit?.startDate ?? ""} />
        </Field>

        <Field label="Frequency" htmlFor="habit-frequency" required>
          <Select
            id="habit-frequency"
            name="frequencyType"
            value={frequencyType}
            onChange={(event) => setFrequencyType(event.target.value as HabitRecord["frequencyType"])}
          >
            <option value="daily">Daily</option>
            <option value="weekly_count">Weekly count</option>
            <option value="weekdays">Selected weekdays</option>
            <option value="monthly_count">Monthly count</option>
          </Select>
        </Field>
      </div>

      {frequencyType === "weekly_count" || frequencyType === "monthly_count" ? (
        <Field
          label="Count target"
          htmlFor="habit-frequency-count"
          description={frequencyType === "weekly_count" ? "How many times per week?" : "How many times per month?"}
        >
          <Input
            id="habit-frequency-count"
            name="frequencyCount"
            type="number"
            min={1}
            defaultValue={getFrequencyCount(initialHabit)}
          />
        </Field>
      ) : null}

      {frequencyType === "weekdays" ? (
        <CheckboxGroup
          legend="Weekdays"
          name="weekdays"
          options={weekdayOptions.map((weekday) => ({
            label: weekday.label,
            value: weekday.value,
            defaultChecked: getWeekdays(initialHabit).includes(weekday.value),
          }))}
        />
      ) : null}

      <div className={styles.split}>
        <Field
          label="Description"
          htmlFor="habit-description"
          description="Optional context for you or the AI assistant."
        >
          <Input
            id="habit-description"
            name="description"
            type="text"
            defaultValue={initialHabit?.description ?? ""}
          />
        </Field>

        <Field label="Category" htmlFor="habit-category" description="Useful for grouping and search later.">
          <Input id="habit-category" name="category" type="text" defaultValue={initialHabit?.category ?? ""} />
        </Field>
      </div>

      {kind === "quantity" ? (
        <div className={styles.split}>
          <Field label="Target value" htmlFor="habit-target">
            <Input
              id="habit-target"
              name="targetValue"
              type="number"
              min={1}
              defaultValue={initialHabit?.targetValue ?? ""}
            />
          </Field>

          <Field
            label="Unit"
            htmlFor="habit-unit"
            description="Examples: pages, glasses, kilometers."
          >
            <Input id="habit-unit" name="unit" type="text" defaultValue={initialHabit?.unit ?? ""} />
          </Field>
        </div>
      ) : null}

      {error ? (
        <Notice tone="danger" title="Unable to save habit">
          {error}
        </Notice>
      ) : null}

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "Saving..." : resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
