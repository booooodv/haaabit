"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, DisabledHint, Field, InlineStatus, Input } from "../ui";
import { listHabits, signIn, signUp } from "../../lib/auth-client";
import { routes } from "../../lib/navigation";
import styles from "./auth-form.module.css";

type Mode = "sign-in" | "sign-up";
type Feedback = {
  tone: "neutral" | "danger";
  title: string;
  message: string;
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setFeedback({
      tone: "neutral",
      title: mode === "sign-up" ? "Creating your account" : "Signing you in",
      message: "This form stays locked until the current request finishes.",
    });

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
      setFeedback({
        tone: "danger",
        title: "Unable to continue",
        message: submissionError instanceof Error ? submissionError.message : "Unable to continue",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel =
    mode === "sign-up"
      ? isSubmitting
        ? "Creating account..."
        : "Create account"
      : isSubmitting
        ? "Signing in..."
        : "Sign in";

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.fields}>
        {mode === "sign-up" ? (
          <Field label="Name" htmlFor="auth-name" required>
            <Input id="auth-name" name="name" type="text" required autoComplete="name" disabled={isSubmitting} />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="auth-email" required>
          <Input
            id="auth-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isSubmitting}
          />
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
            disabled={isSubmitting}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          />
        </Field>
      </div>

      {feedback ? (
        <InlineStatus tone={feedback.tone} title={feedback.title} testId="auth-feedback">
          {feedback.message}
        </InlineStatus>
      ) : null}

      <div className={styles.actions}>
        <div className={styles.switcher}>
          <span className={styles.switchLabel}>
            {mode === "sign-up" ? "Already have an account?" : "Need a new account?"}
          </span>
          {mode === "sign-up" ? (
            <Button type="button" variant="ghost" onClick={() => setMode("sign-in")} disabled={isSubmitting}>
              Back to sign in
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setMode("sign-up")} disabled={isSubmitting}>
              Create account
            </Button>
          )}
        </div>

        <div className={styles.submitCluster}>
          <Button type="submit" disabled={isSubmitting} size="lg">
            {submitLabel}
          </Button>
          {isSubmitting ? (
            <DisabledHint>The primary action will unlock as soon as this request settles.</DisabledHint>
          ) : null}
        </div>
      </div>
    </form>
  );
}
