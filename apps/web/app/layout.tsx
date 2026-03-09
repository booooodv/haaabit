import type { ReactNode } from "react";

import { LocaleProvider } from "../components/locale";
import { bodyFont, displayFont } from "./fonts";
import "./globals.css";
import { getRequestLocale } from "../lib/i18n/server";

export const metadata = {
  title: "Haaabit",
  description: "AI-first habit tracking",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
