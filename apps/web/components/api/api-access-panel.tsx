"use client";

import type { ApiAccessTokenResponse } from "@haaabit/contracts/api";
import { useState } from "react";

import { getApiAccessToken, resetApiAccessToken } from "../../lib/auth-client";
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
}: {
  initialTokenState: ApiAccessTokenResponse;
}) {
  const { locale } = useLocale();
  const copy = getApiAccessCopy(locale);
  const [tokenState, setTokenState] = useState(initialTokenState);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isTokenRevealed, setIsTokenRevealed] = useState(false);

  const tokenValue =
    tokenState.token == null ? "" : isTokenRevealed ? tokenState.token : "••••••••••••••••••••••••";

  async function refreshToken(generateNew: boolean, trigger?: HTMLButtonElement | null) {
    setFeedback({
      tone: "neutral",
      title: generateNew ? copy.feedback.rotatePendingTitle(Boolean(tokenState.token)) : copy.feedback.refreshPendingTitle,
      message: copy.feedback.pendingMessage,
    });
    setIsPending(true);

    try {
      const nextState = generateNew ? await resetApiAccessToken() : await getApiAccessToken();
      setTokenState(nextState);
      setIsTokenRevealed(false);
      setFeedback({
        tone: "success",
        title: generateNew ? copy.feedback.rotateSuccessTitle(Boolean(tokenState.token)) : copy.feedback.rotateSuccessTitle(Boolean(tokenState.token)),
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
              description={copy.page.tokenDescription}
            >
              <Input id="api-access-token" aria-label={copy.page.tokenLabel} readOnly value={tokenValue} />
            </Field>

            {tokenState.token ? (
              <div className={styles.guidance}>
                <p className={styles.guidanceTitle}>{copy.page.guidanceTitle}</p>
                {copy.page.guidanceLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
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
                onClick={(event) => void refreshToken(true, event.currentTarget)}
                disabled={isPending}
              >
                {tokenState.token ? copy.page.actions.rotate : copy.page.actions.generate}
              </Button>
              {tokenState.token ? (
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
                    disabled={isPending || !isTokenRevealed}
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
        </PageFrame>
      </Surface>
    </section>
  );
}
