"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

type FormValues = {
  name: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusTarget, setFocusTarget] = useState<keyof FormValues | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    const handle = requestAnimationFrame(() => {
      getFieldRef(focusTarget, nameRef, emailRef, passwordRef)?.current?.focus();
      setFocusTarget(null);
    });

    return () => cancelAnimationFrame(handle);
  }, [focusTarget, mode, errors]);

  function updateField<Key extends keyof FormValues>(field: Key, nextValue: FormValues[Key]) {
    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setFeedback(null);
    setErrors({});
    setFocusTarget(nextMode === "sign-up" ? "name" : "email");
  }

  function validate(currentMode: Mode, currentValues: FormValues) {
    const nextErrors: FormErrors = {};
    const trimmedName = currentValues.name.trim();
    const trimmedEmail = currentValues.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Enter the email tied to this deployment.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!currentValues.password) {
      nextErrors.password = "Enter your password to continue.";
    } else if (currentMode === "sign-up" && currentValues.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (currentMode === "sign-up" && !trimmedName) {
      nextErrors.name = "Add a name for this local account.";
    }

    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
      sanitized: {
        name: trimmedName,
        email: trimmedEmail,
        password: currentValues.password,
      },
    };
  }

  async function handleSubmit() {
    const validation = validate(mode, values);

    if (!validation.isValid) {
      setErrors(validation.nextErrors);
      setFocusTarget(firstInvalidField(mode, validation.nextErrors));
      setFeedback({
        tone: "danger",
        title: "Check these details",
        message: "Fix the highlighted fields and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setFeedback({
      tone: "neutral",
      title: mode === "sign-up" ? "Creating your account" : "Signing you in",
      message: "This form stays locked until the current request finishes.",
    });

    try {
      if (mode === "sign-up") {
        await signUp(validation.sanitized);
        router.push(routes.newHabit);
        router.refresh();
        return;
      }

      await signIn({
        email: validation.sanitized.email,
        password: validation.sanitized.password,
      });
      const habits = await listHabits();
      router.push(habits.length === 0 ? routes.newHabit : routes.dashboard);
      router.refresh();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to continue";

      if (mode === "sign-in" && message.toLowerCase().includes("invalid email or password")) {
        setErrors({
          password: "Check your email and password, then try again.",
        });
        setFocusTarget("password");
      }

      setFeedback({
        tone: "danger",
        title: "Unable to continue",
        message,
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
      <div className={styles.modeBlock}>
        <p className={styles.modeEyebrow}>
          {mode === "sign-up" ? "Create a local account" : "Private account access"}
        </p>
        <p className={styles.modeDescription}>
          {mode === "sign-up"
            ? "This account lives on the deployment you control, so you can sign in later without leaving your self-hosted workflow."
            : "Use the account already stored on this deployment. Your details stay in place if you need to correct them."}
        </p>
      </div>

      <div className={styles.fields}>
        {mode === "sign-up" ? (
          <Field
            label="Name"
            htmlFor="auth-name"
            description="Use a name you will recognize when you come back to this deployment."
            error={errors.name}
            required
          >
            <Input
              ref={nameRef}
              id="auth-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              disabled={isSubmitting}
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={errors.name ? true : undefined}
            />
          </Field>
        ) : null}

        <Field
          label="Email"
          htmlFor="auth-email"
          description="Use the email you want tied to this self-hosted account."
          error={errors.email}
          required
        >
          <Input
            ref={emailRef}
            id="auth-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isSubmitting}
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="auth-password"
          description={
            mode === "sign-up"
              ? "Use at least 8 characters."
              : "Use the password already stored on this deployment."
          }
          error={errors.password}
          required
        >
          <Input
            ref={passwordRef}
            id="auth-password"
            name="password"
            type="password"
            minLength={8}
            required
            disabled={isSubmitting}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            aria-invalid={errors.password ? true : undefined}
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
            <Button type="button" variant="ghost" onClick={() => switchMode("sign-in")} disabled={isSubmitting}>
              Back to sign in
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => switchMode("sign-up")} disabled={isSubmitting}>
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

function firstInvalidField(mode: Mode, errors: FormErrors) {
  const order: Array<keyof FormValues> =
    mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];

  return order.find((field) => errors[field]) ?? order[0];
}

function getFieldRef(
  field: keyof FormValues,
  nameRef: React.RefObject<HTMLInputElement | null>,
  emailRef: React.RefObject<HTMLInputElement | null>,
  passwordRef: React.RefObject<HTMLInputElement | null>,
) {
  switch (field) {
    case "name":
      return nameRef;
    case "email":
      return emailRef;
    case "password":
      return passwordRef;
  }
}
