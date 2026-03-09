import { expect, test } from "@playwright/test";

import { signUpAndCreateFirstHabit } from "../accessibility/helpers";

test("dashboard route loading stays inside the protected shell", async ({ page }) => {
  await signUpAndCreateFirstHabit(page, `shell-loading-${Date.now()}@example.com`, "Fallback User");

  await page.goto("/dashboard?simulateLoading=1");

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.getByTestId("app-shell-primary-nav")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});
