import { expect, test } from "@playwright/test";

async function listHabitIds(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const response = await fetch("http://127.0.0.1:3001/api/habits", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = (await response.json()) as { items: Array<{ id: string; name: string }> };
    return Object.fromEntries(result.items.map((item) => [item.name, item.id]));
  });
}

test("dashboard shows pending/completed groups and stays in sync through complete, set-total, and undo", async ({
  page,
}) => {
  const email = `today-user-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Name").fill("Today User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Start date").fill(startDate);
  await page.getByLabel("Frequency").selectOption("daily");
  await page.getByRole("button", { name: "Create first habit" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.evaluate(async ({ startDate: seededStartDate }) => {
    const response = await fetch("http://127.0.0.1:3001/api/habits", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Read pages",
        kind: "quantity",
        targetValue: 10,
        unit: "pages",
        startDate: seededStartDate,
        frequency: {
          type: "daily",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }, { startDate });

  const habitIds = await listHabitIds(page);

  await page.goto("/dashboard");
  await page.getByTestId("locale-switch").getByRole("button", { name: "中文" }).click();
  const todayDashboard = page
    .getByTestId("app-shell-content")
    .locator('section[data-testid="today-dashboard"]')
    .first();

  await expect(todayDashboard).toBeVisible();
  await expect(page.getByRole("heading", { name: "今天" })).toBeVisible();
  await expect(page.getByText(/^2 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^0 个已完成$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "待完成", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "已完成", exact: true })).toBeVisible();

  const walkCard = todayDashboard.getByTestId(`today-item-${habitIds["Morning walk"]}`);
  const readCard = todayDashboard.getByTestId(`today-item-${habitIds["Read pages"]}`);

  await expect(walkCard).toContainText("Morning walk");
  await expect(readCard).toContainText("Read pages");
  await expect(readCard).toContainText("0 / 10 pages");

  await walkCard.getByRole("button", { name: "完成" }).click();

  await expect(page.getByText(/^1 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^1 个已完成$/)).toBeVisible();
  await expect(walkCard).toContainText("已完成");
  await expect(walkCard).toContainText(
    "已标记完成。如有需要，你可以直接在这张卡片里撤销。",
  );
  await expect(
    walkCard.getByRole("button", { name: "撤销" }),
  ).toBeVisible();

  await readCard.getByLabel("今天总量").fill("5");
  await readCard.getByRole("button", { name: "更新总量" }).click();

  await expect(page.getByText("5 / 10 pages")).toBeVisible();
  await expect(page.getByText(/^1 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^1 个已完成$/)).toBeVisible();
  await expect(readCard).toContainText("已在当前位置保存，今天的数量已更新。");

  await readCard.getByLabel("今天总量").fill("10");
  await readCard.getByRole("button", { name: "更新总量" }).click();

  await expect(page.getByText(/^0 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^2 个已完成$/)).toBeVisible();
  await expect(readCard).toContainText("已完成");
  await expect(readCard).toContainText("已在当前位置保存，今天的数量已更新。");

  await readCard.getByRole("button", { name: "撤销" }).click();

  await expect(page.getByText(/^1 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^1 个已完成$/)).toBeVisible();
  await expect(page.getByText("5 / 10 pages")).toBeVisible();
  await expect(readCard).toContainText("已恢复到上一次保存的值。");
});

test("today action failures stay in context", async ({ page }) => {
  const email = `today-error-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Today Error User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.route("**/api/today/complete", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Unable to mark habit complete right now",
      }),
    });
  });

  const walkCard = page.locator("[data-testid^='today-item-']").first();
  await walkCard.getByRole("button", { name: "Complete" }).click();

  await expect(page.getByTestId("today-feedback")).toBeVisible();
  await expect(page.getByTestId("today-feedback")).toContainText("Today needs another try");
  await expect(page.getByTestId("today-feedback")).toContainText(
    "Unable to mark habit complete right now",
  );
  await expect(walkCard).toContainText("Unable to mark habit complete right now");
  await expect(page).toHaveURL(/\/dashboard$/);
});
