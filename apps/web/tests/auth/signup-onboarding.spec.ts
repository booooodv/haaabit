import { expect, test } from "@playwright/test";

test("signup routes first-time user into habit onboarding and can create the first habit", async ({ page }) => {
  const email = `new-user-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Name").fill("New User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/habits\/new$/);
  await expect(page.getByRole("heading", { name: "Create your first habit" })).toBeVisible();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Frequency").selectOption("daily");
  await page.getByRole("button", { name: "Save habit" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Morning walk")).toBeVisible();
});
