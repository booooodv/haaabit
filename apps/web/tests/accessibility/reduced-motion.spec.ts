import { expect, test } from "@playwright/test";

import { signUpAndCreateFirstHabit } from "./helpers";

function parseDurationSeconds(raw: string) {
  const first = raw.split(",")[0]?.trim() ?? "0s";

  if (first.endsWith("ms")) {
    return Number.parseFloat(first.slice(0, -2)) / 1000;
  }

  if (first.endsWith("s")) {
    return Number.parseFloat(first.slice(0, -1));
  }

  return Number.NaN;
}

test("reduced-motion mode flattens overlay and shell transition timing", async ({ page }) => {
  const email = `reduced-motion-${Date.now()}@example.com`;

  await page.emulateMedia({ reducedMotion: "reduce" });
  await signUpAndCreateFirstHabit(page, email, "Reduced Motion User");

  const habitsLink = page.getByTestId("app-shell-primary-nav").getByRole("link", { name: "Habits" });
  const navTransitionDuration = await habitsLink.evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(parseDurationSeconds(navTransitionDuration)).toBeLessThanOrEqual(0.00001);

  await habitsLink.click();
  const editButton = page.locator("article").filter({ hasText: "Morning walk" }).getByRole("button", { name: "Edit" });
  await editButton.click();

  const overlay = page.getByTestId("habit-form-overlay");
  await expect(overlay).toBeVisible();

  const overlayAnimationDuration = await overlay.evaluate((node) => getComputedStyle(node).animationDuration);
  expect(parseDurationSeconds(overlayAnimationDuration)).toBeLessThanOrEqual(0.00001);
});
