"use client";

import { AuthForm } from "../../components/auth/auth-form";
import { LocaleSwitch, useLocale } from "../../components/locale";
import { PageFrame, PageHeader, Surface } from "../../components/ui";
import styles from "./page.module.css";

export function AuthPageContent() {
  const { copy } = useLocale();

  return (
    <main className={styles.canvas}>
      <Surface variant="hero" className={styles.shell} data-testid="auth-shell">
        <PageFrame>
          <PageHeader
            eyebrow={copy.auth.page.eyebrow}
            title={copy.auth.page.title}
            description={copy.auth.page.description}
            actions={<LocaleSwitch />}
          />
          <AuthForm copy={copy.auth.form} />
          <div className={styles.valueStrip}>
            <div className={styles.valueGrid}>
              {copy.auth.page.values.map((item) => (
                <div key={item.label} className={styles.valueItem}>
                  <span className={styles.valueLabel}>{item.label}</span>
                  <span className={styles.valueText}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </PageFrame>
      </Surface>
    </main>
  );
}
