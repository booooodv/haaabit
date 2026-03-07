const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type HabitWeekday = Exclude<(typeof WEEKDAY_NAMES)[number], "sunday"> | "sunday";

export type ResolveHabitDayInput = {
  timestamp: Date | number | string;
  timeZone: string;
  cutoffHour?: number;
};

export type HabitDay = {
  todayKey: string;
  weekKey: string;
  weekStartKey: string;
  weekEndKey: string;
  monthKey: string;
  monthStartKey: string;
  monthEndKey: string;
  weekday: HabitWeekday;
  cutoffHour: number;
  timeZone: string;
};

function parseTimestamp(input: ResolveHabitDayInput["timestamp"]): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp");
  }

  return date;
}

function getFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

function getLocalDateParts(date: Date, timeZone: string) {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour: Number(partMap.hour),
  };
}

function fromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number) {
  const date = fromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function compareDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function getWeekday(dateKey: string): HabitWeekday {
  return WEEKDAY_NAMES[fromDateKey(dateKey).getUTCDay()];
}

function getIsoWeekParts(dateKey: string) {
  const date = fromDateKey(dateKey);
  const dayIndex = (date.getUTCDay() + 6) % 7;
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() - dayIndex + 3);

  const weekYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const firstDayIndex = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayIndex + 3);

  const weekNumber = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000);

  return {
    weekYear,
    weekNumber,
  };
}

export function getWeekBounds(dateKey: string) {
  const date = fromDateKey(dateKey);
  const dayIndex = date.getUTCDay();
  const offsetToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  const weekStartKey = addDays(dateKey, offsetToMonday);
  const weekEndKey = addDays(weekStartKey, 6);
  const { weekYear, weekNumber } = getIsoWeekParts(dateKey);

  return {
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, "0")}`,
    weekStartKey,
    weekEndKey,
  };
}

export function getMonthBounds(dateKey: string) {
  const [year, month] = dateKey.split("-").map((value) => Number(value));
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  return {
    monthKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`,
    monthStartKey: toDateKey(monthStart),
    monthEndKey: toDateKey(monthEnd),
  };
}

export function resolveHabitDay(input: ResolveHabitDayInput): HabitDay {
  const cutoffHour = input.cutoffHour ?? 4;
  const timestamp = parseTimestamp(input.timestamp);
  const local = getLocalDateParts(timestamp, input.timeZone);
  const localDateKey = `${local.year}-${local.month}-${local.day}`;
  const todayKey = local.hour < cutoffHour ? addDays(localDateKey, -1) : localDateKey;
  const week = getWeekBounds(todayKey);
  const month = getMonthBounds(todayKey);

  return {
    todayKey,
    weekKey: week.weekKey,
    weekStartKey: week.weekStartKey,
    weekEndKey: week.weekEndKey,
    monthKey: month.monthKey,
    monthStartKey: month.monthStartKey,
    monthEndKey: month.monthEndKey,
    weekday: getWeekday(todayKey),
    cutoffHour,
    timeZone: input.timeZone,
  };
}
