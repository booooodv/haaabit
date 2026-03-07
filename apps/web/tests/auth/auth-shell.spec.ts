import { expect, test } from "@playwright/test";

test("logged-out users land on auth page and protected shell redirects back to login when session is invalid", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sign in to Haaabit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Sign in to Haaabit" })).toBeVisible();
});
