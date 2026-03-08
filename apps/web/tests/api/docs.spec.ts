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

test("signed-in users can open english interactive api docs from api access", async ({ page, request, context }) => {
  const email = `api-docs-en-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "API Docs User");

  await page.goto("/api-access");
  await page.getByRole("button", { name: "Generate token" }).click();
  await expect(page.getByRole("heading", { name: "First call" })).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();
  await expect(page.getByText("GET /api/today")).toBeVisible();

  await page.getByRole("link", { name: "Open API docs" }).click();

  await expect(page).toHaveURL(/\/api\/docs$/, { timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Haaabit API" })).toBeVisible();
  await expect(page.getByText("This page follows your current app language.")).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();
  await expect(page.getByText("/api/openapi.json")).toBeVisible();
  await expect(page.locator("code").filter({ hasText: /^\/api\/habits$/ }).first()).toBeVisible();
});

test("signed-in users can open chinese interactive api docs while technical literals stay english", async ({
  page,
  request,
  context,
}) => {
  const email = `api-docs-zh-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "API Docs Chinese User");

  await page.goto("/api-access");
  await page.getByTestId("locale-switch").getByRole("button", { name: "中文" }).click();
  await page.getByRole("button", { name: "生成 token" }).click();
  await expect(page.getByRole("heading", { name: "第一条调用" })).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();

  await page.getByRole("link", { name: "打开 API 文档" }).click();

  await expect(page).toHaveURL(/\/api\/docs$/, { timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { name: "Haaabit API" })).toBeVisible();
  await expect(page.getByText("当前页面会跟随你在应用中的语言。")).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();
  await expect(page.getByText("/api/openapi.json")).toBeVisible();
  await expect(page.locator("code").filter({ hasText: /^\/api\/habits$/ }).first()).toBeVisible();
});
