"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button, DisabledHint, Field, InlineStatus, Input } from "../ui";
import { listHabits, signIn, signUp } from "../../lib/auth-client";
import type { LocaleMessages } from "../../lib/i18n/messages";
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

type AuthFormCopy = LocaleMessages["auth"]["form"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_DRAFT_STORAGE_KEY = "haaabit-auth-form-draft";

export function AuthForm({ copy }: { copy: AuthFormCopy }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
  });
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusTarget, setFocusTarget] = useState<keyof FormValues | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const draft = window.sessionStorage.getItem(AUTH_DRAFT_STORAGE_KEY);

      if (!draft) {
        return;
      }

      const parsed = JSON.parse(draft) as Partial<FormValues>;
      setValues({
        name: typeof parsed.name === "string" ? parsed.name : "",
        email: typeof parsed.email === "string" ? parsed.email : "",
        password: typeof parsed.password === "string" ? parsed.password : "",
      });
    } catch {
      window.sessionStorage.removeItem(AUTH_DRAFT_STORAGE_KEY);
    } finally {
      setHasHydratedDraft(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedDraft) {
      return;
    }

    window.sessionStorage.setItem(AUTH_DRAFT_STORAGE_KEY, JSON.stringify(values));
  }, [hasHydratedDraft, values]);

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
      nextErrors.email = copy.fields.email.required;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = copy.fields.email.invalid;
    }

    if (!currentValues.password) {
      nextErrors.password = copy.fields.password.required;
    } else if (currentMode === "sign-up" && currentValues.password.length < 8) {
      nextErrors.password = copy.fields.password.short;
    }

    if (currentMode === "sign-up" && !trimmedName) {
      nextErrors.name = copy.fields.name.required;
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
        title: copy.feedback.invalidTitle,
        message: copy.feedback.invalidMessage,
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setFeedback({
      tone: "neutral",
      title: mode === "sign-up" ? copy.feedback.submitTitles.signUp : copy.feedback.submitTitles.signIn,
      message: copy.feedback.submitMessage,
    });

    try {
      if (mode === "sign-up") {
        await signUp(validation.sanitized);
        window.sessionStorage.removeItem(AUTH_DRAFT_STORAGE_KEY);
        router.push(routes.newHabit);
        router.refresh();
        return;
      }

      await signIn({
        email: validation.sanitized.email,
        password: validation.sanitized.password,
      });
      window.sessionStorage.removeItem(AUTH_DRAFT_STORAGE_KEY);
      const habits = await listHabits();
      router.push(habits.length === 0 ? routes.newHabit : routes.dashboard);
      router.refresh();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to continue";

      if (mode === "sign-in" && message.toLowerCase().includes("invalid email or password")) {
        setErrors({
          password: copy.fields.password.invalidCredentials,
        });
        setFocusTarget("password");
      }

      setFeedback({
        tone: "danger",
        title: copy.feedback.submitErrorTitle,
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel =
    mode === "sign-up"
      ? isSubmitting
        ? copy.mode.signUp.pending
        : copy.mode.signUp.submit
      : isSubmitting
        ? copy.mode.signIn.pending
        : copy.mode.signIn.submit;

  return (
    <form action={handleSubmit} className={styles.form}>
      <div className={styles.modeBlock}>
        <p className={styles.modeEyebrow}>
          {mode === "sign-up" ? copy.mode.signUp.eyebrow : copy.mode.signIn.eyebrow}
        </p>
        <p className={styles.modeDescription}>
          {mode === "sign-up"
            ? copy.mode.signUp.description
            : copy.mode.signIn.description}
        </p>
      </div>

      <div className={styles.fields}>
        {mode === "sign-up" ? (
          <Field
            label={copy.fields.name.label}
            htmlFor="auth-name"
            description={copy.fields.name.description}
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
          label={copy.fields.email.label}
          htmlFor="auth-email"
          description={copy.fields.email.description}
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
          label={copy.fields.password.label}
          htmlFor="auth-password"
          description={
            mode === "sign-up"
              ? copy.fields.password.signUpDescription
              : copy.fields.password.signInDescription
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
            {mode === "sign-up" ? copy.mode.signUp.switchLabel : copy.mode.signIn.switchLabel}
          </span>
          {mode === "sign-up" ? (
            <Button type="button" variant="ghost" onClick={() => switchMode("sign-in")} disabled={isSubmitting}>
              {copy.mode.signUp.switchAction}
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => switchMode("sign-up")} disabled={isSubmitting}>
              {copy.mode.signIn.switchAction}
            </Button>
          )}
        </div>

        <div className={styles.submitCluster}>
          <Button type="submit" disabled={isSubmitting} size="lg">
            {submitLabel}
          </Button>
          {isSubmitting ? (
            <DisabledHint>{copy.disabledHint}</DisabledHint>
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
