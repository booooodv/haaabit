"use client";

import { Button } from "../ui";
import type { SupportedLocale } from "../../lib/i18n/messages";
import { supportedLocales } from "../../lib/i18n/shared";
import { useLocale } from "./locale-provider";
import styles from "./locale-switch.module.css";

const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  "zh-CN": "中文",
};

export function LocaleSwitch() {
  const { locale, copy, setLocale } = useLocale();

  return (
    <div
      className={styles.switch}
      data-testid="locale-switch"
      role="group"
      aria-label={copy.meta.localeSwitchLabel}
    >
      {supportedLocales.map((option) => (
        <Button
          key={option}
          type="button"
          variant={option === locale ? "secondary" : "ghost"}
          className={styles.button}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {localeLabels[option]}
        </Button>
      ))}
    </div>
  );
}
