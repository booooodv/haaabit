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
  await page.getByTestId("locale-switch").getByRole("button", { name: "中文" }).click();

  await expect(page.getByTestId("api-access-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "API 访问" })).toBeVisible();
  await expect(page.getByText("当前还没有生成个人 API token。")).toBeVisible();

  await page.getByRole("button", { name: "生成 token" }).click();

  const tokenField = page.getByLabel("个人 API token");
  await expect(tokenField).not.toHaveValue(/haaabit_/);
  await expect(page.getByText("请像保管密码一样保管这个 token。")).toBeVisible();
  await expect(page.getByText("轮换后，旧 token 会立即失效。")).toBeVisible();
  await expect(page.getByRole("heading", { name: "第一条调用" })).toBeVisible();
  await expect(page.getByText("Authorization: Bearer")).toBeVisible();
  await expect(page.getByRole("link", { name: "打开 API 文档" })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制 token" })).toBeDisabled();

  const revealButton = page.getByRole("button", { name: "显示 token" });
  await revealButton.focus();
  await revealButton.press("Enter");
  await expect(tokenField).toHaveValue(/haaabit_/);
  await expect(page.getByRole("button", { name: "隐藏 token" })).toBeFocused();
  await expect(page.getByRole("button", { name: "复制 token" })).toBeEnabled();

  const firstToken = await tokenField.inputValue();

  await page.getByRole("button", { name: "复制 token" }).click();
  await expect(page.getByTestId("api-access-feedback")).toContainText("token 已复制");

  const rotateButton = page.getByRole("button", { name: "轮换 token" });
  await rotateButton.focus();
  await rotateButton.press("Enter");

  await expect(tokenField).not.toHaveValue(firstToken);
  await expect(tokenField).not.toHaveValue(/haaabit_/);
  await expect(rotateButton).toBeFocused();

  await page.getByRole("button", { name: "显示 token" }).click();
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
