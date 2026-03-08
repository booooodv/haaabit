"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutButton } from "../auth/sign-out-button";
import { Surface, cn } from "../ui";
import {
  primaryAppNavigation,
  routes,
  utilityAppNavigation,
} from "../../lib/navigation";
import styles from "./app-shell.module.css";

type AppShellProps = {
  userEmail: string;
  children: ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className={styles.shell} data-testid="app-shell">
      <div className={styles.inner}>
        <Surface
          variant="hero"
          padding="md"
          className={styles.headerSurface}
          data-testid="app-shell-header"
        >
          <div className={styles.utilityRow}>
            <div className={styles.utilityMeta}>
              <span className={styles.identity}>{userEmail}</span>
              <nav
                aria-label="Utility"
                className={styles.utilityNav}
                data-testid="app-shell-utility-nav"
              >
                {utilityAppNavigation.map((item) => {
                  const active = isRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        styles.utilityLink,
                        active && styles.utilityLinkActive,
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <SignOutButton />
          </div>

          <div className={styles.brandRow}>
            <div className={styles.brand}>
              <Link href={routes.dashboard} className={styles.brandMark}>
                Haaabit
              </Link>
              <p className={styles.brandCopy}>
                Calm daily execution with a stable AI-ready habit system.
              </p>
            </div>

            <nav
              aria-label="Primary"
              className={cn(styles.primaryNav, styles.desktopPrimaryNav)}
              data-testid="app-shell-primary-nav"
            >
              {primaryAppNavigation.map((item) => {
                const active = isRouteActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(styles.navLink, active && styles.navLinkActive)}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </Surface>

        <div className={styles.content} data-testid="app-shell-content">
          {children}
        </div>
      </div>

      <nav
        aria-label="Primary mobile"
        className={styles.mobileNav}
        data-testid="app-shell-mobile-nav"
      >
        {primaryAppNavigation.map((item) => {
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.mobileNavLink, active && styles.mobileNavLinkActive)}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.mobileNavEyebrow}>Go to</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

function isRouteActive(pathname: string, href: string) {
  if (href === routes.dashboard) {
    return pathname === routes.dashboard;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
