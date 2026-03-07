import { notFound } from "next/navigation";

import { HabitsPage } from "../../../../components/habits/habits-page";
import { routes } from "../../../../lib/navigation";
import {
  buildCookieHeader,
  getHabitDetailFromCookieHeader,
  listHabitsFromCookieHeader,
} from "../../../../lib/server-auth";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ habitId: string }>;
}) {
  const { habitId } = await params;
  const cookieHeader = await buildCookieHeader();
  const detail = await getHabitDetailFromCookieHeader(cookieHeader, habitId);

  if (!detail) {
    notFound();
  }

  const initialStatus = detail.habit.isActive ? "active" : "archived";
  const initialItems = await listHabitsFromCookieHeader(cookieHeader, {
    status: initialStatus,
  });

  return (
    <HabitsPage
      initialItems={initialItems}
      initialStatus={initialStatus}
      initialDetail={detail}
      closeDetailHref={routes.habits}
    />
  );
}
