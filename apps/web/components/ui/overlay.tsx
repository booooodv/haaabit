"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";

import { Button } from "./button";
import { cn } from "./cn";
import styles from "./overlay.module.css";

type OverlayPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "dialog" | "drawer";
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  closeHref?: string;
  testId?: string;
  contentClassName?: string;
};

export function OverlayPanel({
  open,
  onOpenChange,
  variant = "dialog",
  title,
  description,
  children,
  closeLabel = "Close",
  closeHref,
  testId,
  contentClassName,
}: OverlayPanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={cn(styles.content, variant === "drawer" ? styles.drawer : styles.dialog, contentClassName)}
          data-testid={testId}
        >
          <div className={styles.header}>
            <div className={styles.copy}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              {description ? <Dialog.Description className={styles.description}>{description}</Dialog.Description> : null}
            </div>

            {closeHref ? (
              <Link href={closeHref} className={styles.linkClose}>
                {closeLabel}
              </Link>
            ) : (
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  {closeLabel}
                </Button>
              </Dialog.Close>
            )}
          </div>
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
