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

  test("ignores extension-injected html classes during hydration", async ({ page, request, context }) => {
    const email = `locale-hydration-${Date.now()}@example.com`;
    const consoleErrors: string[] = [];

    await signUpThroughApi(request, context, email, "Hydration Guard User");

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.route("**/habits", async (route) => {
      const response = await route.fetch();
      const html = await response.text();

      await route.fulfill({
        response,
        body: html.replace(
          "<head>",
          "<head><script>document.documentElement.classList.add('trancy-zh-CN')</script>",
        ),
      });
    });

    await page.goto("/habits");

    await expect(page.getByRole("heading", { name: "Habits", exact: true })).toBeVisible();

    expect(
      consoleErrors.filter((entry) =>
        entry.includes("A tree hydrated but some attributes of the server rendered HTML didn't match"),
      ),
    ).toEqual([]);
  });
});
