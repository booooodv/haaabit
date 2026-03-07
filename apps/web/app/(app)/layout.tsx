import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SignOutButton } from "../../components/auth/sign-out-button";
import { routes } from "../../lib/navigation";
import { buildCookieHeader, getSessionFromCookieHeader } from "../../lib/server-auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (!session) {
    redirect(routes.auth);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "linear-gradient(180deg, #f4f1ea 0%, #ece4d6 100%)",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <header
          style={{
            display: "grid",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "#6b5e50" }}>{session.user.email}</span>
            <SignOutButton />
          </div>

          <nav
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={routes.dashboard}
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "999px",
                background: "#fff8ee",
                border: "1px solid #d8cbb8",
                color: "#4b3b2d",
                textDecoration: "none",
              }}
            >
              Today
            </Link>
            <Link
              href={routes.habits}
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "999px",
                background: "#fff8ee",
                border: "1px solid #d8cbb8",
                color: "#4b3b2d",
                textDecoration: "none",
              }}
            >
              Habits
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
