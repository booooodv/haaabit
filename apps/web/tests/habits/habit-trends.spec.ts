import { expect, test } from "@playwright/test";

async function createHabitViaApi(
  page: import("@playwright/test").Page,
  payload: Record<string, unknown>,
) {
  return page.evaluate(async (input) => {
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

    return (await response.json()) as { item: { id: string } };
  }, payload);
}

test("habit detail trends render from both list entry and direct-link detail routes", async ({ page }) => {
  const email = `habit-trends-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Trend User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();

  const created = await createHabitViaApi(page, {
    name: "Read pages",
    kind: "quantity",
    targetValue: 10,
    unit: "pages",
    category: "learning",
    frequency: {
      type: "daily",
    },
  });

  await page.evaluate(async (habitId) => {
    await fetch("http://127.0.0.1:3001/api/today/set-total", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        habitId,
        total: 10,
        source: "web",
      }),
    });
  }, created.item.id);

  await page.goto("/habits");
  const readCard = page.locator("article").filter({ hasText: "Read pages" });
  await readCard.getByRole("link", { name: "View details" }).click();

  await expect(page.locator("aside").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent trends" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 7 days" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 30 days" })).toBeVisible();

  await page.getByRole("link", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/habits$/);

  await page.goto(`/habits/${created.item.id}`);
  await expect(page.locator("aside").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent trends" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 7 days" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 30 days" })).toBeVisible();
});
