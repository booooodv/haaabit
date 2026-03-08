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

test("auth keeps sign-in failures in context", async ({ page }) => {
  await page.route("**/api/auth/sign-in/email", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Invalid email or password",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Email").fill("wrong@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  const feedback = page.getByTestId("auth-feedback");
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText("Unable to continue");
  await expect(feedback).toContainText("Invalid email or password");
  await expect(page).toHaveURL(/\/$/);
});
