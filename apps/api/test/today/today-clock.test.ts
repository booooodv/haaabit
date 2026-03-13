import { describe, expect, it } from "vitest";

import { resolveHabitDay } from "../../src/modules/today/today-clock";

describe("resolveHabitDay", () => {
  it("uses the user's local 04:00 cutoff instead of UTC midnight", () => {
    const beforeCutoff = resolveHabitDay({
      timestamp: "2026-03-07T19:59:59.000Z",
      timeZone: "Asia/Shanghai",
    });
    const afterCutoff = resolveHabitDay({
      timestamp: "2026-03-07T20:00:00.000Z",
      timeZone: "Asia/Shanghai",
    });

    expect(beforeCutoff.todayKey).toBe("2026-03-07");
    expect(afterCutoff.todayKey).toBe("2026-03-08");
  });

  it("derives reusable week and month boundaries from the effective habit day", () => {
    const habitDay = resolveHabitDay({
      timestamp: "2026-03-07T12:00:00.000Z",
      timeZone: "UTC",
    });

    expect(habitDay).toMatchObject({
      todayKey: "2026-03-07",
      weekKey: "2026-W10",
      weekStartKey: "2026-03-02",
      weekEndKey: "2026-03-08",
      monthKey: "2026-03",
      monthStartKey: "2026-03-01",
      monthEndKey: "2026-03-31",
      weekday: "saturday",
    });
  });

  it("answers the same UTC instant differently for UTC and Asia/Shanghai around the cutoff", () => {
    const utc = resolveHabitDay({
      timestamp: "2026-03-07T20:30:00.000Z",
      timeZone: "UTC",
    });
    const shanghai = resolveHabitDay({
      timestamp: "2026-03-07T20:30:00.000Z",
      timeZone: "Asia/Shanghai",
    });

    expect(utc.todayKey).toBe("2026-03-07");
    expect(shanghai.todayKey).toBe("2026-03-08");
  });

  it("keeps the same instant on the same effective day before the Shanghai cutoff", () => {
    const utc = resolveHabitDay({
      timestamp: "2026-03-07T10:30:00.000Z",
      timeZone: "UTC",
    });
    const shanghai = resolveHabitDay({
      timestamp: "2026-03-07T10:30:00.000Z",
      timeZone: "Asia/Shanghai",
    });

    expect(utc.todayKey).toBe("2026-03-07");
    expect(shanghai.todayKey).toBe("2026-03-07");
  });
});
