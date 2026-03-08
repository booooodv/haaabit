import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

export async function signUpAndCreateFirstHabit(page: Page, email: string, name = "Accessibility User") {
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Habit name").fill("Morning walk");
  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signUpThroughApi(
  request: APIRequestContext,
  context: BrowserContext,
  email: string,
  name = "Accessibility API User",
) {
  const response = await request.post("http://127.0.0.1:3001/api/auth/sign-up/email", {
    data: {
      email,
      password: "password123",
      name,
    },
  });

  expect(response.ok()).toBeTruthy();

  const cookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => {
      const [cookiePair] = header.value.split(";");
      const separatorIndex = cookiePair.indexOf("=");

      return {
        name: cookiePair.slice(0, separatorIndex),
        value: cookiePair.slice(separatorIndex + 1),
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        sameSite: "Lax" as const,
      };
    });

  await context.addCookies(cookies);
}
