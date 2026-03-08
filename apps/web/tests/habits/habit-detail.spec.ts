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

test("habit detail supports list entry, direct link, and close back to the habits surface", async ({ page }) => {
  const email = `habit-detail-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Detail User");
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

  await page.goto("/habits");
  const readCard = page.locator("article").filter({ hasText: "Read pages" });
  await readCard.getByRole("link", { name: "View details" }).click();

  await expect(page).toHaveURL(new RegExp(`/habits/${created.item.id}$`));
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByText("Current streak")).toBeVisible();
  await expect(page.getByText("Recent history")).toBeVisible();

  await page.getByRole("link", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/habits$/);

  await page.goto(`/habits/${created.item.id}`);
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByText("Total completions")).toBeVisible();
});

test.describe("mobile habit detail", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("habit detail becomes a near-fullscreen mobile panel with vertically stacked stats", async ({
    page,
  }) => {
    const email = `habit-detail-mobile-${Date.now()}@example.com`;

    await page.goto("/");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByLabel("Name").fill("Detail Mobile User");
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

    await page.goto(`/habits/${created.item.id}`);

    const overlay = page.getByTestId("habit-detail-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.getByTestId("habit-detail-stats")).toBeVisible();

    const overlayBox = await overlay.boundingBox();
    const currentBox = await page.getByTestId("habit-detail-stat-current-streak").boundingBox();
    const longestBox = await page.getByTestId("habit-detail-stat-longest-streak").boundingBox();

    expect(overlayBox).not.toBeNull();
    expect((overlayBox?.width ?? 0) > 360).toBeTruthy();
    expect((overlayBox?.height ?? 0) > 760).toBeTruthy();
    expect((longestBox?.y ?? 0) > (currentBox?.y ?? 0)).toBeTruthy();
  });
});
