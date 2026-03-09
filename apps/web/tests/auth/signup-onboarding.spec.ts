import { expect, test } from "@playwright/test";

import { signUpInBrowser } from "../accessibility/helpers";

test("signed-in user can reach dashboard after creating the first habit", async ({ page }) => {
  const email = `new-user-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await signUpInBrowser(page, email, "New User");
  await expect(page.getByRole("heading", { name: "Create your first habit" })).toBeVisible();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Start date").fill(startDate);
  await page.getByRole("button", { name: "Create first habit" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-overview")).toBeVisible();
  await expect(page.getByTestId("today-dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Morning walk" })).toBeVisible();
});
