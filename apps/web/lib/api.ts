export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://127.0.0.1:3001";

export function createApiUrl(path: string) {
  return new URL(path, API_BASE_URL).toString();
}
