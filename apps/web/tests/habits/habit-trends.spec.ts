import { expect, test } from "@playwright/test";

import { createFirstHabit, signUpInBrowser } from "../accessibility/helpers";

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
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await signUpInBrowser(page, email, "Trend User");
  await createFirstHabit(page, {
    name: "Morning walk",
    startDate,
  });

  const created = await createHabitViaApi(page, {
    name: "Read pages",
    kind: "quantity",
    targetValue: 10,
    unit: "pages",
    category: "learning",
    startDate,
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
  await readCard.getByRole("button", { name: "View details" }).click();

  await expect(page).toHaveURL(/\/habits$/);
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent trends" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 7 days" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 30 days" })).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/habits$/);

  await page.goto(`/habits/${created.item.id}`);
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent trends" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 7 days" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Last 30 days" })).toBeVisible();
});
