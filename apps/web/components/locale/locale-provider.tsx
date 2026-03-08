"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { messages, type LocaleMessages, type SupportedLocale } from "../../lib/i18n/messages";
import { localeCookieMaxAge, localeCookieName } from "../../lib/i18n/shared";

type LocaleContextValue = {
  locale: SupportedLocale;
  copy: LocaleMessages;
  setLocale: (locale: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportedLocale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, copy: messages[locale], setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
