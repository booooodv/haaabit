import { expect, test } from "@playwright/test";

async function signUpAndCreateFirstHabit(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Fallback User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("dashboard route loading stays inside the protected shell", async ({ page }) => {
  await signUpAndCreateFirstHabit(page, `shell-loading-${Date.now()}@example.com`);

  await page.goto("/habits");
  await expect(page).toHaveURL(/\/habits$/);

  const todayLink = page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "Today" });
  await todayLink.evaluate((element) => {
    element.setAttribute("href", "/dashboard?simulateLoading=1");
  });
  await todayLink.click();

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("dashboard-route-loading")).toBeVisible();
  await expect(page.getByTestId("dashboard-route-loading")).toContainText("Preparing dashboard");
  await expect(page.getByTestId("app-shell-primary-nav")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
});
