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
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
};

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

export async function listHabitsFromCookieHeader(cookieHeader: string): Promise<HabitPayload[]> {
  const response = await fetch(createApiUrl("/api/habits"), {
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
