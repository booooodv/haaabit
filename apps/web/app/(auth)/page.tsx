import { redirect } from "next/navigation";

import { AuthPageContent } from "./auth-page-content";
import { routes } from "../../lib/navigation";
import { buildCookieHeader, getSessionFromCookieHeader, listHabitsFromCookieHeader } from "../../lib/server-auth";

export default async function AuthPage() {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (session) {
    const habits = await listHabitsFromCookieHeader(cookieHeader);
    redirect(habits.length === 0 ? routes.newHabit : routes.dashboard);
  }

  return <AuthPageContent />;
}
