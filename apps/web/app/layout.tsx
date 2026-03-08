import type { ReactNode } from "react";

import { bodyFont, displayFont } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "Haaabit",
  description: "AI-first habit tracking",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
