import { redirect } from "next/navigation";

import { AuthForm } from "../../components/auth/auth-form";
import { PageFrame, PageHeader, Surface } from "../../components/ui";
import { routes } from "../../lib/navigation";
import { buildCookieHeader, getSessionFromCookieHeader, listHabitsFromCookieHeader } from "../../lib/server-auth";
import styles from "./page.module.css";

export default async function AuthPage() {
  const cookieHeader = await buildCookieHeader();
  const session = await getSessionFromCookieHeader(cookieHeader);

  if (session) {
    const habits = await listHabitsFromCookieHeader(cookieHeader);
    redirect(habits.length === 0 ? routes.newHabit : routes.dashboard);
  }

  return (
    <main className={styles.canvas}>
      <Surface variant="hero" className={styles.shell} data-testid="auth-shell">
        <PageFrame>
          <PageHeader
            eyebrow="Session-backed access"
            title="Sign in to Haaabit"
            description="Use the same trusted session flow that powers onboarding now and AI-assisted habit actions later."
          />
          <AuthForm />
          <div className={styles.valueStrip}>
            <div className={styles.valueGrid}>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Today clarity</span>
                <span className={styles.valueText}>See what is due, what is done, and what needs a correction.</span>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Calm control</span>
                <span className={styles.valueText}>One coherent surface for auth, habits, and later API access.</span>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Self-host ready</span>
                <span className={styles.valueText}>Your account stays local to the deployment you control.</span>
              </div>
            </div>
          </div>
        </PageFrame>
      </Surface>
    </main>
  );
}
