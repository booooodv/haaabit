import type { NativePluginConfig } from "../types.js";
import { createConfigError } from "../errors.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const WRAPPED_ENV_VALUE_KEYS = ["value", "currentValue", "resolved", "raw"] as const;
const KNOWN_ENV_PATHS = [
  ["env"],
  ["config", "env"],
  ["runtime", "env"],
  ["settings", "env"],
  ["plugin", "env"],
  ["plugin", "config", "env"],
  ["pluginConfig", "env"],
  ["context", "env"],
  ["manifest", "env"],
] as const;
const ENV_REFERENCE_KEYS = ["id", "key", "env", "name"] as const;
const ENV_REFERENCE_SOURCES = new Set(["env", "environment", "process.env", "processenv", "process"]);

type EnvCandidateMap = Record<string, unknown>;

export function parsePluginEnv(env: NodeJS.ProcessEnv = process.env): NativePluginConfig {
  const apiUrl = readEnvString(env, "HAAABIT_API_URL")?.trim();
  const apiToken = readEnvString(env, "HAAABIT_API_TOKEN")?.trim();
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
  const fallback = toStringEnvMap(fallbackEnv);
  const candidates = [...collectEnvCandidates(options), ...collectEnvCandidates(api), fallback];
  const env: NodeJS.ProcessEnv = {};
  const context = {
    candidates,
    fallback,
  };

  for (const candidate of candidates) {
    mergeEnvCandidate(env, candidate, context);
  }

  return env;
}

function mergeEnvCandidate(
  target: NodeJS.ProcessEnv,
  candidate: EnvCandidateMap,
  context: {
    candidates: EnvCandidateMap[];
    fallback: NodeJS.ProcessEnv;
  },
) {
  for (const [key, value] of Object.entries(candidate)) {
    if (!ENV_KEY_PATTERN.test(key) || target[key] !== undefined) {
      continue;
    }

    const normalizedValue = normalizePluginEnvValue(key, value, context, new Set([key]));

    if (normalizedValue !== undefined) {
      target[key] = normalizedValue;
    }
  }
}

function collectEnvCandidates(source: unknown) {
  if (!isRecord(source)) {
    return [];
  }

  const candidates: EnvCandidateMap[] = [];
  const seenRecords = new Set<object>();
  const seenCandidates = new Set<object>();

  const addCandidate = (candidate: unknown) => {
    if (!isRecord(candidate)) {
      return;
    }

    if (!looksLikeEnvMap(candidate) || seenCandidates.has(candidate)) {
      return;
    }

    seenCandidates.add(candidate);
    candidates.push(candidate);
  };

  addCandidate(source);

  for (const path of KNOWN_ENV_PATHS) {
    addCandidate(getNestedRecord(source, path));
  }

  const queue: Array<{ value: Record<string, unknown>; depth: number }> = [{ value: source, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || seenRecords.has(current.value)) {
      continue;
    }

    seenRecords.add(current.value);

    for (const [key, value] of Object.entries(current.value)) {
      if (!isRecord(value)) {
        continue;
      }

      if (key === "env") {
        addCandidate(value);
      }

      if (current.depth < 4) {
        queue.push({
          value,
          depth: current.depth + 1,
        });
      }
    }
  }

  return candidates;
}

function normalizePluginEnvValue(
  key: string,
  value: unknown,
  context: {
    candidates: EnvCandidateMap[];
    fallback: NodeJS.ProcessEnv;
  },
  seenReferences: Set<string>,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (!isRecord(value)) {
    return;
  }

  for (const wrappedKey of WRAPPED_ENV_VALUE_KEYS) {
    const wrappedValue = value[wrappedKey];

    if (wrappedValue !== undefined) {
      const normalizedValue = normalizePluginEnvValue(key, wrappedValue, context, seenReferences);

      if (normalizedValue !== undefined) {
        return normalizedValue;
      }
    }
  }

  const referencedEnvKey = extractReferencedEnvKey(value);

  if (referencedEnvKey) {
    return resolveReferencedEnvValue(referencedEnvKey, context, seenReferences);
  }

  // Some hosts wrap the actual env map one level deeper under the same env key.
  const nestedValue = value[key];
  if (nestedValue !== undefined) {
    const normalizedValue = normalizePluginEnvValue(key, nestedValue, context, seenReferences);

    if (normalizedValue !== undefined) {
      return normalizedValue;
    }
  }

  return undefined;
}

function resolveReferencedEnvValue(
  referencedEnvKey: string,
  context: {
    candidates: EnvCandidateMap[];
    fallback: NodeJS.ProcessEnv;
  },
  seenReferences: Set<string>,
) {
  if (seenReferences.has(referencedEnvKey)) {
    return readEnvString(context.fallback, referencedEnvKey);
  }

  const nextSeenReferences = new Set(seenReferences);
  nextSeenReferences.add(referencedEnvKey);

  for (const candidate of context.candidates) {
    const candidateValue = candidate[referencedEnvKey];

    if (candidateValue === undefined) {
      continue;
    }

    if (isRecord(candidateValue) && extractReferencedEnvKey(candidateValue) === referencedEnvKey) {
      continue;
    }

    const normalizedValue = normalizePluginEnvValue(referencedEnvKey, candidateValue, context, nextSeenReferences);

    if (normalizedValue !== undefined) {
      return normalizedValue;
    }
  }

  return readEnvString(context.fallback, referencedEnvKey);
}

function extractReferencedEnvKey(value: Record<string, unknown>) {
  const source = typeof value.source === "string" ? value.source.toLowerCase() : undefined;

  if (typeof value.env === "string" && ENV_KEY_PATTERN.test(value.env)) {
    return value.env;
  }

  if (source && ENV_REFERENCE_SOURCES.has(source)) {
    for (const key of ENV_REFERENCE_KEYS) {
      const candidate = value[key];

      if (typeof candidate === "string" && ENV_KEY_PATTERN.test(candidate)) {
        return candidate;
      }
    }
  }

  if (typeof value.key === "string" && ENV_KEY_PATTERN.test(value.key)) {
    return value.key;
  }

  if (typeof value.id === "string" && ENV_KEY_PATTERN.test(value.id)) {
    return value.id;
  }

  if (
    typeof value.name === "string" &&
    ENV_KEY_PATTERN.test(value.name) &&
    Object.keys(value).every((key) => ["name", "provider", "source", "kind", "type"].includes(key))
  ) {
    return value.name;
  }

  return undefined;
}

function getNestedRecord(source: Record<string, unknown>, path: readonly string[]) {
  let current: unknown = source;

  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return isRecord(current) ? current : undefined;
}

function looksLikeEnvMap(value: Record<string, unknown>) {
  return Object.keys(value).some((key) => ENV_KEY_PATTERN.test(key));
}

function toStringEnvMap(env: NodeJS.ProcessEnv) {
  const normalized: NodeJS.ProcessEnv = {};

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }

  return normalized;
}

function readEnvString(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];

  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
