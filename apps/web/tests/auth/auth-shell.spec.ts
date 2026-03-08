import { expect, test } from "@playwright/test";

test("logged-out users land on auth page and protected shell redirects back to login when session is invalid", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sign in to Haaabit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Private by deployment")).toBeVisible();
  await expect(page.getByText("Stored on the deployment you control")).toBeVisible();

  const createAccount = page.getByRole("button", { name: "Create account" });
  await createAccount.focus();
  await createAccount.press("Enter");
  await expect(page.getByLabel("Name")).toBeFocused();

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
  await expect(page.getByText("Check your email and password, then try again.")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-describedby", /auth-email/);
  await expect(page.getByLabel("Password")).toHaveAttribute("aria-describedby", /auth-password/);
  await expect(page.getByLabel("Email")).toHaveValue("wrong@example.com");
  await expect(page.getByLabel("Password")).toHaveValue("password123");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
