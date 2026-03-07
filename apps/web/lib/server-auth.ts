import type { HabitListFilters, Weekday } from "@haaabit/contracts/habits";
import type { TodaySummary } from "@haaabit/contracts/today";
import "server-only";

import { cookies } from "next/headers";

import { createApiUrl } from "./api";

type SessionPayload = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

type HabitPayload = {
  id: string;
  userId: string;
  name: string;
  kind: "boolean" | "quantity";
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

type TodaySummaryPayload = {
  summary: TodaySummary;
};

function buildHabitListPath(filters?: Partial<HabitListFilters>) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.query) {
    params.set("query", filters.query);
  }

  if (filters?.category) {
    params.set("category", filters.category);
  }

  if (filters?.kind) {
    params.set("kind", filters.kind);
  }

  const query = params.toString();
  return query.length > 0 ? `/api/habits?${query}` : "/api/habits";
}

export async function buildCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");
}

export async function getSessionFromCookieHeader(cookieHeader: string): Promise<SessionPayload | null> {
  const response = await fetch(createApiUrl("/api/session"), {
    headers: cookieHeader.length > 0 ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to validate session");
  }

  return (await response.json()) as SessionPayload;
}

export async function listHabitsFromCookieHeader(
  cookieHeader: string,
  filters?: Partial<HabitListFilters>,
): Promise<HabitPayload[]> {
  const response = await fetch(createApiUrl(buildHabitListPath(filters)), {
    headers: cookieHeader.length > 0 ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Unable to load habits");
  }

  const body = (await response.json()) as { items: HabitPayload[] };
  return body.items;
}

export async function getTodaySummaryFromCookieHeader(cookieHeader: string): Promise<TodaySummary> {
  const response = await fetch(createApiUrl("/api/today"), {
    headers: cookieHeader.length > 0 ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load today summary");
  }

  const body = (await response.json()) as TodaySummaryPayload;
  return body.summary;
}
