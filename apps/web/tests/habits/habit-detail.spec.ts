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

test("habit detail supports list entry, direct link, and close back to the habits surface", async ({ page }) => {
  const email = `habit-detail-${Date.now()}@example.com`;

  await signUpInBrowser(page, email, "Detail User");
  await createFirstHabit(page, {
    name: "Morning walk",
  });

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
  await page.getByTestId("locale-switch-button").click();
  const readCard = page.locator("article").filter({ hasText: "Read pages" });
  await readCard.getByRole("button", { name: "查看详情" }).click();

  await expect(page).toHaveURL(/\/habits$/);
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByTestId("habit-detail-summary")).toBeVisible();
  await expect(page.getByText("当前连续完成")).toBeVisible();
  await expect(page.getByText("近期历史")).toBeVisible();

  const summaryBox = await page.getByTestId("habit-detail-summary").boundingBox();
  const trendsHeadingBox = await page.getByRole("heading", { name: "近期趋势" }).boundingBox();
  const historyHeadingBox = await page.getByRole("heading", { name: "近期历史" }).boundingBox();

  expect(summaryBox).not.toBeNull();
  expect(trendsHeadingBox).not.toBeNull();
  expect(historyHeadingBox).not.toBeNull();
  expect((summaryBox?.y ?? 0) < (trendsHeadingBox?.y ?? 0)).toBeTruthy();
  expect((trendsHeadingBox?.y ?? 0) < (historyHeadingBox?.y ?? 0)).toBeTruthy();

  await page.getByRole("button", { name: "关闭" }).click();
  await expect(page).toHaveURL(/\/habits$/);

  await page.goto(`/habits/${created.item.id}`);
  await expect(page.getByTestId("habit-detail-overlay").getByRole("heading", { name: "Read pages" })).toBeVisible();
  await expect(page.getByText("累计完成次数")).toBeVisible();
});

test.describe("mobile habit detail", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("habit detail becomes a near-fullscreen mobile panel with vertically stacked stats", async ({
    page,
  }) => {
    const email = `habit-detail-mobile-${Date.now()}@example.com`;

    await signUpInBrowser(page, email, "Detail Mobile User");
    await createFirstHabit(page, {
      name: "Morning walk",
    });

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
