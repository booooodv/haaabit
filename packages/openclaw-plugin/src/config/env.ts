import type { NativePluginConfig } from "../types.js";
import { createConfigError } from "../errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export function parsePluginEnv(env: NodeJS.ProcessEnv = process.env): NativePluginConfig {
  const apiUrl = env.HAAABIT_API_URL?.trim();
  const apiToken = env.HAAABIT_API_TOKEN?.trim();
  const missing = [
    apiUrl ? null : "HAAABIT_API_URL",
    apiToken ? null : "HAAABIT_API_TOKEN",
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw createConfigError(
      "MISSING_PLUGIN_ENV",
      `Missing required plugin configuration: ${missing.join(", ")}.`,
      "Set both env vars before loading the native OpenClaw plugin.",
    );
  }

  if (apiUrl === undefined || apiToken === undefined) {
    throw createConfigError(
      "MISSING_PLUGIN_ENV",
      "Missing required plugin configuration: HAAABIT_API_URL, HAAABIT_API_TOKEN.",
      "Set both env vars before loading the native OpenClaw plugin.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw createConfigError(
      "INVALID_API_URL",
      "HAAABIT_API_URL must be a valid absolute URL.",
      "Use the Haaabit API base URL, for example https://habit.example.com/api.",
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw createConfigError(
      "INVALID_API_URL",
      "HAAABIT_API_URL must use http or https.",
      "Use the Haaabit API base URL, for example https://habit.example.com/api.",
    );
  }

  if (/\s/.test(apiToken)) {
    throw createConfigError(
      "INVALID_API_TOKEN",
      "HAAABIT_API_TOKEN must not contain whitespace.",
      "Use a Haaabit personal API token, not a pasted multi-part secret or password.",
    );
  }

  if (apiToken.includes("@")) {
    throw createConfigError(
      "INVALID_API_TOKEN",
      "HAAABIT_API_TOKEN looks more like an email address than a Haaabit personal API token.",
      "Use a Haaabit personal API token, not an email address or account credential.",
    );
  }

  if (/^https?:\/\//i.test(apiToken)) {
    throw createConfigError(
      "INVALID_API_TOKEN",
      "HAAABIT_API_TOKEN looks more like a URL than a Haaabit personal API token.",
      "Use a Haaabit personal API token, not a URL.",
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    apiToken,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}
