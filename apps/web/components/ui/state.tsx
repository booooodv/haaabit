import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";
import { Surface } from "./primitives";
import styles from "./state.module.css";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

type StatePanelProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  tone?: Tone;
  actions?: ReactNode;
  compact?: boolean;
  testId?: string;
};

type InlineStatusProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  tone?: Tone;
  testId?: string;
};

type SkeletonBlockProps = HTMLAttributes<HTMLSpanElement> & {
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
};

export function StatePanel({
  title,
  description,
  eyebrow,
  tone = "neutral",
  actions,
  compact = false,
  testId,
  className,
  children,
  ...props
}: StatePanelProps) {
  return (
    <Surface
      variant="soft"
      padding={compact ? "md" : "lg"}
      className={cn(
        styles.statePanel,
        styles[`tone${capitalize(tone)}`],
        compact && styles.panelCompact,
        className,
      )}
      data-testid={testId}
      {...props}
    >
      <div className={styles.panelHeader}>
        {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>

      {children ? <div className={styles.panelBody}>{children}</div> : null}
      {actions ? <div className={styles.panelActions}>{actions}</div> : null}
    </Surface>
  );
}

export function InlineStatus({
  title,
  tone = "neutral",
  testId,
  className,
  children,
  ...props
}: InlineStatusProps) {
  return (
    <div
      className={cn(styles.inlineStatus, styles[`tone${capitalize(tone)}`], className)}
      data-testid={testId}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      {...props}
    >
      {title ? <div className={styles.inlineStatusTitle}>{title}</div> : null}
      {children ? <div className={styles.inlineStatusMessage}>{children}</div> : null}
    </div>
  );
}

export function DisabledHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(styles.disabledHint, className)} {...props} />;
}

export function SkeletonBlock({
  className,
  height = "1rem",
  width = "100%",
  style,
  ...props
}: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      style={{
        height,
        width,
        ...style,
      }}
      {...props}
    />
  );
}

function capitalize(value: Tone) {
  return value[0].toUpperCase() + value.slice(1);
}
