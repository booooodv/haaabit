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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
          }}
        >
          <span style={{ color: "#6b5e50" }}>{session.user.email}</span>
          <SignOutButton />
        </header>
        {children}
      </div>
    </main>
  );
}
