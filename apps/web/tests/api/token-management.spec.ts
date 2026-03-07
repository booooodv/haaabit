import { expect, test } from "@playwright/test";

test("signed-in users can generate and view their personal api token", async ({ page }) => {
  const email = `api-access-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("API Access User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();

  await page.goto("/api-access");

  await expect(page.getByRole("heading", { name: "API access" })).toBeVisible();
  await expect(page.getByText("No personal API token has been generated yet.")).toBeVisible();

  await page.getByRole("button", { name: "Generate token" }).click();

  const tokenField = page.getByLabel("Personal API token");
  await expect(tokenField).toHaveValue(/haaabit_/);
  await expect(page.getByRole("link", { name: "Open API docs" })).toBeVisible();

  const firstToken = await tokenField.inputValue();

  await page.getByRole("button", { name: "Rotate token" }).click();

  await expect(tokenField).toHaveValue(/haaabit_/);
  await expect(tokenField).not.toHaveValue(firstToken);
});
