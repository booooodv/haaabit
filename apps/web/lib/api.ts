const DEFAULT_INTERNAL_API_BASE_URL = "http://127.0.0.1:3001";

function joinPath(path: string, baseUrl: string) {
  return new URL(path, baseUrl).toString();
}

export function createBrowserApiUrl(path: string) {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  return publicBaseUrl ? joinPath(path, publicBaseUrl) : path;
}

export function createServerApiUrl(path: string) {
  return joinPath(path, process.env.API_INTERNAL_BASE_URL ?? process.env.API_BASE_URL ?? DEFAULT_INTERNAL_API_BASE_URL);
}

export const createApiUrl = createBrowserApiUrl;
