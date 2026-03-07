import type { CreateHabitInput } from "@haaabit/contracts/habits";

import { createApiUrl } from "./api";

type HabitPayload = {
  id: string;
  userId: string;
  name: string;
  kind: "boolean" | "quantity";
  frequencyType: "daily" | "weekly_count" | "weekdays" | "monthly_count";
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = SignInInput & {
  name: string;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.text()) || response.statusText;
    throw new Error(body);
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
    const body = (await response.text()) || response.statusText;
    throw new Error(body);
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

export async function listHabits() {
  const body = await requestJson<{ items: HabitPayload[] }>("/api/habits", {
    method: "GET",
  });

  return body.items;
}

export async function createHabit(input: CreateHabitInput) {
  const body = await requestJson<{ item: HabitPayload }>("/api/habits", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return body.item;
}
