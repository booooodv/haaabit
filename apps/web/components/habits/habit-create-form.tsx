"use client";

import {
  createHabitInputSchema,
  updateHabitInputSchema,
  type Weekday,
} from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createHabit, updateHabit, type HabitRecord } from "../../lib/auth-client";
import { getHabitsCopy } from "../../lib/i18n/habits";
import { routes } from "../../lib/navigation";
import { useLocale } from "../locale";
import { Button, CheckboxGroup, Field, Input, Notice, Select } from "../ui";
import styles from "./habit-create-form.module.css";

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
  const { locale } = useLocale();
  const copy = getHabitsCopy(locale);
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
        setError(submissionError instanceof Error ? submissionError.message : copy.form.errorTitle);
      }
    });
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "edit" ? copy.page.overlay.editSubmit : copy.page.overlay.createSubmit);

  return (
    <form action={handleSubmit} className={styles.form}>
      {mode === "edit" ? (
        <Notice tone="info" title={copy.form.futureOnly.title}>
          {copy.form.futureOnly.description}
        </Notice>
      ) : null}

      <div className={styles.split}>
        <Field label={copy.form.fields.name} htmlFor="habit-name" required>
          <Input id="habit-name" name="name" type="text" required defaultValue={initialHabit?.name ?? ""} />
        </Field>

        <Field
          label={copy.form.fields.kind.label}
          htmlFor="habit-kind"
          description={mode === "edit" ? copy.form.fields.kind.editDescription : copy.form.fields.kind.description}
        >
          <Select
            id="habit-kind"
            name="kind"
            defaultValue={initialHabit?.kind ?? "boolean"}
            disabled={mode === "edit"}
            onChange={(event) => setKind(event.target.value as HabitRecord["kind"])}
          >
            <option value="boolean">{copy.form.fields.kind.options.boolean}</option>
            <option value="quantity">{copy.form.fields.kind.options.quantity}</option>
          </Select>
        </Field>
      </div>

      <div className={styles.split}>
        <Field
          label={copy.form.fields.startDate.label}
          htmlFor="habit-start-date"
          description={copy.form.fields.startDate.description}
        >
          <Input id="habit-start-date" name="startDate" type="date" defaultValue={initialHabit?.startDate ?? ""} />
        </Field>

        <Field label={copy.form.fields.frequency.label} htmlFor="habit-frequency" required>
          <Select
            id="habit-frequency"
            name="frequencyType"
            value={frequencyType}
            onChange={(event) => setFrequencyType(event.target.value as HabitRecord["frequencyType"])}
          >
            <option value="daily">{copy.form.fields.frequency.options.daily}</option>
            <option value="weekly_count">{copy.form.fields.frequency.options.weeklyCount}</option>
            <option value="weekdays">{copy.form.fields.frequency.options.weekdays}</option>
            <option value="monthly_count">{copy.form.fields.frequency.options.monthlyCount}</option>
          </Select>
        </Field>
      </div>

      {frequencyType === "weekly_count" || frequencyType === "monthly_count" ? (
        <Field
          label={copy.form.fields.countTarget.label}
          htmlFor="habit-frequency-count"
          description={
            frequencyType === "weekly_count"
              ? copy.form.fields.countTarget.weeklyDescription
              : copy.form.fields.countTarget.monthlyDescription
          }
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
          legend={copy.form.fields.weekdaysLegend}
          name="weekdays"
          options={copy.form.weekdays.map((weekday) => ({
            label: weekday.label,
            value: weekday.value,
            defaultChecked: getWeekdays(initialHabit).includes(weekday.value),
          }))}
        />
      ) : null}

      <div className={styles.split}>
        <Field
          label={copy.form.fields.description.label}
          htmlFor="habit-description"
          description={copy.form.fields.description.description}
        >
          <Input
            id="habit-description"
            name="description"
            type="text"
            defaultValue={initialHabit?.description ?? ""}
          />
        </Field>

        <Field
          label={copy.form.fields.category.label}
          htmlFor="habit-category"
          description={copy.form.fields.category.description}
        >
          <Input id="habit-category" name="category" type="text" defaultValue={initialHabit?.category ?? ""} />
        </Field>
      </div>

      {kind === "quantity" ? (
        <div className={styles.split}>
          <Field label={copy.form.fields.targetValue} htmlFor="habit-target">
            <Input
              id="habit-target"
              name="targetValue"
              type="number"
              min={1}
              defaultValue={initialHabit?.targetValue ?? ""}
            />
          </Field>

          <Field
            label={copy.form.fields.unit.label}
            htmlFor="habit-unit"
            description={copy.form.fields.unit.description}
          >
            <Input id="habit-unit" name="unit" type="text" defaultValue={initialHabit?.unit ?? ""} />
          </Field>
        </div>
      ) : null}

      {error ? (
        <Notice tone="danger" title={copy.form.errorTitle}>
          {error}
        </Notice>
      ) : null}

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            {copy.form.cancel}
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? copy.form.pendingSubmit : resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
