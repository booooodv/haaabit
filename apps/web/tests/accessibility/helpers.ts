import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

export async function signUpInBrowser(page: Page, email: string, name = "Accessibility Browser User") {
  await page.goto("/");
  const result = await page.evaluate(
    async ({ nextEmail, nextName }) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch("http://127.0.0.1:3001/api/auth/sign-up/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
          password: "password123",
          name: nextName,
          timezone: timeZone,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as { user: { id: string } };
    },
    {
      nextEmail: email,
      nextName: name,
    },
  );

  expect(result.user.id).toBeTruthy();
  await page.goto("/habits/new");
}

export async function createFirstHabit(
  page: Page,
  input: {
    name?: string;
    startDate?: string;
  } = {},
) {
  await page.goto("/habits/new");
  await page.getByLabel("Habit name").fill(input.name ?? "Morning walk");

  if (input.startDate) {
    await page.getByLabel("Start date").fill(input.startDate);
  }

  await page.getByRole("button", { name: "Create first habit" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signUpAndCreateFirstHabit(page: Page, email: string, name = "Accessibility User") {
  await signUpInBrowser(page, email, name);
  await createFirstHabit(page);
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
