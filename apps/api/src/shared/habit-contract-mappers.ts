import type { HabitKind, Weekday } from "@haaabit/contracts/habits";

const reverseHabitKindMap = {
  BOOLEAN: "boolean",
  QUANTITY: "quantity",
} as const;

const reverseFrequencyTypeMap = {
  DAILY: "daily",
  WEEKLY_COUNT: "weekly_count",
  WEEKDAYS: "weekdays",
  MONTHLY_COUNT: "monthly_count",
} as const;

const reverseWeekdayMap = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
} as const;

type ContractFrequencyType = (typeof reverseFrequencyTypeMap)[keyof typeof reverseFrequencyTypeMap];

export function serializeContractHabitKind(kind: string): HabitKind {
  return reverseHabitKindMap[kind as keyof typeof reverseHabitKindMap] as HabitKind;
}

export function serializeContractFrequencyType(frequencyType: string): ContractFrequencyType {
  return reverseFrequencyTypeMap[
    frequencyType as keyof typeof reverseFrequencyTypeMap
  ] as ContractFrequencyType;
}

export function serializeContractWeekday(day: string): Weekday {
  return reverseWeekdayMap[day as keyof typeof reverseWeekdayMap] as Weekday;
}

export function serializeContractWeekdays(entries: Array<{ day: string }>): Weekday[] {
  return entries.map((entry) => serializeContractWeekday(entry.day));
}
