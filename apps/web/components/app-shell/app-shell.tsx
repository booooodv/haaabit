"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LocaleSwitch, useLocale } from "../locale";
import { SignOutButton } from "../auth/sign-out-button";
import { Surface, cn } from "../ui";
import {
  getPrimaryAppNavigation,
  routes,
  getUtilityAppNavigation,
} from "../../lib/navigation";
import styles from "./app-shell.module.css";

type AppShellProps = {
  userEmail: string;
  children: ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  const pathname = usePathname();
  const { locale, copy } = useLocale();
  const primaryAppNavigation = getPrimaryAppNavigation(copy.shell.navigation);
  const utilityAppNavigation = getUtilityAppNavigation(copy.shell.navigation);

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
                      data-accented={item.href === routes.apiAccess ? "true" : undefined}
                      className={cn(
                        styles.utilityLink,
                        item.href === routes.apiAccess && styles.utilityLinkAccent,
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

            <div className={styles.utilityActions}>
              <LocaleSwitch />
              <SignOutButton label={copy.shell.signOut} />
            </div>
          </div>

          <div className={styles.brandRow}>
            <div className={styles.brand}>
              <Link href={routes.dashboard} className={styles.brandMark}>
                Haaabit
              </Link>
              <p className={styles.brandCopy}>{copy.shell.brandCopy}</p>
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
              <span className={styles.mobileNavEyebrow}>{locale === "zh-CN" ? "前往" : "Go to"}</span>
              <span className={styles.mobileNavLabel}>{item.label}</span>
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
