import { redirect } from "next/navigation";

import { AuthForm } from "../../components/auth/auth-form";
import { routes } from "../../lib/navigation";
import { buildCookieHeader, getSessionFromCookieHeader, listHabitsFromCookieHeader } from "../../lib/server-auth";

export default async function AuthPage() {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (session) {
    const habits = await listHabitsFromCookieHeader(cookieHeader);
    redirect(habits.length === 0 ? routes.newHabit : routes.dashboard);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f4f1ea",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "28rem",
          background: "#fffdf8",
          border: "1px solid #d8d0c4",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(40, 28, 15, 0.08)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Sign in to Haaabit</h1>
        <p style={{ margin: "0.75rem 0 1.5rem", color: "#6b5e50" }}>
          Use the same session-backed auth flow that the API will trust for onboarding and later habit
          actions.
        </p>
        <AuthForm />
      </section>
    </main>
  );
}
