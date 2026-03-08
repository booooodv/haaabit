import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";
import styles from "./primitives.module.css";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "panel" | "hero" | "soft";
  padding?: "md" | "lg";
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
  title?: ReactNode;
};

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function Surface({
  className,
  variant = "panel",
  padding = "lg",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        styles.surface,
        styles[variant],
        padding === "lg" ? styles.paddingLg : styles.paddingMd,
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn(styles.badge, styles[`tone${capitalize(tone)}`], className)} {...props} />;
}

export function Notice({ className, tone = "neutral", title, children, ...props }: NoticeProps) {
  return (
    <div className={cn(styles.notice, styles[`tone${capitalize(tone)}`], className)} {...props}>
      {title ? <div className={styles.noticeTitle}>{title}</div> : null}
      <div>{children}</div>
    </div>
  );
}

export function PageFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.pageFrame, className)} {...props} />;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn(styles.section, className)} {...props} />;
}

function capitalize(value: Tone) {
  return value[0].toUpperCase() + value.slice(1);
}
