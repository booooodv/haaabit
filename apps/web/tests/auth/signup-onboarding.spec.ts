import { expect, test } from "@playwright/test";

test("signed-in user can reach dashboard after creating the first habit", async ({ page }) => {
  const email = `new-user-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Name").fill("New User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Start date").fill(startDate);
  await page.getByRole("button", { name: "Create first habit" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-overview")).toBeVisible();
  await expect(page.getByTestId("today-dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Morning walk" })).toBeVisible();
});
