import { redirect } from "next/navigation";

import { AuthPageContent } from "./auth-page-content";
import { routes } from "../../lib/navigation";
import {
  buildCookieHeader,
  getRegistrationStatusFromCookieHeader,
  getSessionFromCookieHeader,
  listHabitsFromCookieHeader,
} from "../../lib/server-auth";

export default async function AuthPage() {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (session) {
    const habits = await listHabitsFromCookieHeader(cookieHeader);
    redirect(habits.length === 0 ? routes.newHabit : routes.dashboard);
  }

  const registration = await getRegistrationStatusFromCookieHeader(cookieHeader);

  return <AuthPageContent registrationEnabled={registration.registrationEnabled} />;
}
