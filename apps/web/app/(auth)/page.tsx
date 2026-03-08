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
            eyebrow="Private by deployment"
            title="Sign in to Haaabit"
            description="Stored on the deployment you control. Sign in to the same local account you will use for today's check-ins, edits, and later AI-assisted actions."
          />
          <AuthForm />
          <div className={styles.valueStrip}>
            <div className={styles.valueGrid}>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Local account</span>
                <span className={styles.valueText}>Credentials stay tied to this self-hosted deployment, not a shared cloud account.</span>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Today ready</span>
                <span className={styles.valueText}>Land in a dashboard that tells you what is due, what is done, and what needs correction.</span>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueLabel}>Calm recovery</span>
                <span className={styles.valueText}>If a sign-in attempt fails, your entered details stay in place so you can correct and continue.</span>
              </div>
            </div>
          </div>
        </PageFrame>
      </Surface>
    </main>
  );
}
