import { expect, test } from "@playwright/test";

async function signUpAndCreateFirstHabit(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Shell User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("protected shell shows utility access and active desktop navigation", async ({ page }) => {
  await signUpAndCreateFirstHabit(page, `shell-desktop-${Date.now()}@example.com`);

  const utilityNav = page.getByTestId("app-shell-utility-nav");
  const primaryNav = page.getByTestId("app-shell-primary-nav");

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(primaryNav).toBeVisible();
  await expect(utilityNav).toBeVisible();
  await expect(page.getByText(/shell-desktop-/)).toBeVisible();
  await expect(primaryNav.getByRole("link", { name: "Today" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(utilityNav.getByRole("link", { name: "API Access" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );

  const habitsLink = primaryNav.getByRole("link", { name: "Habits" });
  await habitsLink.focus();
  await habitsLink.press("Enter");
  await expect(page).toHaveURL(/\/habits$/);
  await expect(primaryNav.getByRole("link", { name: "Habits" })).toBeFocused();
  await expect(primaryNav.getByRole("link", { name: "Habits" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const apiAccessLink = utilityNav.getByRole("link", { name: "API Access" });
  await apiAccessLink.focus();
  await apiAccessLink.press("Enter");
  await expect(page).toHaveURL(/\/api-access$/);
  await expect(utilityNav.getByRole("link", { name: "API Access" })).toBeFocused();
  await expect(utilityNav.getByRole("link", { name: "API Access" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test.describe("mobile shell", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("protected shell uses bottom navigation on mobile while keeping utility access on top", async ({
    page,
  }) => {
    await signUpAndCreateFirstHabit(page, `shell-mobile-${Date.now()}@example.com`);

    const mobileNav = page.getByTestId("app-shell-mobile-nav");

    await expect(mobileNav).toBeVisible();
    await expect(page.getByTestId("app-shell-primary-nav")).not.toBeVisible();
    await expect(page.getByTestId("app-shell-utility-nav")).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: /Today/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const mobileHabitsLink = mobileNav.getByRole("link", { name: /Habits/i });
    await mobileHabitsLink.focus();
    await mobileHabitsLink.press("Enter");
    await expect(page).toHaveURL(/\/habits$/);
    await expect(mobileNav.getByRole("link", { name: /Habits/i })).toBeFocused();
    await expect(mobileNav.getByRole("link", { name: /Habits/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const mobileApiAccessLink = page
      .getByTestId("app-shell-utility-nav")
      .getByRole("link", { name: "API Access" });
    await mobileApiAccessLink.focus();
    await mobileApiAccessLink.press("Enter");
    await expect(page).toHaveURL(/\/api-access$/);
    await expect(page.getByTestId("app-shell-utility-nav").getByRole("link", { name: "API Access" })).toBeFocused();
  });
});
