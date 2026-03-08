"use client";

import type { ApiAccessTokenResponse } from "@haaabit/contracts/api";
import { useState } from "react";

import { getApiAccessToken, resetApiAccessToken } from "../../lib/auth-client";
import { createApiUrl } from "../../lib/api";
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
  const [tokenState, setTokenState] = useState(initialTokenState);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isTokenRevealed, setIsTokenRevealed] = useState(false);

  const tokenValue =
    tokenState.token == null ? "" : isTokenRevealed ? tokenState.token : "••••••••••••••••••••••••";

  async function refreshToken(generateNew: boolean) {
    setFeedback({
      tone: "neutral",
      title: generateNew ? (tokenState.token ? "Rotating token" : "Generating token") : "Refreshing token",
      message: "Token controls stay locked until the current request finishes.",
    });
    setIsPending(true);

    try {
      const nextState = generateNew ? await resetApiAccessToken() : await getApiAccessToken();
      setTokenState(nextState);
      setIsTokenRevealed(false);
      setFeedback({
        tone: "success",
        title: generateNew ? (tokenState.token ? "Token rotated" : "Token generated") : "Token ready",
        message: "Store this bearer token now. Replacing it invalidates the previous value immediately.",
      });
    } catch (refreshError) {
      setFeedback({
        tone: "danger",
        title: "Unable to update API access",
        message: refreshError instanceof Error ? refreshError.message : "Unable to update API access",
      });
    } finally {
      setIsPending(false);
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
        title: "Token copied",
        message: "The token is in your clipboard. Paste it only into a trusted client or secret store.",
      });
    } catch (copyError) {
      setFeedback({
        tone: "danger",
        title: "Unable to copy token",
        message: copyError instanceof Error ? copyError.message : "Unable to copy token",
      });
    }
  }

  return (
    <section className={styles.panel} data-testid="api-access-panel">
      <Surface variant="hero">
        <PageFrame>
          <PageHeader
            eyebrow="AI integration"
            title="API access"
            description="Manage the personal bearer token your scripts and assistants should use when calling Haaabit."
          />

          {feedback ? (
            <InlineStatus tone={feedback.tone} title={feedback.title} testId="api-access-feedback">
              {feedback.message}
            </InlineStatus>
          ) : null}

          <Surface variant="soft" className={styles.tokenSurface} padding="md">
            <Field
              label="Personal API token"
              htmlFor="api-access-token"
              description="Hidden by default. Reveal it only when you need to copy it into a trusted client."
            >
              <Input id="api-access-token" aria-label="Personal API token" readOnly value={tokenValue} />
            </Field>

            {tokenState.token ? (
              <div className={styles.guidance}>
                <p className={styles.guidanceTitle}>Treat this token like a password.</p>
                <p>Store it in a trusted secret store or private environment file.</p>
                <p>Rotation invalidates the previous token immediately.</p>
              </div>
            ) : (
              <StatePanel
                title="No personal API token yet"
                description="No personal API token has been generated yet."
                compact
              />
            )}

            <div className={styles.actions}>
              <Button type="button" onClick={() => void refreshToken(true)} disabled={isPending}>
                {tokenState.token ? "Rotate token" : "Generate token"}
              </Button>
              {tokenState.token ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsTokenRevealed((current) => !current)}
                    disabled={isPending}
                  >
                    {isTokenRevealed ? "Hide token" : "Reveal token"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyToken()}
                    disabled={isPending || !isTokenRevealed}
                  >
                    Copy token
                  </Button>
                </>
              ) : null}
              {isPending ? (
                <DisabledHint>Token controls unlock after the current request settles.</DisabledHint>
              ) : null}
            </div>
          </Surface>

          <Surface variant="soft" className={styles.quickstart} padding="md">
            <div className={styles.quickstartCopy}>
              <span className={styles.kicker}>Quickstart</span>
              <h2>First call</h2>
              <p>Start with the bearer header, then verify the connection against today&apos;s summary endpoint.</p>
            </div>

            <pre className={styles.codeBlock}>
              <code>{`Authorization: Bearer <your token>\nGET /api/today`}</code>
            </pre>

            <div className={styles.links}>
              <a href={createApiUrl(tokenState.docsPath)} className={styles.link}>
                Open API docs
              </a>
              <a href={createApiUrl(tokenState.specPath)} className={`${styles.link} ${styles.secondaryLink}`}>
                OpenAPI JSON
              </a>
            </div>
          </Surface>
        </PageFrame>
      </Surface>
    </section>
  );
}
