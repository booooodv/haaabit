import { describe, expect, it } from "vitest";

import { createHabitInputSchema } from "@haaabit/contracts/habits";
import { normalizeCreateHabitInput } from "../../src/modules/habits/habit.schema";

describe("createHabitInputSchema", () => {
  it("defaults the minimum daily habit to a boolean habit", () => {
    const normalized = normalizeCreateHabitInput(
      createHabitInputSchema.parse({
        name: "Walk the dog",
        frequency: {
          type: "daily",
        },
      }),
      {
        today: "2026-03-07",
      },
    );

    expect(normalized).toEqual({
      name: "Walk the dog",
      kind: "boolean",
      description: null,
      category: null,
      targetValue: null,
      unit: null,
      startDate: "2026-03-07",
      isActive: true,
      frequencyType: "daily",
      frequencyCount: null,
      weekdays: [],
    });
  });

  it("requires targetValue for quantified habits", () => {
    expect(() =>
      createHabitInputSchema.parse({
        name: "Drink water",
        kind: "quantity",
        frequency: {
          type: "daily",
        },
      }),
    ).toThrow(/targetValue/i);
  });

  it("rejects duplicate weekdays", () => {
    expect(() =>
      createHabitInputSchema.parse({
        name: "Read",
        frequency: {
          type: "weekdays",
          days: ["monday", "monday"],
        },
      }),
    ).toThrow(/unique/i);
  });

  it("rejects weekly_count values outside the supported range", () => {
    expect(() =>
      createHabitInputSchema.parse({
        name: "Workout",
        frequency: {
          type: "weekly_count",
          count: 8,
        },
      }),
    ).toThrow(/7/);
  });

  it("rejects boolean habits that try to carry quantity fields", () => {
    expect(() =>
      createHabitInputSchema.parse({
        name: "Meditate",
        kind: "boolean",
        targetValue: 10,
        unit: "minutes",
        frequency: {
          type: "monthly_count",
          count: 12,
        },
      }),
    ).toThrow(/boolean/i);
  });
});
