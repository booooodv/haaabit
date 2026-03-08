import { expect, test } from "@playwright/test";

import { signUpAndCreateFirstHabit, signUpThroughApi } from "./helpers";

test("switching auth modes with keyboard moves focus to the first relevant field", async ({ page }) => {
  await page.goto("/");

  const createAccount = page.getByRole("button", { name: "Create account" });
  await createAccount.focus();
  await createAccount.press("Enter");

  await expect(page.getByLabel("Name")).toBeFocused();

  const backToSignIn = page.getByRole("button", { name: "Back to sign in" });
  await backToSignIn.focus();
  await backToSignIn.press("Enter");

  await expect(page.getByLabel("Email")).toBeFocused();
});

test("auth validation moves focus to the first invalid field and links the error text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();

  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");

  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-describedby", /auth-email/);
  await expect(password).toHaveAttribute("aria-describedby", /auth-password/);
});

test("keyboard closing an edit overlay returns focus to the invoking trigger", async ({ page }) => {
  const email = `focus-overlay-${Date.now()}@example.com`;

  await signUpAndCreateFirstHabit(page, email, "Keyboard Focus User");
  await page.goto("/habits");

  const card = page.locator("article").filter({ hasText: "Morning walk" });
  const editButton = card.getByRole("button", { name: "Edit" });

  await editButton.focus();
  await editButton.press("Enter");
  await expect(page.getByTestId("habit-form-overlay")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("habit-form-overlay")).toHaveCount(0);
  await expect(editButton).toBeFocused();
});

test("api access token controls remain keyboard-operable after reveal and rotate", async ({
  page,
  request,
  context,
}) => {
  const email = `focus-token-${Date.now()}@example.com`;
  await signUpThroughApi(request, context, email, "Keyboard Token User");

  await page.goto("/api-access");
  await page.getByRole("button", { name: "Generate token" }).click();

  const revealButton = page.getByRole("button", { name: "Reveal token" });
  await revealButton.focus();
  await revealButton.press("Enter");

  const tokenField = page.getByLabel("Personal API token");
  await expect(tokenField).toHaveValue(/haaabit_/);
  await expect(page.getByRole("button", { name: "Copy token" })).toBeEnabled();

  const rotateButton = page.getByRole("button", { name: "Rotate token" });
  await rotateButton.focus();
  await rotateButton.press("Enter");

  await expect(page.getByTestId("api-access-feedback")).toContainText(/Token (rotated|generated)/);
  await expect(rotateButton).toBeFocused();
});
