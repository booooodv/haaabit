import { describe, expect, it } from "vitest";

import {
  serializeContractFrequencyType,
  serializeContractHabitKind,
  serializeContractWeekday,
  serializeContractWeekdays,
} from "../../src/shared/habit-contract-mappers";

describe("habit contract mappers", () => {
  it("maps persisted habit enums to the shipped contract strings", () => {
    expect(serializeContractHabitKind("BOOLEAN")).toBe("boolean");
    expect(serializeContractHabitKind("QUANTITY")).toBe("quantity");

    expect(serializeContractFrequencyType("DAILY")).toBe("daily");
    expect(serializeContractFrequencyType("WEEKLY_COUNT")).toBe("weekly_count");
    expect(serializeContractFrequencyType("WEEKDAYS")).toBe("weekdays");
    expect(serializeContractFrequencyType("MONTHLY_COUNT")).toBe("monthly_count");
  });

  it("maps persisted weekday rows to the shipped lowercase weekday strings", () => {
    expect(serializeContractWeekday("MONDAY")).toBe("monday");
    expect(serializeContractWeekday("SUNDAY")).toBe("sunday");
    expect(serializeContractWeekdays([{ day: "WEDNESDAY" }, { day: "FRIDAY" }])).toEqual([
      "wednesday",
      "friday",
    ]);
  });
});
