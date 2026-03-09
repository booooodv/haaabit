export type RuntimeConfig = {
  apiUrl: string;
  apiToken: string;
  timeoutMs: number;
};

export type ConfigInput = {
  env: NodeJS.ProcessEnv;
  argv: string[];
};

const DEFAULT_TIMEOUT_MS = 10_000;

export function parseConfig(input: ConfigInput): RuntimeConfig {
  const args = parseArgs(input.argv);
  const apiUrl = args.apiUrl ?? input.env.HAAABIT_API_URL;
  const apiToken = input.env.HAAABIT_API_TOKEN;
  const missing = [
    apiUrl ? null : "HAAABIT_API_URL",
    apiToken ? null : "HAAABIT_API_TOKEN",
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }

  const timeoutMs = parseTimeout(args.timeout);

  if (apiUrl === undefined || apiToken === undefined) {
    throw new Error("Missing required configuration");
  }

  return {
    apiUrl,
    apiToken,
    timeoutMs,
  };
}

export function formatStartupError(error: unknown, _env: NodeJS.ProcessEnv = process.env): string {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  const formatted = `Failed to start Haaabit MCP server: ${message}`;

  console.error(formatted);

  return formatted;
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
