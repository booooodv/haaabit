import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "../../components/app-shell/app-shell";
import { routes } from "../../lib/navigation";
import { buildCookieHeader, getSessionFromCookieHeader } from "../../lib/server-auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (!session) {
    redirect(routes.auth);
  }

  return <AppShell userEmail={session.user.email}>{children}</AppShell>;
}
