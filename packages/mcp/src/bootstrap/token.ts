import { redactSecrets } from "../config/env.js";

export type BootstrapPersonalApiTokenOptions = {
  apiUrl: string;
  email: string;
  password: string;
  force: boolean;
  fetch?: typeof fetch;
};

export type BootstrapPersonalApiTokenResult = {
  token: string;
  rotatedExistingToken: boolean;
  lastRotatedAt: string | null;
};

type TokenStatusResponse = {
  token: null;
  hasToken: boolean;
  lastRotatedAt: string | null;
};

type ResetTokenResponse = {
  token: string;
  hasToken: boolean;
  lastRotatedAt: string | null;
};

export async function bootstrapPersonalApiToken(
  options: BootstrapPersonalApiTokenOptions,
): Promise<BootstrapPersonalApiTokenResult> {
  const fetchImpl = options.fetch ?? fetch;
  const apiUrl = options.apiUrl.replace(/\/+$/, "");
  const password = options.password;

  if (password.length === 0) {
    throw new Error("Bootstrap password cannot be empty.");
  }

  const cookie = await signInAndGetSessionCookie({
    apiUrl,
    email: options.email,
    password,
    fetchImpl,
  });

  const status = await requestJson<TokenStatusResponse>({
    fetchImpl,
    url: `${apiUrl}/api-access/token`,
    init: {
      method: "GET",
      headers: {
        cookie,
      },
    },
    secrets: [password, cookie],
  });

  if (status.hasToken && !options.force) {
    const suffix = status.lastRotatedAt ? ` Last rotated at: ${status.lastRotatedAt}.` : "";
    throw new Error(
      `A personal API token already exists for this account and bootstrap-token will rotate it.${suffix} Re-run with --force to continue.`,
    );
  }

  const reset = await requestJson<ResetTokenResponse>({
    fetchImpl,
    url: `${apiUrl}/api-access/token/reset`,
    init: {
      method: "POST",
      headers: {
        cookie,
      },
    },
    secrets: [password, cookie],
  });

  return {
    token: reset.token,
    rotatedExistingToken: status.hasToken,
    lastRotatedAt: reset.lastRotatedAt,
  };
}

async function signInAndGetSessionCookie(options: {
  apiUrl: string;
  email: string;
  password: string;
  fetchImpl: typeof fetch;
}) {
  const response = await options.fetchImpl(`${options.apiUrl}/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: options.email,
      password: options.password,
    }),
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response, [options.password]));
  }

  const cookie = extractSessionCookie(response.headers);
  if (!cookie) {
    throw new Error("Sign-in succeeded but did not return a session cookie for token bootstrap.");
  }

  return cookie;
}

async function requestJson<T>(input: {
  fetchImpl: typeof fetch;
  url: string;
  init: RequestInit;
  secrets: string[];
}) {
  const response = await input.fetchImpl(input.url, input.init);

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response, input.secrets));
  }

  return response.json() as Promise<T>;
}

async function buildErrorMessage(response: Response, secrets: string[]) {
  const contentType = response.headers.get("content-type") ?? "";
  let message = response.statusText || `HTTP ${response.status}`;

  if (contentType.includes("application/json")) {
    const body = await response.json() as unknown;
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      message = body.message;
    }
  } else {
    const text = await response.text();
    if (text.length > 0) {
      message = text;
    }
  }

  return redactSecrets(message, process.env, secrets);
}

function extractSessionCookie(headers: Headers) {
  const setCookieHeader = typeof (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
    ? (headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
    : undefined;
  const values = setCookieHeader ?? [headers.get("set-cookie")].filter((value): value is string => Boolean(value));

  if (values.length === 0) {
    return null;
  }

  return values.map((value) => value.split(";", 1)[0]).join("; ");
}
