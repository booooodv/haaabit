import { HabitsPage } from "../../../components/habits/habits-page";
import { buildCookieHeader, listHabitsFromCookieHeader } from "../../../lib/server-auth";

export default async function HabitsManagementPage() {
  const cookieHeader = await buildCookieHeader();
  const initialItems = await listHabitsFromCookieHeader(cookieHeader, {
    status: "active",
  });

  return <HabitsPage initialItems={initialItems} />;
}
