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

test("dashboard analytics stays above today and refreshes after today actions", async ({ page }) => {
  const email = `dashboard-analytics-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await signUpInBrowser(page, email, "Dashboard Analytics User");
  await createFirstHabit(page, {
    name: "Morning walk",
    startDate,
  });

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
  await expect(page.getByRole("heading", { name: "7-day completion rate" })).toBeVisible();
  await expect(
    page.getByTestId("overview-trend-chart").locator("[data-testid='completion-rate-chart-plot'] > div"),
  ).toHaveCount(7);
  const todayBox = await page.getByTestId("today-dashboard").boundingBox();
  const overviewBox = await page.getByTestId("dashboard-overview").boundingBox();
  expect(todayBox).not.toBeNull();
  expect(overviewBox).not.toBeNull();
  expect((todayBox?.y ?? 0) < (overviewBox?.y ?? 0)).toBeTruthy();
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("0");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("Morning walk");
  const idleBarHeight = await page
    .getByTestId("overview-trend-chart")
    .locator("[data-testid='completion-rate-chart-plot'] > div > div")
    .last()
    .evaluate((node) => Number.parseFloat(getComputedStyle(node).height));
  expect(idleBarHeight).toBeLessThanOrEqual(2);

  await page.getByTestId(`today-item-${habitIds["Morning walk"]}`).getByRole("button", { name: "Complete" }).click();

  await expect(page.getByText(/^1 pending$/)).toBeVisible();
  await expect(page.getByText(/^1 completed$/)).toBeVisible();
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("1");
  await expect(page.getByTestId("overview-metric-today-completed")).toContainText("50% of due habits");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("Morning walk");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("100%");
  await expect(page.getByTestId(`overview-ranking-item-${habitIds["Morning walk"]}`)).toContainText("1/1 recent due days");

  const firstBarStyles = await page
    .getByTestId("overview-trend-chart")
    .locator("[data-testid='completion-rate-chart-plot'] > div > div")
    .first()
    .evaluate((node) => {
      const styles = getComputedStyle(node);

      return {
        bottomLeft: styles.borderBottomLeftRadius,
        bottomRight: styles.borderBottomRightRadius,
      };
    });

  expect(firstBarStyles.bottomLeft).toBe("0px");
  expect(firstBarStyles.bottomRight).toBe("0px");
});

test.describe("mobile dashboard", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile dashboard keeps today above overview while compressing analytics into support content", async ({ page }) => {
    const email = `dashboard-mobile-${Date.now()}@example.com`;
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await signUpInBrowser(page, email, "Dashboard Mobile User");
    await createFirstHabit(page, {
      name: "Morning walk",
      startDate,
    });

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

    await page.goto("/dashboard");

    await expect(page.getByTestId("app-shell-mobile-nav")).toBeVisible();
    await expect(page.getByTestId("overview-metrics")).toBeVisible();
    await expect(
      page.getByTestId("overview-trend-chart").locator("[data-testid='completion-rate-chart-plot'] > div"),
    ).toHaveCount(7);

    const todayBox = await page.getByTestId("today-dashboard").boundingBox();
    const overviewBox = await page.getByTestId("dashboard-overview").boundingBox();

    expect(overviewBox).not.toBeNull();
    expect(todayBox).not.toBeNull();
    expect((todayBox?.y ?? 0) < (overviewBox?.y ?? 0)).toBeTruthy();
    expect((overviewBox?.height ?? 0) < (todayBox?.height ?? Number.POSITIVE_INFINITY)).toBeTruthy();

    const chartFits = await page.getByTestId("overview-trend-chart").evaluate((element) => {
      const plot = element.querySelector("[data-testid='completion-rate-chart-plot']");
      if (!(plot instanceof HTMLElement) || !(element instanceof HTMLElement)) {
        return false;
      }

      return plot.scrollWidth <= element.clientWidth;
    });

    expect(chartFits).toBeTruthy();
  });
});
