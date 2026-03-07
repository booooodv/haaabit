"use client";

import type { ApiAccessTokenResponse } from "@haaabit/contracts/api";
import { useState, useTransition } from "react";

import { getApiAccessToken, resetApiAccessToken } from "../../lib/auth-client";

export function ApiAccessPanel({
  initialTokenState,
}: {
  initialTokenState: ApiAccessTokenResponse;
}) {
  const [tokenState, setTokenState] = useState(initialTokenState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshToken(generateNew: boolean) {
    setError(null);

    startTransition(async () => {
      try {
        const nextState = generateNew ? await resetApiAccessToken() : await getApiAccessToken();
        setTokenState(nextState);
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to update api token");
      }
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "1.25rem",
        padding: "1.75rem",
        borderRadius: "1.75rem",
        background: "linear-gradient(135deg, #f6efe3 0%, #efe4d1 100%)",
        border: "1px solid #d9cbb3",
        boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
      }}
    >
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <p style={{ margin: 0, color: "#756858", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
          AI integration
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>API access</h1>
        <p style={{ margin: 0, color: "#5c5145" }}>
          Manage the personal bearer token your scripts and assistants should use when calling Haaabit.
        </p>
      </div>

      <label style={{ display: "grid", gap: "0.45rem" }}>
        Personal API token
        <input aria-label="Personal API token" readOnly value={tokenState.token ?? ""} />
      </label>

      {tokenState.token ? (
        <p style={{ margin: 0, color: "#5f5143" }}>
          Store this token securely. Rotating it will invalidate the previous value immediately.
        </p>
      ) : (
        <p style={{ margin: 0, color: "#5f5143" }}>No personal API token has been generated yet.</p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => refreshToken(true)}>
          {tokenState.token ? "Rotate token" : "Generate token"}
        </button>
        <a href={tokenState.docsPath} style={{ color: "#173d35", fontWeight: 700 }}>
          Open API docs
        </a>
      </div>

      {error ? (
        <p style={{ margin: 0, color: "#9b2d30" }}>{error}</p>
      ) : isPending ? (
        <p style={{ margin: 0, color: "#6a5c4e" }}>Updating API access…</p>
      ) : null}
    </section>
  );
}
