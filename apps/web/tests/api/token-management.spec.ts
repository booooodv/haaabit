import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

async function signUpThroughApi(request: APIRequestContext, context: BrowserContext, email: string, name: string) {
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

test("signed-in users can generate and view their personal api token", async ({ page, request, context }) => {
  const email = `api-access-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "API Access User");

  await page.goto("/api-access");

  await expect(page.getByTestId("api-access-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "API access" })).toBeVisible();
  await expect(page.getByText("No personal API token has been generated yet.")).toBeVisible();

  await page.getByRole("button", { name: "Generate token" }).click();

  const tokenField = page.getByLabel("Personal API token");
  await expect(tokenField).not.toHaveValue(/haaabit_/);
  await expect(page.getByText("Treat this token like a password.")).toBeVisible();
  await expect(page.getByText("Rotation invalidates the previous token immediately.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "First call" })).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open API docs" })).toBeVisible();

  await page.getByRole("button", { name: "Reveal token" }).click();
  await expect(tokenField).toHaveValue(/haaabit_/);

  const firstToken = await tokenField.inputValue();

  await page.getByRole("button", { name: "Copy token" }).click();
  await expect(page.getByTestId("api-access-feedback")).toContainText("Token copied");

  await page.getByRole("button", { name: "Rotate token" }).click();

  await expect(tokenField).not.toHaveValue(firstToken);
  await expect(tokenField).not.toHaveValue(/haaabit_/);

  await page.getByRole("button", { name: "Reveal token" }).click();
  await expect(tokenField).not.toHaveValue(firstToken);
  await expect(tokenField).toHaveValue(/haaabit_/);
});

test("api access keeps token rotation failures in context", async ({ page, request, context }) => {
  const email = `api-access-error-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "API Access Error User");

  await page.route("**/api/api-access/token/reset", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Token rotation failed",
      }),
    });
  });

  await page.goto("/api-access");
  await page.getByRole("button", { name: "Generate token" }).click();

  await expect(page.getByTestId("api-access-feedback")).toBeVisible();
  await expect(page.getByTestId("api-access-feedback")).toContainText("Unable to update API access");
  await expect(page.getByTestId("api-access-feedback")).toContainText("Token rotation failed");
});
