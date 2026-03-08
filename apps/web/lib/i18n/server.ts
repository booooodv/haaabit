import "server-only";

import { cookies, headers } from "next/headers";

import { messages, type LocaleMessages, type SupportedLocale } from "./messages";
import { defaultLocale, localeCookieName, normalizeLocale, resolveLocaleFromAcceptLanguage } from "./shared";

export async function getRequestLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const preferredLocale = normalizeLocale(cookieStore.get(localeCookieName)?.value);

  if (preferredLocale) {
    return preferredLocale;
  }

  const headerStore = await headers();
  return resolveLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? defaultLocale;
}

export function getMessages(locale: SupportedLocale): LocaleMessages {
  return messages[locale];
}
