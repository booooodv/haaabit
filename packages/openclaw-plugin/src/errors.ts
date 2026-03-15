export type OpenClawPluginErrorCategory = "config" | "startup";

export class OpenClawPluginError extends Error {
  readonly category: OpenClawPluginErrorCategory;
  readonly code: string;
  readonly hint?: string;

  constructor(options: {
    category: OpenClawPluginErrorCategory;
    code: string;
    message: string;
    hint?: string;
  }) {
    super(options.message);
    this.name = "OpenClawPluginError";
    this.category = options.category;
    this.code = options.code;
    this.hint = options.hint;
  }
}

export function createConfigError(code: string, message: string, hint?: string) {
  return new OpenClawPluginError({
    category: "config",
    code,
    message,
    hint,
  });
}

export function formatStartupError(error: unknown, env: unknown = process.env) {
  const pluginError =
    error instanceof OpenClawPluginError
      ? error
      : new OpenClawPluginError({
          category: "startup",
          code: "UNKNOWN_STARTUP_ERROR",
          message: error instanceof Error ? error.message : "Unknown startup error",
        });

  const message = redactSecrets(pluginError.message, env);
  const hint = pluginError.hint ? redactSecrets(pluginError.hint, env) : undefined;

  return {
    ok: false,
    error: {
      category: pluginError.category,
      code: pluginError.code,
      message,
      ...(hint ? { hint } : {}),
    },
  } as const;
}

export function redactSecrets(message: string, env: unknown = process.env) {
  const token = readEnvToken(env);
  let sanitized = message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/token\s+\S+/gi, "token [REDACTED]");

  if (token) {
    sanitized = sanitized.split(token).join("[REDACTED]");
  }

  return sanitized;
}

function readEnvToken(env: unknown) {
  if (typeof env !== "object" || env === null || Array.isArray(env)) {
    return undefined;
  }

  const token = (env as Record<string, unknown>).HAAABIT_API_TOKEN;

  return typeof token === "string" ? token : undefined;
}
