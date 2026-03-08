import { expect, test } from "@playwright/test";

import { signUpThroughApi } from "../accessibility/helpers";

const localeCookieName = "haaabit-locale";

test.describe("locale foundation", () => {
  test.describe("browser locale detection", () => {
    test.use({ locale: "zh-CN" });

    test("first visit uses Chinese auth copy when browser locale resolves to Simplified Chinese", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
      await expect(page.getByRole("heading", { name: "登录 Haaabit" })).toBeVisible();
      await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
      await expect(page.getByRole("button", { name: "创建账户" })).toBeVisible();
      await expect(page.getByText("由你部署，数据由你掌控")).toBeVisible();
    });
  });

  test.describe("unsupported locale fallback", () => {
    test.use({ locale: "fr-FR" });

    test("unsupported browser locales fall back to English on first visit", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { name: "Sign in to Haaabit" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    });
  });

  test.describe("remembered preference precedence", () => {
    test.use({ locale: "en-US" });

    test("remembered locale preference overrides browser locale for shared shell chrome", async ({
      page,
      request,
      context,
    }) => {
      const email = `locale-pref-${Date.now()}@example.com`;
      await signUpThroughApi(request, context, email, "Locale Preference User");

      await context.addCookies([
        {
          name: localeCookieName,
          value: "zh-CN",
          domain: "127.0.0.1",
          path: "/",
          sameSite: "Lax",
        },
      ]);

      await page.goto("/dashboard");

      await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
      await expect(page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "今天" })).toBeVisible();
      await expect(page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "习惯" })).toBeVisible();
      await expect(page.getByTestId("app-shell-utility-nav").getByRole("link", { name: "API 访问" })).toBeVisible();
      await expect(page.getByRole("button", { name: "退出登录" })).toBeVisible();
    });
  });
});
