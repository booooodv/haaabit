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

test("dashboard keeps no-habits guidance in place instead of redirecting away", async ({ page }) => {
  const email = `dashboard-no-habits-${Date.now()}@example.com`;

  await signUpInBrowser(page, email, "No Habits User");

  await expect(page).toHaveURL(/\/habits\/new$/);

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create first habit" })).toBeVisible();
});

test("dashboard distinguishes nothing due today from all done", async ({ page }) => {
  const email = `dashboard-states-${Date.now()}@example.com`;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await signUpInBrowser(page, email, "Dashboard States User");
  await createFirstHabit(page, {
    name: "Tomorrow walk",
    startDate: tomorrow,
  });

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Nothing due today")).toBeVisible();

  await createHabitViaApi(page, {
    name: "Today walk",
    kind: "boolean",
    startDate: yesterday,
    frequency: {
      type: "daily",
    },
  });

  const habitIds = await listHabitIds(page);
  await page.goto("/dashboard");
  await page.getByTestId("locale-switch-button").click();

  await expect(page.getByRole("heading", { name: "今天" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "概览" })).toBeVisible();
  await expect(page.getByText(/^1 个待完成$/)).toBeVisible();
  await expect(page.getByText(/^0 个已完成$/)).toBeVisible();

  await page.getByTestId(`today-item-${habitIds["Today walk"]}`).getByRole("button", { name: "完成" }).click();

  await expect(page.getByText("今天已全部完成")).toBeVisible();
});

test("dashboard keeps recoverable load errors inside the route shell", async ({ page }) => {
  const email = `dashboard-error-${Date.now()}@example.com`;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await signUpInBrowser(page, email, "Dashboard Error User");
  await createFirstHabit(page, {
    name: "Morning walk",
    startDate: yesterday,
  });

  await page.goto("/dashboard?simulateTodayError=1&simulateOverviewError=1");

  await expect(page.getByTestId("dashboard-bootstrap-state")).toBeVisible();
  await expect(page.getByText("Dashboard needs another try")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry dashboard" })).toBeVisible();
});
