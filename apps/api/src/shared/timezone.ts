export const DEFAULT_TIMEZONE = "Asia/Shanghai";

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeUserTimeZone(timeZone: string | null | undefined) {
  if (typeof timeZone !== "string") {
    return DEFAULT_TIMEZONE;
  }

  const normalized = timeZone.trim();

  if (normalized.length === 0) {
    return DEFAULT_TIMEZONE;
  }

  return isValidTimeZone(normalized) ? normalized : DEFAULT_TIMEZONE;
}
