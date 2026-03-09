"use client";

import { Button } from "../ui";
import { useLocale } from "./locale-provider";
import styles from "./locale-switch.module.css";

const localeToggleMap = {
  en: "zh-CN",
  "zh-CN": "en",
} as const;

const localeActionLabels = {
  en: "Switch to English",
  "zh-CN": "切换到中文",
} as const;

export function LocaleSwitch() {
  const { locale, copy, setLocale } = useLocale();
  const nextLocale = localeToggleMap[locale];
  const actionLabel = localeActionLabels[nextLocale];

  return (
    <div className={styles.switch} data-testid="locale-switch">
      <Button
        type="button"
        variant="ghost"
        className={styles.button}
        data-testid="locale-switch-button"
        aria-label={`${copy.meta.localeSwitchLabel}: ${actionLabel}`}
        title={actionLabel}
        onClick={() => setLocale(nextLocale)}
      >
        <span className={styles.icon} aria-hidden="true">
          <span className={styles.cjk}>中</span>
          <span className={styles.divider}>/</span>
          <span className={styles.latin}>EN</span>
        </span>
      </Button>
    </div>
  );
}
