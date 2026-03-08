import { expect, test } from "@playwright/test";

async function seedHabit(
  page: import("@playwright/test").Page,
  payload: Record<string, unknown>,
) {
  await page.evaluate(async (input) => {
    const response = await fetch("http://127.0.0.1:3001/api/habits", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }, payload);
}

test("user can manage habits through search, edit, archive, and restore flows", async ({ page }) => {
  const email = `habits-manager-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Habit Manager");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await seedHabit(page, {
    name: "Read pages",
    kind: "quantity",
    targetValue: 10,
    unit: "pages",
    category: "learning",
    frequency: {
      type: "daily",
    },
  });

  await page.goto("/habits");
  await expect(page.getByRole("heading", { name: "Habits" })).toBeVisible();
  await expect(page.getByTestId("habits-toolbar")).toBeVisible();
  await expect(page.getByTestId("habits-toolbar")).toContainText("New habit");

  await page.getByLabel("Search").fill("Read");
  await expect(page.locator("article").filter({ hasText: "Read pages" })).toBeVisible();
  await expect(page.locator("article").filter({ hasText: "Morning walk" })).toHaveCount(0);

  await page.getByLabel("Search").fill("");
  await page.getByLabel("Kind").selectOption("quantity");
  const readCard = page.locator("article").filter({ hasText: "Read pages" });
  await expect(readCard).toBeVisible();
  await expect(readCard.getByTestId("habit-card-primary-action")).toBeVisible();

  await readCard.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Habit name").fill("Read Deep Work");
  await page.getByLabel("Target value").fill("12");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toBeVisible();

  const updatedCard = page.locator("article").filter({ hasText: "Read Deep Work" });
  await updatedCard.getByRole("button", { name: "Archive" }).click();
  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toHaveCount(0);

  await page.getByRole("button", { name: "Archived" }).click();
  const archivedCard = page.locator("article").filter({ hasText: "Read Deep Work" });
  await expect(archivedCard).toBeVisible();
  await archivedCard.getByRole("button", { name: "Restore" }).click();

  await page.getByRole("button", { name: "Active" }).click();
  await page.getByLabel("Kind").selectOption("all");
  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toBeVisible();
});

test("closing an edit overlay returns focus to the triggering action", async ({ page }) => {
  const email = `habits-focus-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Habit Focus User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

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

test("habit action failures stay in context", async ({ page }) => {
  const email = `habits-error-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Habit Error User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/habits");
  await expect(page.getByTestId("habits-page")).toBeVisible();

  await page.route("**/api/habits/*/archive", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Archive is temporarily unavailable",
      }),
    });
  });

  const card = page.locator("article").filter({ hasText: "Morning walk" });
  await card.getByRole("button", { name: "Archive" }).click();

  await expect(page.getByTestId("habits-feedback")).toBeVisible();
  await expect(page.getByTestId("habits-feedback")).toContainText("Unable to update habits");
  await expect(page.getByTestId("habits-feedback")).toContainText(
    "Archive is temporarily unavailable",
  );
  await expect(card).toBeVisible();
});

test.describe("mobile habits layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile habits surface stacks filters into a single-column priority flow", async ({ page }) => {
    const email = `habits-mobile-${Date.now()}@example.com`;

    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByLabel("Name").fill("Habit Mobile User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByLabel("Habit name").fill("Morning walk");
    await page.getByRole("button", { name: "Create first habit" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/habits");

    await expect(page.getByTestId("habits-filters")).toBeVisible();

    const searchBox = await page.getByLabel("Search").boundingBox();
    const categoryBox = await page.getByLabel("Category").boundingBox();
    const kindBox = await page.getByLabel("Kind").boundingBox();

    expect(searchBox).not.toBeNull();
    expect(categoryBox).not.toBeNull();
    expect(kindBox).not.toBeNull();
    expect(Math.abs((searchBox?.x ?? 0) - (categoryBox?.x ?? 0))).toBeLessThan(6);
    expect(Math.abs((categoryBox?.x ?? 0) - (kindBox?.x ?? 0))).toBeLessThan(6);
    expect((categoryBox?.y ?? 0) > (searchBox?.y ?? 0)).toBeTruthy();
    expect((kindBox?.y ?? 0) > (categoryBox?.y ?? 0)).toBeTruthy();
  });
});
