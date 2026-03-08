import "server-only";

export { getMessages, getRequestLocale } from "./server";
export { defaultLocale, localeCookieMaxAge, localeCookieName, normalizeLocale, resolveLocaleFromAcceptLanguage, supportedLocales } from "./shared";
