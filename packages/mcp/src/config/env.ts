export type RuntimeConfig = {
  apiUrl: string;
  apiToken: string;
  timeoutMs: number;
};

export type BootstrapConfig = {
  apiUrl: string;
  email: string;
  password?: string;
  force: boolean;
};

export type ConfigInput = {
  env: NodeJS.ProcessEnv;
  argv: string[];
};

const DEFAULT_TIMEOUT_MS = 10_000;
const BOOTSTRAP_COMMAND = "bootstrap-token";

export function parseConfig(input: ConfigInput): RuntimeConfig {
  const args = parseArgs(input.argv);
  const apiUrl = args.apiUrl ?? input.env.HAAABIT_API_URL;
  const apiToken = input.env.HAAABIT_API_TOKEN;
  const missing = [
    apiUrl ? null : "HAAABIT_API_URL",
    apiToken ? null : "HAAABIT_API_TOKEN",
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new Error(buildMissingRuntimeMessage(missing, input.env));
  }

  const timeoutMs = parseTimeout(args.timeout);

  if (apiUrl === undefined || apiToken === undefined) {
    throw new Error(buildMissingRuntimeMessage(["HAAABIT_API_URL", "HAAABIT_API_TOKEN"], input.env));
  }

  return {
    apiUrl,
    apiToken,
    timeoutMs,
  };
}

export function parseBootstrapConfig(input: ConfigInput): BootstrapConfig {
  const args = parseBootstrapArgs(input.argv);
  const apiUrl = args.apiUrl ?? input.env.HAAABIT_API_URL;
  const email = args.email ?? input.env.HAAABIT_BOOTSTRAP_EMAIL;
  const password = args.password ?? input.env.HAAABIT_BOOTSTRAP_PASSWORD;
  const missing = [
    apiUrl ? null : "HAAABIT_API_URL",
    email ? null : "--email or HAAABIT_BOOTSTRAP_EMAIL",
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new Error(
      `Missing required bootstrap configuration: ${missing.join(", ")}. `
        + `Use ${BOOTSTRAP_COMMAND} to mint a personal API token from account credentials.`,
    );
  }

  return {
    apiUrl: apiUrl as string,
    email: email as string,
    password,
    force: args.force,
  };
}

export function formatStartupError(error: unknown, env: NodeJS.ProcessEnv = process.env): string {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  const formatted = redactSecrets(`Failed to start Haaabit MCP server: ${message}`, env);

  console.error(formatted);

  return formatted;
}

export function formatBootstrapError(
  error: unknown,
  options: {
    env?: NodeJS.ProcessEnv;
    secrets?: string[];
  } = {},
): string {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  const formatted = redactSecrets(`Failed to bootstrap Haaabit API token: ${message}`, options.env, options.secrets);

  console.error(formatted);

  return formatted;
}

export function redactSecrets(
  message: string,
  env: NodeJS.ProcessEnv = process.env,
  extraSecrets: string[] = [],
): string {
  const secrets = [
    env.HAAABIT_API_TOKEN,
    env.HAAABIT_BOOTSTRAP_PASSWORD,
    ...extraSecrets,
  ].filter((value): value is string => Boolean(value && value.length > 0));

  let sanitized = message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/token\s+\S+/gi, "token [REDACTED]")
    .replace(/password\s+\S+/gi, "password [REDACTED]")
    .replace(/cookie\s+\S+/gi, "cookie [REDACTED]")
    .replace(/session=[^;\s]+/gi, "session=[REDACTED]");

  for (const secret of secrets) {
    sanitized = sanitized.split(secret).join("[REDACTED]");
  }

  return sanitized;
}

function parseArgs(argv: string[]) {
  const result: {
    apiUrl?: string;
    timeout?: string;
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--api-url" && next) {
      result.apiUrl = next;
      index += 1;
      continue;
    }

    if (arg === "--timeout" && next) {
      result.timeout = next;
      index += 1;
    }
  }

  return result;
}

function parseBootstrapArgs(argv: string[]) {
  const result: {
    apiUrl?: string;
    email?: string;
    password?: string;
    force: boolean;
  } = {
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--api-url" && next) {
      result.apiUrl = next;
      index += 1;
      continue;
    }

    if (arg === "--email" && next) {
      result.email = next;
      index += 1;
      continue;
    }

    if (arg === "--password" && next) {
      result.password = next;
      index += 1;
      continue;
    }

    if (arg === "--force") {
      result.force = true;
    }
  }

  return result;
}

function buildMissingRuntimeMessage(missing: string[], env: NodeJS.ProcessEnv) {
  const details = [`Missing required configuration: ${missing.join(", ")}.`];

  if (missing.includes("HAAABIT_API_TOKEN")) {
    details.push("The normal Haaabit MCP server expects a personal API token in HAAABIT_API_TOKEN.");
    details.push(
      `If you only have account credentials, run \`${BOOTSTRAP_COMMAND}\` first and store the returned token as HAAABIT_API_TOKEN.`,
    );
    details.push("OpenClaw secret refs and apiKey mappings still need to resolve to HAAABIT_API_TOKEN.");
  }

  const tokenHint = detectTokenShapeHint(env.HAAABIT_API_TOKEN);
  if (tokenHint) {
    details.push(tokenHint);
  }

  return details.join(" ");
}

function detectTokenShapeHint(token: string | undefined) {
  if (!token) {
    return undefined;
  }

  if (token.includes("@")) {
    return "HAAABIT_API_TOKEN looks more like an email address than a Haaabit personal API token.";
  }

  if (/^https?:\/\//i.test(token)) {
    return "HAAABIT_API_TOKEN looks more like a URL than a Haaabit personal API token.";
  }

  return undefined;
}

function parseTimeout(value?: string): number {
  if (value === undefined) {
    return DEFAULT_TIMEOUT_MS;
  }

  const timeoutMs = Number(value);

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid --timeout value: ${value}`);
  }

  return timeoutMs;
}
