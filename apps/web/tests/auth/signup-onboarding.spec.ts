import { expect, test } from "@playwright/test";

test("signed-in user can reach dashboard after creating the first habit", async ({ page }) => {
  const email = `new-user-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/");
  await expect(page.getByText("Stored on the deployment you control")).toBeVisible();
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByLabel("Name").fill("New User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByTestId("locale-switch").getByRole("button", { name: "中文" }).click();

  await expect(page.getByText("账户已经就绪。现在先加一个清晰的习惯")).toBeVisible();
  await expect(page.getByText("分类、目标值和排期模式之后都还能继续细化。")).toBeVisible();
  await page.getByLabel("习惯名称").fill("Morning walk");
  await page.getByLabel("开始日期").fill(startDate);
  await page.getByRole("button", { name: "创建第一个习惯" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("dashboard-overview")).toBeVisible();
  await expect(page.getByTestId("today-dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "今天" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "概览" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Morning walk" })).toBeVisible();
});
