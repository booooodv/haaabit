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

test("dashboard keeps no-habits guidance in place instead of redirecting away", async ({ page }) => {
  const email = `dashboard-no-habits-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("No Habits User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

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

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Dashboard States User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Tomorrow walk");
  await page.getByLabel("Start date").fill(tomorrow);
  await page.getByRole("button", { name: "Create first habit" }).click();

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
  await page.getByTestId(`today-item-${habitIds["Today walk"]}`).getByRole("button", { name: "Complete" }).click();

  await expect(page.getByText("All done for today")).toBeVisible();
});

test("dashboard keeps recoverable load errors inside the route shell", async ({ page }) => {
  const email = `dashboard-error-${Date.now()}@example.com`;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Dashboard Error User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Start date").fill(yesterday);
  await page.getByRole("button", { name: "Create first habit" }).click();

  await page.goto("/dashboard?simulateTodayError=1&simulateOverviewError=1");

  await expect(page.getByTestId("dashboard-bootstrap-state")).toBeVisible();
  await expect(page.getByText("Dashboard needs another try")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry dashboard" })).toBeVisible();
});
