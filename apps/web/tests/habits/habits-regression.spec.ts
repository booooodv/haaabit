import { expect, test } from "@playwright/test";

test("archiving the last active habit keeps dashboard in place and restore makes today reachable again", async ({
  page,
}) => {
  const email = `habit-regression-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Regression User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/^1 pending$/)).toBeVisible();

  await page.getByRole("link", { name: "Habits" }).click();
  const walkCard = page.locator("article").filter({ hasText: "Morning walk" });
  await walkCard.getByRole("button", { name: "Archive" }).click();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("No active habits right now")).toBeVisible();
  await page.getByRole("button", { name: "Review archived habits" }).click();
  await expect(page).toHaveURL(/\/habits\?status=archived$/);

  const archivedCard = page.locator("article").filter({ hasText: "Morning walk" });
  await expect(archivedCard).toBeVisible();
  await archivedCard.getByRole("button", { name: "Restore" }).click();

  await page.getByRole("button", { name: "Active" }).click();
  await expect(page.locator("article").filter({ hasText: "Morning walk" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/^1 pending$/)).toBeVisible();
});
