import { HabitsPage } from "../../../components/habits/habits-page";
import { buildCookieHeader, listHabitsFromCookieHeader } from "../../../lib/server-auth";

type HabitsManagementPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function HabitsManagementPage({ searchParams }: HabitsManagementPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialStatus = params?.status === "archived" ? "archived" : "active";
  const cookieHeader = await buildCookieHeader();
  const initialItems = await listHabitsFromCookieHeader(cookieHeader, {
    status: initialStatus,
  });

  return <HabitsPage initialItems={initialItems} initialStatus={initialStatus} />;
}
