import { expect, test } from "@playwright/test";

import { createFirstHabit, signUpInBrowser } from "../accessibility/helpers";

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

async function measurePageBox(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    };
  });
}

test("user can manage habits through search, edit, archive, and restore flows", async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 900 });
  const email = `habits-manager-${Date.now()}@example.com`;

  await signUpInBrowser(page, email, "Habit Manager");
  await expect(page.getByRole("heading", { name: "Create your first habit" })).toBeVisible();
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
  await page.getByTestId("locale-switch-button").click();
  await expect(page.getByRole("heading", { name: "习惯" })).toBeVisible();
  await expect(page.getByTestId("habits-toolbar")).toBeVisible();
  await expect(page.getByTestId("habits-toolbar")).toContainText("新建习惯");
  await page.getByRole("button", { name: "新建习惯" }).click();
  await expect(page.getByLabel("习惯类型")).toContainText("打卡型");
  await page.getByRole("button", { name: "关闭" }).click();

  const statusSwitch = page.getByTestId("habits-status-switch");
  const activeButton = statusSwitch.getByRole("button", { name: "启用中" });
  const archivedButton = statusSwitch.getByRole("button", { name: "已归档" });
  const statusSwitchBox = await measurePageBox(statusSwitch);
  const activeBox = await measurePageBox(activeButton);
  const archivedBox = await measurePageBox(archivedButton);

  expect(Math.abs(activeBox.width - archivedBox.width)).toBeLessThan(2);

  await page.getByLabel("搜索").fill("Read");
  await expect(page.locator("article").filter({ hasText: "Read pages" })).toBeVisible();
  await expect(page.locator("article").filter({ hasText: "Morning walk" })).toHaveCount(0);

  await page.getByLabel("搜索").fill("");
  await page.getByLabel("类型").selectOption("quantity");
  const readCard = page.locator("article").filter({ hasText: "Read pages" });
  await expect(readCard).toBeVisible();
  await expect(readCard.getByTestId("habit-card-primary-action")).toBeVisible();

  await readCard.getByRole("button", { name: "编辑" }).click();
  await page.getByLabel("习惯名称").fill("Read Deep Work");
  await page.getByLabel("目标值").fill("12");
  await page.getByRole("button", { name: "保存更改" }).click();

  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toBeVisible();

  const updatedCard = page.locator("article").filter({ hasText: "Read Deep Work" });
  await updatedCard.getByRole("button", { name: "归档" }).click();
  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toHaveCount(0);

  await page.getByRole("button", { name: "已归档" }).click();
  const statusSwitchBoxAfterToggle = await measurePageBox(statusSwitch);
  const activeBoxAfterToggle = await measurePageBox(activeButton);
  const archivedBoxAfterToggle = await measurePageBox(archivedButton);

  expect(Math.abs(statusSwitchBoxAfterToggle.x - statusSwitchBox.x)).toBeLessThan(2);
  expect(Math.abs(statusSwitchBoxAfterToggle.y - statusSwitchBox.y)).toBeLessThan(2);
  expect(Math.abs(activeBoxAfterToggle.x - activeBox.x)).toBeLessThan(2);
  expect(Math.abs(archivedBoxAfterToggle.x - archivedBox.x)).toBeLessThan(2);

  const archivedCard = page.locator("article").filter({ hasText: "Read Deep Work" });
  await expect(archivedCard).toBeVisible();
  await archivedCard.getByRole("button", { name: "恢复" }).click();

  await page.getByRole("button", { name: "启用中" }).click();
  await page.getByLabel("类型").selectOption("all");
  await expect(page.locator("article").filter({ hasText: "Read Deep Work" })).toBeVisible();
});

test("closing an edit overlay returns focus to the triggering action", async ({ page }) => {
  const email = `habits-focus-${Date.now()}@example.com`;

  await signUpInBrowser(page, email, "Habit Focus User");
  await createFirstHabit(page, {
    name: "Morning walk",
  });

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

  await signUpInBrowser(page, email, "Habit Error User");
  await createFirstHabit(page, {
    name: "Morning walk",
  });

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

    await signUpInBrowser(page, email, "Habit Mobile User");
    await createFirstHabit(page, {
      name: "Morning walk",
    });

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

  test("mobile habit cards place actions below the metadata block", async ({ page }) => {
    const email = `habits-mobile-card-${Date.now()}@example.com`;

    await signUpInBrowser(page, email, "Habit Mobile Card User");
    await createFirstHabit(page, {
      name: "Morning walk",
    });

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

    const card = page.locator("article").filter({ hasText: "Read pages" });
    const metaBox = await card.getByTestId("habit-card-meta").boundingBox();
    const actionBox = await card.getByTestId("habit-card-actions").boundingBox();

    expect(metaBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect((actionBox?.y ?? 0) > (metaBox?.y ?? 0)).toBeTruthy();
  });
});
