import {
  type CreateHabitInput,
  type HabitListFilters,
  type HabitKind,
  type UpdateHabitInput,
  type Weekday,
  createHabitInputSchema,
  habitListFiltersSchema,
  updateHabitInputSchema,
} from "@haaabit/contracts/habits";

export type NormalizedCreateHabitInput = {
  name: string;
  kind: HabitKind;
  description: string | null;
  category: string | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  isActive: boolean;
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
  frequencyCount: number | null;
  weekdays: Weekday[];
};

type NormalizeCreateHabitOptions = {
  today: string;
};

export function parseCreateHabitInput(input: unknown): CreateHabitInput {
  return createHabitInputSchema.parse(input);
}

export function parseHabitListFilters(input: unknown): HabitListFilters {
  return habitListFiltersSchema.parse(input ?? {});
}

export function parseUpdateHabitInput(input: unknown): UpdateHabitInput {
  return updateHabitInputSchema.parse(input);
}

export function normalizeCreateHabitInput(
  input: CreateHabitInput,
  options: NormalizeCreateHabitOptions,
): NormalizedCreateHabitInput {
  const base = {
    name: input.name,
    kind: input.kind,
    description: input.description ?? null,
    category: input.category ?? null,
    targetValue: input.targetValue ?? null,
    unit: input.unit ?? null,
    startDate: input.startDate ?? options.today,
    isActive: input.isActive ?? true,
  };

  switch (input.frequency.type) {
    case "daily":
      return {
        ...base,
        frequencyType: "daily",
        frequencyCount: null,
        weekdays: [],
      };
    case "weekly_count":
      return {
        ...base,
        frequencyType: "weekly_count",
        frequencyCount: input.frequency.count,
        weekdays: [],
      };
    case "weekdays":
      return {
        ...base,
        frequencyType: "weekdays",
        frequencyCount: null,
        weekdays: [...input.frequency.days],
      };
    case "monthly_count":
      return {
        ...base,
        frequencyType: "monthly_count",
        frequencyCount: input.frequency.count,
        weekdays: [],
      };
    default:
      throw new Error("Unsupported frequency type");
  }
}
