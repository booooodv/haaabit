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

test("dashboard analytics stays above today and refreshes after today actions", async ({ page }) => {
  const email = `dashboard-analytics-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Dashboard Analytics User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Start date").fill(startDate);
  await page.getByRole("button", { name: "Create first habit" }).click();

  await createHabitViaApi(page, {
    name: "Read pages",
    kind: "quantity",
    targetValue: 10,
    unit: "pages",
    startDate,
    frequency: {
      type: "daily",
    },
  });

  const habitIds = await listHabitIds(page);

  await page.goto("/dashboard");

  await expect(page.getByTestId("today-dashboard")).toBeVisible();
  await expect(page.locator("h1").first()).toHaveText("Analytics");
  await expect(page.locator("h1").nth(1)).toHaveText("Today");
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("0");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("Morning walk");

  await page.getByTestId(`today-item-${habitIds["Morning walk"]}`).getByRole("button", { name: "Complete" }).click();

  await expect(page.getByText(/^1 pending$/)).toBeVisible();
  await expect(page.getByText(/^1 completed$/)).toBeVisible();
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("1");
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("50% of due habits");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("Morning walk");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("50%");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("1/2 recent due days");
});
