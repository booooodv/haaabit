"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Field, Input, Notice } from "../ui";
import { listHabits, signIn, signUp } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";
import styles from "./auth-form.module.css";

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

  const submitLabel =
    mode === "sign-up"
      ? isPending
        ? "Creating account..."
        : "Create account"
      : isPending
        ? "Signing in..."
        : "Sign in";

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.fields}>
        {mode === "sign-up" ? (
          <Field label="Name" htmlFor="auth-name" required>
            <Input id="auth-name" name="name" type="text" required autoComplete="name" />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="auth-email" required>
          <Input id="auth-email" name="email" type="email" required autoComplete="email" />
        </Field>

        <Field
          label="Password"
          htmlFor="auth-password"
          description={mode === "sign-up" ? "Use at least 8 characters." : undefined}
          required
        >
          <Input
            id="auth-password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          />
        </Field>
      </div>

      {error ? (
        <Notice tone="danger" title="Unable to continue">
          {error}
        </Notice>
      ) : null}

      <div className={styles.actions}>
        <div className={styles.switcher}>
          <span className={styles.switchLabel}>
            {mode === "sign-up" ? "Already have an account?" : "Need a new account?"}
          </span>
          {mode === "sign-up" ? (
            <Button type="button" variant="ghost" onClick={() => setMode("sign-in")}>
              Back to sign in
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setMode("sign-up")}>
              Create account
            </Button>
          )}
        </div>

        <Button type="submit" disabled={isPending} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
