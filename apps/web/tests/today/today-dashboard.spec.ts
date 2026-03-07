import { expect, test } from "@playwright/test";

test("dashboard shows pending/completed groups and stays in sync through complete, set-total, and undo", async ({
  page,
}) => {
  const email = `today-user-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Name").fill("Today User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByLabel("Frequency").selectOption("daily");
  await page.getByRole("button", { name: "Save habit" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.evaluate(async () => {
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
        frequency: {
          type: "daily",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByText(/^2 pending$/)).toBeVisible();
  await expect(page.getByText(/^0 completed$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pending" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Completed" })).toBeVisible();

  const walkCard = page.getByTestId("today-item-Morning walk");
  const readCard = page.getByTestId("today-item-Read pages");

  await expect(walkCard).toContainText("Morning walk");
  await expect(readCard).toContainText("Read pages");
  await expect(readCard).toContainText("0 / 10 pages");

  await walkCard.getByRole("button", { name: "Complete" }).click();

  await expect(page.getByText(/^1 pending$/)).toBeVisible();
  await expect(page.getByText(/^1 completed$/)).toBeVisible();
  await expect(page.getByTestId("today-item-Morning walk")).toContainText("completed");
  await expect(page.getByTestId("today-item-Morning walk").getByRole("button", { name: "Undo" })).toBeVisible();

  await readCard.getByLabel("Today's total").fill("5");
  await readCard.getByRole("button", { name: "Save total" }).click();

  await expect(page.getByText("5 / 10 pages")).toBeVisible();
  await expect(page.getByText(/^1 pending$/)).toBeVisible();
  await expect(page.getByText(/^1 completed$/)).toBeVisible();

  await readCard.getByLabel("Today's total").fill("10");
  await readCard.getByRole("button", { name: "Save total" }).click();

  await expect(page.getByText(/^0 pending$/)).toBeVisible();
  await expect(page.getByText(/^2 completed$/)).toBeVisible();
  await expect(page.getByTestId("today-item-Read pages")).toContainText("completed");

  await page.getByTestId("today-item-Read pages").getByRole("button", { name: "Undo" }).click();

  await expect(page.getByText(/^1 pending$/)).toBeVisible();
  await expect(page.getByText(/^1 completed$/)).toBeVisible();
  await expect(page.getByText("5 / 10 pages")).toBeVisible();
});
