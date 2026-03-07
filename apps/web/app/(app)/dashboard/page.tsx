import { redirect } from "next/navigation";

import { routes } from "../../../lib/navigation";
import { buildCookieHeader, listHabitsFromCookieHeader } from "../../../lib/server-auth";

export default async function DashboardPage() {
  const cookieHeader = await buildCookieHeader();
  const habits = await listHabitsFromCookieHeader(cookieHeader);

  if (habits.length === 0) {
    redirect(routes.newHabit);
  }

  return (
    <section
      style={{
        background: "#fffdf8",
        border: "1px solid #d8d0c4",
        borderRadius: "1.5rem",
        padding: "2rem",
        boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
      }}
    >
      <h1>Dashboard</h1>
      <p>Your current habits are ready for the next phase&apos;s today view.</p>
      <ul>
        {habits.map((habit) => (
          <li key={habit.id}>{habit.name}</li>
        ))}
      </ul>
    </section>
  );
}
