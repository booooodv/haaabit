import type { NativePluginConfig } from "../types.js";
import { createConfigError } from "../errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const WRAPPED_ENV_VALUE_KEYS = ["value", "currentValue", "resolved", "raw"] as const;

export function parsePluginEnv(input: unknown = process.env): NativePluginConfig {
  const env = flattenPluginEnv(input);
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

export function resolvePluginRuntimeEnv(
  api: unknown,
  options: unknown,
  fallbackEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return flattenPluginEnv(options, api, fallbackEnv);
}

export function flattenPluginEnv(...sources: unknown[]): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const source of sources) {
    for (const candidate of extractEnvCandidates(source)) {
      mergeEnvCandidate(env, candidate);
    }
  }

  return env;
}

function extractEnvCandidates(source: unknown) {
  if (!isRecord(source)) {
    return [];
  }

  const candidates: unknown[] = [];
  const directEnv = source.env;
  const configEnv = isRecord(source.config) ? source.config.env : undefined;

  if (directEnv !== undefined) {
    candidates.push(directEnv);
  }

  if (configEnv !== undefined) {
    candidates.push(configEnv);
  }

  candidates.push(source);

  return candidates;
}

function mergeEnvCandidate(target: NodeJS.ProcessEnv, candidate: unknown) {
  if (!isRecord(candidate)) {
    return;
  }

  for (const [key, value] of Object.entries(candidate)) {
    if (!ENV_KEY_PATTERN.test(key) || target[key] !== undefined) {
      continue;
    }

    const normalizedValue = normalizePluginEnvValue(value);

    if (normalizedValue !== undefined) {
      target[key] = normalizedValue;
    }
  }
}

function normalizePluginEnvValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isRecord(value)) {
    for (const key of WRAPPED_ENV_VALUE_KEYS) {
      const wrappedValue = value[key];

      if (wrappedValue !== undefined) {
        const normalizedValue = normalizePluginEnvValue(wrappedValue);

        if (normalizedValue !== undefined) {
          return normalizedValue;
        }
      }
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
