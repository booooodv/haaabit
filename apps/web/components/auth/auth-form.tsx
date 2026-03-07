"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { listHabits, signIn, signUp } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const name = String(formData.get("name") ?? "");

      try {
        if (mode === "sign-up") {
          await signUp({ email, password, name });
          router.push(routes.newHabit);
          router.refresh();
          return;
        }

        await signIn({ email, password });
        const habits = await listHabits();
        router.push(habits.length === 0 ? routes.newHabit : routes.dashboard);
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to continue");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {mode === "sign-up" ? (
        <label>
          Name
          <input name="name" type="text" required />
        </label>
      ) : null}

      <label>
        Email
        <input name="email" type="email" required />
      </label>

      <label>
        Password
        <input name="password" type="password" minLength={8} required />
      </label>

      {error ? <p>{error}</p> : null}

      <button type="submit" disabled={isPending}>
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </button>

      {mode === "sign-up" ? (
        <button type="button" onClick={() => setMode("sign-in")}>
          Back to sign in
        </button>
      ) : (
        <button type="button" onClick={() => setMode("sign-up")}>
          Create account
        </button>
      )}
    </form>
  );
}
