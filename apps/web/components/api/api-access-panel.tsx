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

export function ApiAccessPanel({
  initialTokenState,
}: {
  initialTokenState: ApiAccessTokenResponse;
}) {
  const [tokenState, setTokenState] = useState(initialTokenState);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, setIsPending] = useState(false);

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
              description="Use this bearer token for AI agents, scripts, and external integrations."
            >
              <Input id="api-access-token" aria-label="Personal API token" readOnly value={tokenState.token ?? ""} />
            </Field>

            {tokenState.token ? (
              <p>Store this token securely. Rotating it will invalidate the previous value immediately.</p>
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
              {isPending ? (
                <DisabledHint>Token controls unlock after the current request settles.</DisabledHint>
              ) : null}
            </div>
          </Surface>

          <div className={styles.links}>
            <a href={createApiUrl(tokenState.docsPath)} className={styles.link}>
              Open API docs
            </a>
            <a href={createApiUrl(tokenState.specPath)} className={`${styles.link} ${styles.secondaryLink}`}>
              OpenAPI JSON
            </a>
          </div>
        </PageFrame>
      </Surface>
    </section>
  );
}
