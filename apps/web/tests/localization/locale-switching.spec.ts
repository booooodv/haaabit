import { expect, test } from "@playwright/test";

import { signUpThroughApi } from "../accessibility/helpers";

test.describe("locale switching", () => {
  test.use({ locale: "en-US" });

  test("auth locale switch updates copy in place and keeps entered values", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("typed@example.com");

    const switcher = page.getByTestId("locale-switch");
    await expect(switcher).toBeVisible();

    const chineseButton = switcher.getByRole("button", { name: "中文" });
    await chineseButton.focus();
    await chineseButton.press("Enter");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(chineseButton).toBeFocused();
    await expect(page.getByRole("heading", { name: "登录 Haaabit" })).toBeVisible();
    await expect(page.getByLabel("邮箱")).toHaveValue("typed@example.com");

    await page.reload();
    await expect(page.getByRole("heading", { name: "登录 Haaabit" })).toBeVisible();
    await expect(page.getByLabel("邮箱")).toHaveValue("typed@example.com");
  });

  test("protected shell locale switch keeps the current route and survives refresh", async ({
    page,
    request,
    context,
  }) => {
    const email = `locale-shell-${Date.now()}@example.com`;
    await signUpThroughApi(request, context, email, "Locale Shell User");

    await page.goto("/habits");
    await expect(page).toHaveURL(/\/habits$/);

    const switcher = page.getByTestId("locale-switch");
    await expect(switcher).toBeVisible();
    const chineseButton = switcher.getByRole("button", { name: "中文" });
    await chineseButton.focus();
    await chineseButton.press("Enter");

    await expect(page).toHaveURL(/\/habits$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(chineseButton).toBeFocused();
    await expect(page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "习惯" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByTestId("app-shell-utility-nav").getByRole("link", { name: "API 访问" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/habits$/);
    await expect(page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "习惯" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test.describe("mobile locale switching", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("mobile locale switch keeps route and utility navigation intact", async ({ page, request, context }) => {
      const email = `locale-mobile-${Date.now()}@example.com`;
      await signUpThroughApi(request, context, email, "Locale Mobile User");

      await page.goto("/api-access");
      await expect(page).toHaveURL(/\/api-access$/);

      const switcher = page.getByTestId("locale-switch");
      const chineseButton = switcher.getByRole("button", { name: "中文" });

      await chineseButton.focus();
      await chineseButton.press("Enter");

      await expect(page).toHaveURL(/\/api-access$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
      await expect(chineseButton).toBeFocused();
      await expect(page.getByRole("heading", { name: "API 访问" })).toBeVisible();
      await expect(page.getByTestId("app-shell-utility-nav").getByRole("link", { name: "API 访问" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(page.getByTestId("app-shell-mobile-nav").getByRole("link", { name: "今天" })).toBeVisible();
    });
  });
});
