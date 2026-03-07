"use client";

import { createHabitInputSchema, type Weekday } from "@haaabit/contracts/habits";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createHabit } from "../../lib/auth-client";
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

export function HabitCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const frequencyType = String(formData.get("frequencyType") ?? "daily");
      const kind = String(formData.get("kind") ?? "boolean");
      const name = String(formData.get("name") ?? "");
      const countValue = Number(formData.get("frequencyCount") ?? "0");
      const weekdays = formData.getAll("weekdays").map((value) => String(value)) as Weekday[];

      const input =
        frequencyType === "daily"
          ? {
              name,
              kind,
              frequency: { type: "daily" as const },
            }
          : frequencyType === "weekly_count"
            ? {
                name,
                kind,
                frequency: { type: "weekly_count" as const, count: countValue },
              }
            : frequencyType === "monthly_count"
              ? {
                  name,
                  kind,
                  frequency: { type: "monthly_count" as const, count: countValue },
                }
              : {
                  name,
                  kind,
                  frequency: { type: "weekdays" as const, days: weekdays },
                };

      const payload = {
        ...input,
        description: String(formData.get("description") ?? "") || undefined,
        category: String(formData.get("category") ?? "") || undefined,
        unit: String(formData.get("unit") ?? "") || undefined,
        targetValue:
          kind === "quantity" ? Number(formData.get("targetValue") ?? "0") || undefined : undefined,
      };

      try {
        const parsed = createHabitInputSchema.parse(payload);
        await createHabit(parsed);
        router.push(routes.dashboard);
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to save habit");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <label>
        Habit name
        <input name="name" type="text" required />
      </label>

      <label>
        Habit type
        <select name="kind" defaultValue="boolean">
          <option value="boolean">Boolean</option>
          <option value="quantity">Quantity</option>
        </select>
      </label>

      <label>
        Frequency
        <select name="frequencyType" defaultValue="daily">
          <option value="daily">daily</option>
          <option value="weekly_count">weekly_count</option>
          <option value="weekdays">weekdays</option>
          <option value="monthly_count">monthly_count</option>
        </select>
      </label>

      <label>
        Count target
        <input name="frequencyCount" type="number" min={1} defaultValue={1} />
      </label>

      <fieldset>
        <legend>Weekdays</legend>
        {weekdayOptions.map((weekday) => (
          <label key={weekday.value}>
            <input name="weekdays" type="checkbox" value={weekday.value} />
            {weekday.label}
          </label>
        ))}
      </fieldset>

      <label>
        Description
        <input name="description" type="text" />
      </label>

      <label>
        Category
        <input name="category" type="text" />
      </label>

      <label>
        Target value
        <input name="targetValue" type="number" min={1} />
      </label>

      <label>
        Unit
        <input name="unit" type="text" />
      </label>

      {error ? <p>{error}</p> : null}

      <button type="submit" disabled={isPending}>
        Save habit
      </button>
    </form>
  );
}
