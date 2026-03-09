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

async function promoteSignedInUserToAdmin(request: APIRequestContext) {
  const response = await request.post("http://127.0.0.1:3001/api/test/session/promote-admin");

  expect(response.ok()).toBeTruthy();
}

async function setRegistrationEnabled(request: APIRequestContext, registrationEnabled: boolean) {
  const response = await request.post("http://127.0.0.1:3001/api/admin/registration", {
    data: {
      registrationEnabled,
    },
  });

  expect(response.ok()).toBeTruthy();
}

test("signed-in users can generate and view their personal api token", async ({ page, request, context }) => {
  const email = `api-access-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "API Access User");

  await page.goto("/api-access");
  await page.getByTestId("locale-switch-button").click();

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
  await expect(page.getByRole("button", { name: "复制 token" })).toBeEnabled();

  await page.getByRole("button", { name: "复制 token" }).click();
  await expect(page.getByTestId("api-access-feedback")).toContainText("token 已复制");

  const revealButton = page.getByRole("button", { name: "显示 token" });
  await revealButton.focus();
  await revealButton.press("Enter");
  await expect(tokenField).toHaveValue(/haaabit_/);
  await expect(page.getByRole("button", { name: "隐藏 token" })).toBeFocused();
  await expect(page.getByRole("button", { name: "复制 token" })).toBeEnabled();

  const firstToken = await tokenField.inputValue();

  await page.getByRole("button", { name: "复制 token" }).click();
  await expect(page.getByTestId("api-access-feedback")).toContainText("token 已复制");

  await page.reload();

  await expect(tokenField).not.toHaveValue(firstToken);
  await expect(tokenField).toHaveValue("已安全保存，如需原始值请轮换新的 token");
  await expect(page.getByRole("button", { name: "显示 token" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "复制 token" })).toHaveCount(0);
  await expect(page.getByText("token 已安全保存")).toBeVisible();
  await expect(page.getByText("原始 token 只会在生成或轮换后显示一次。")).toBeVisible();
  await expect(page.getByText(/上次轮换/)).toBeVisible();

  const rotateButton = page.getByRole("button", { name: "轮换 token" });
  await rotateButton.focus();
  let firstDialogMessage = "";
  page.once("dialog", (dialog) => {
    firstDialogMessage = dialog.message();
    void dialog.dismiss();
  });
  await rotateButton.click({ force: true });
  await expect.poll(() => firstDialogMessage).toContain("旧 token 会立即失效");

  await expect(tokenField).toHaveValue("已安全保存，如需原始值请轮换新的 token");

  let secondDialogMessage = "";
  page.once("dialog", (dialog) => {
    secondDialogMessage = dialog.message();
    void dialog.accept();
  });
  await rotateButton.click({ force: true });
  await expect.poll(() => secondDialogMessage).toContain("旧 token 会立即失效");

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

test("admin can close registration from api access and hide sign-up on the auth page", async ({
  page,
  request,
  context,
}) => {
  const email = `api-access-admin-${Date.now()}@example.com`;

  await signUpThroughApi(request, context, email, "Admin User");
  await promoteSignedInUserToAdmin(request);

  await page.goto("/api-access");
  await expect(page.getByRole("heading", { name: "Registration access" })).toBeVisible();
  await page.getByRole("button", { name: "Close registration" }).click();

  await context.clearCookies();
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0);

  await setRegistrationEnabled(request, true);
});
