"use client";

import type { ApiAccessTokenResponse } from "@haaabit/contracts/api";
import { useState } from "react";

import {
  getAdminRegistrationSettings,
  getApiAccessToken,
  resetApiAccessToken,
  updateAdminRegistrationSettings,
} from "../../lib/auth-client";
import { createApiUrl } from "../../lib/api";
import { getApiAccessCopy } from "../../lib/i18n/api-access";
import {
  Button,
  DisabledHint,
  Field,
  InlineStatus,
  Input,
  PageFrame,
  PageHeader,
  StatePanel,
  Surface,
} from "../ui";
import { useLocale } from "../locale";
import styles from "./api-access-panel.module.css";

type Feedback = {
  tone: "neutral" | "success" | "danger";
  title: string;
  message: string;
};

function fallbackCopyText(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy is unavailable in this browser context.");
  }
}

export function ApiAccessPanel({
  initialTokenState,
  initialRegistrationState = null,
}: {
  initialTokenState: ApiAccessTokenResponse;
  initialRegistrationState?: { registrationEnabled: boolean } | null;
}) {
  const { locale } = useLocale();
  const copy = getApiAccessCopy(locale);
  const [tokenState, setTokenState] = useState(initialTokenState);
  const [registrationState, setRegistrationState] = useState(initialRegistrationState);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isTokenRevealed, setIsTokenRevealed] = useState(false);
  const hasFreshToken = tokenState.token != null;
  const hasStoredToken = tokenState.hasToken;
  const tokenDescription = hasFreshToken
    ? copy.page.tokenDescriptions.fresh
    : hasStoredToken
      ? copy.page.tokenDescriptions.stored
      : copy.page.tokenDescriptions.empty;
  const formattedLastRotatedAt = formatTokenTimestamp(tokenState.lastRotatedAt);

  const tokenValue =
    !hasStoredToken
      ? ""
      : hasFreshToken
        ? isTokenRevealed
          ? tokenState.token ?? ""
          : "••••••••••••••••••••••••"
        : copy.page.storedTokenValue;

  async function refreshToken(generateNew: boolean, trigger?: HTMLButtonElement | null) {
    setFeedback({
      tone: "neutral",
      title: generateNew ? copy.feedback.rotatePendingTitle(tokenState.hasToken) : copy.feedback.refreshPendingTitle,
      message: copy.feedback.pendingMessage,
    });
    setIsPending(true);

    try {
      const nextState = generateNew ? await resetApiAccessToken() : await getApiAccessToken();
      setTokenState(nextState);
      setIsTokenRevealed(false);
      setFeedback({
        tone: "success",
        title: copy.feedback.rotateSuccessTitle(tokenState.hasToken),
        message: copy.feedback.rotateSuccessMessage,
      });
    } catch (refreshError) {
      setFeedback({
        tone: "danger",
        title: copy.feedback.updateErrorTitle,
        message: refreshError instanceof Error ? refreshError.message : copy.feedback.updateErrorTitle,
      });
    } finally {
      setIsPending(false);
      requestAnimationFrame(() => trigger?.focus());
    }
  }

  async function refreshRegistration(registrationEnabled: boolean, trigger?: HTMLButtonElement | null) {
    setFeedback({
      tone: "neutral",
      title: copy.page.registration.title,
      message: copy.feedback.pendingMessage,
    });
    setIsPending(true);

    try {
      const nextState =
        registrationState == null
          ? await getAdminRegistrationSettings()
          : await updateAdminRegistrationSettings(registrationEnabled);

      setRegistrationState(nextState);
      setFeedback({
        tone: "success",
        title: copy.page.registration.title,
        message: nextState.registrationEnabled ? copy.page.registration.enabled : copy.page.registration.disabled,
      });
    } catch (error) {
      setFeedback({
        tone: "danger",
        title: copy.feedback.updateErrorTitle,
        message: error instanceof Error ? error.message : copy.feedback.updateErrorTitle,
      });
    } finally {
      setIsPending(false);
      requestAnimationFrame(() => trigger?.focus());
    }
  }

  function handleRotateToken(trigger: HTMLButtonElement) {
    if (tokenState.hasToken && !window.confirm(copy.page.rotateConfirm)) {
      requestAnimationFrame(() => trigger.focus());
      return;
    }

    void refreshToken(true, trigger);
  }

  async function copyToken() {
    if (!tokenState.token) {
      return;
    }

    try {
      try {
        await navigator.clipboard.writeText(tokenState.token);
      } catch {
        fallbackCopyText(tokenState.token);
      }
      setFeedback({
        tone: "success",
        title: copy.feedback.copySuccessTitle,
        message: copy.feedback.copySuccessMessage,
      });
    } catch (copyError) {
      setFeedback({
        tone: "danger",
        title: copy.feedback.copyErrorTitle,
        message: copyError instanceof Error ? copyError.message : copy.feedback.copyErrorTitle,
      });
    }
  }

  return (
    <section className={styles.panel} data-testid="api-access-panel">
      <Surface variant="hero">
        <PageFrame>
          <PageHeader
            eyebrow={copy.page.eyebrow}
            title={copy.page.title}
            description={copy.page.description}
          />

          {feedback ? (
            <InlineStatus tone={feedback.tone} title={feedback.title} testId="api-access-feedback">
              {feedback.message}
            </InlineStatus>
          ) : null}

          <Surface variant="soft" className={styles.tokenSurface} padding="md">
            <Field
              label={copy.page.tokenLabel}
              htmlFor="api-access-token"
              description={tokenDescription}
            >
              <Input id="api-access-token" aria-label={copy.page.tokenLabel} readOnly value={tokenValue} />
            </Field>

            {hasFreshToken ? (
              <div className={styles.guidance}>
                <p className={styles.guidanceTitle}>{copy.page.guidanceTitle}</p>
                {copy.page.guidanceLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : hasStoredToken ? (
              <StatePanel
                title={copy.page.storedStateTitle}
                description={copy.page.storedStateDescription}
                compact
              >
                {formattedLastRotatedAt ? (
                  <p className={styles.metaRow}>
                    <span className={styles.metaLabel}>{copy.page.lastRotatedLabel}</span>
                    <span className={styles.metaValue}>{formattedLastRotatedAt}</span>
                  </p>
                ) : null}
              </StatePanel>
            ) : (
              <StatePanel
                title={copy.page.emptyStateTitle}
                description={copy.page.emptyStateDescription}
                compact
              />
            )}

            <div className={styles.actions}>
              <Button
                type="button"
                onClick={(event) => handleRotateToken(event.currentTarget)}
                disabled={isPending}
              >
                {tokenState.hasToken ? copy.page.actions.rotate : copy.page.actions.generate}
              </Button>
              {hasFreshToken ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsTokenRevealed((current) => !current)}
                    disabled={isPending}
                  >
                    {isTokenRevealed ? copy.page.actions.hide : copy.page.actions.reveal}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyToken()}
                    disabled={isPending}
                  >
                    {copy.page.actions.copy}
                  </Button>
                </>
              ) : null}
              {isPending ? (
                <DisabledHint>{copy.page.disabledHint}</DisabledHint>
              ) : null}
            </div>
          </Surface>

          <Surface variant="soft" className={styles.quickstart} padding="md">
            <div className={styles.quickstartCopy}>
              <span className={styles.kicker}>{copy.page.quickstart.eyebrow}</span>
              <h2>{copy.page.quickstart.title}</h2>
              <p>{copy.page.quickstart.description}</p>
            </div>

            <pre className={styles.codeBlock}>
              <code>{`Authorization: Bearer <your token>\nGET /api/today`}</code>
            </pre>

            <div className={styles.links}>
              <a href={createApiUrl(tokenState.docsPath)} className={styles.link}>
                {copy.page.quickstart.docsLink}
              </a>
              <a href={createApiUrl(tokenState.specPath)} className={`${styles.link} ${styles.secondaryLink}`}>
                {copy.page.quickstart.specLink}
              </a>
            </div>
          </Surface>

          {registrationState ? (
            <Surface variant="soft" className={styles.registrationSurface} padding="md">
              <div className={styles.quickstartCopy}>
                <span className={styles.kicker}>{copy.page.registration.eyebrow}</span>
                <h2>{copy.page.registration.title}</h2>
                <p>{copy.page.registration.description}</p>
              </div>

              <StatePanel
                title={
                  registrationState.registrationEnabled
                    ? copy.page.registration.enabled
                    : copy.page.registration.disabled
                }
                compact
              />

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant={registrationState.registrationEnabled ? "danger" : "secondary"}
                  onClick={(event) =>
                    void refreshRegistration(!registrationState.registrationEnabled, event.currentTarget)
                  }
                  disabled={isPending}
                >
                  {registrationState.registrationEnabled
                    ? copy.page.registration.disableAction
                    : copy.page.registration.enableAction}
                </Button>
                {isPending ? <DisabledHint>{copy.page.registration.pendingHint}</DisabledHint> : null}
              </div>
            </Surface>
          ) : null}
        </PageFrame>
      </Surface>
    </section>
  );
}

function formatTokenTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const hours = String(parsed.getUTCHours()).padStart(2, "0");
  const minutes = String(parsed.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}
