import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { signUpAndCreateFirstHabit, signUpThroughApi } from "./helpers";

async function expectNoSeriousOrCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  const blockingViolations = results.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical",
  );

  expect(
    blockingViolations,
    blockingViolations.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
  ).toEqual([]);
}

test("auth shell has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("auth-shell")).toBeVisible();
  await expectNoSeriousOrCriticalViolations(page);
});

test("protected shell surfaces stay free of serious or critical accessibility violations", async ({
  page,
  request,
  context,
}) => {
  const email = `axe-api-${Date.now()}@example.com`;
  await signUpAndCreateFirstHabit(page, email);

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expectNoSeriousOrCriticalViolations(page);

  await page.goto("/habits");
  await expect(page.getByTestId("habits-page")).toBeVisible();
  await expectNoSeriousOrCriticalViolations(page);

  const apiEmail = `axe-token-${Date.now()}@example.com`;
  await signUpThroughApi(request, context, apiEmail, "Axe Token User");
  await page.goto("/api-access");
  await expect(page.getByTestId("api-access-panel")).toBeVisible();
  await expectNoSeriousOrCriticalViolations(page);
});
