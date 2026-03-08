import type { ApiAccessTokenResponse } from "@haaabit/contracts/api";
import type { CreateHabitInput, HabitListFilters, UpdateHabitInput, Weekday } from "@haaabit/contracts/habits";
import type { OverviewStats } from "@haaabit/contracts/stats";
import type { TodaySummary } from "@haaabit/contracts/today";

import { createApiUrl } from "./api";

export type HabitRecord = {
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

type TodaySummaryResponse = {
  summary: TodaySummary;
};

type OverviewStatsResponse = {
  overview: OverviewStats;
};

type ApiAccessTokenResponseBody = ApiAccessTokenResponse;

type TodayActionInput = {
  habitId: string;
  source?: "web" | "ai" | "system";
  note?: string | null;
};

type SetTodayTotalInput = TodayActionInput & {
  total: number;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = SignInInput & {
  name: string;
};

async function readErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return response.statusText;
  }

  try {
    const parsed = JSON.parse(text) as { message?: string };
    return parsed.message ?? text;
  } catch {
    return text;
  }
}

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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined;
  const response = await fetch(createApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(createApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function signUp(input: SignUpInput) {
  return requestJson<{ user: { id: string; email: string; name: string } }>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function signIn(input: SignInInput) {
  return requestJson<{ token?: string }>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function signOut() {
  return requestNoContent("/api/auth/sign-out", {
    method: "POST",
  });
}

export async function listHabits(filters?: Partial<HabitListFilters>) {
  const body = await requestJson<{ items: HabitRecord[] }>(buildHabitListPath(filters), {
    method: "GET",
  });

  return body.items;
}

export async function createHabit(input: CreateHabitInput) {
  const body = await requestJson<{ item: HabitRecord }>("/api/habits", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return body.item;
}

export async function updateHabit(habitId: string, input: UpdateHabitInput) {
  const body = await requestJson<{ item: HabitRecord }>(`/api/habits/${habitId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return body.item;
}

export async function archiveHabit(habitId: string) {
  const body = await requestJson<{ item: HabitRecord }>(`/api/habits/${habitId}/archive`, {
    method: "POST",
  });

  return body.item;
}

export async function restoreHabit(habitId: string) {
  const body = await requestJson<{ item: HabitRecord }>(`/api/habits/${habitId}/restore`, {
    method: "POST",
  });

  return body.item;
}

export async function getTodaySummary() {
  const body = await requestJson<TodaySummaryResponse>("/api/today", {
    method: "GET",
  });

  return body.summary;
}

export async function getOverviewStats() {
  const body = await requestJson<OverviewStatsResponse>("/api/stats/overview", {
    method: "GET",
  });

  return body.overview;
}

export async function getApiAccessToken() {
  return requestJson<ApiAccessTokenResponseBody>("/api/api-access/token", {
    method: "GET",
  });
}

export async function resetApiAccessToken() {
  return requestJson<ApiAccessTokenResponseBody>("/api/api-access/token/reset", {
    method: "POST",
  });
}

export async function completeTodayHabit(input: TodayActionInput) {
  return requestJson<TodaySummaryResponse & { affectedHabit: HabitRecord }>("/api/today/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setTodayHabitTotal(input: SetTodayTotalInput) {
  return requestJson<TodaySummaryResponse & { affectedHabit: HabitRecord }>("/api/today/set-total", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function undoTodayHabit(input: TodayActionInput) {
  return requestJson<TodaySummaryResponse & { affectedHabit: HabitRecord }>("/api/today/undo", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
