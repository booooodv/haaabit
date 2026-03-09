import { HaaabitApiError } from "./errors.js";

export type HaaabitApiClientOptions = {
  apiUrl: string;
  apiToken: string;
  timeoutMs: number;
  fetch?: typeof fetch;
};

export class HaaabitApiClient {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HaaabitApiClientOptions) {
    this.apiUrl = options.apiUrl.replace(/\/+$/, "");
    this.apiToken = options.apiToken;
    this.timeoutMs = options.timeoutMs;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.apiUrl}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${this.apiToken}`,
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        throw new HaaabitApiError({
          status: response.status,
          code: extractErrorCode(body),
          message: extractErrorMessage(body, response.statusText),
          details: body,
        });
      }

      return body as T;
    } catch (error) {
      if (error instanceof HaaabitApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HaaabitApiError({
          status: 504,
          code: "TIMEOUT",
          message: `Request timed out after ${this.timeoutMs}ms`,
        });
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  const text = await response.text();

  return text.length > 0 ? text : null;
}

function extractErrorCode(body: unknown) {
  if (body && typeof body === "object" && "code" in body && typeof body.code === "string") {
    return body.code;
  }

  return "UNKNOWN_ERROR";
}

function extractErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }

  if (typeof body === "string" && body.length > 0) {
    return body;
  }

  return fallback || "Request failed";
}
