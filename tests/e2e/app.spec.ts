import { expect, test } from "@playwright/test";

test("home opens and shows primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /写给今天情绪的一间安静房间/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /AI觉察/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /记忆画廊/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /人际罗盘/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Change language" })).toBeVisible();
});

test("unauthenticated /generate redirects to login", async ({ page }) => {
  await page.goto("/generate");
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByRole("heading", { name: "登录 Realis" })).toBeVisible();
});

test("AI reflection discusses, generates a letter, and can save to gallery", async ({ page }) => {
  await page.goto("/reflect");
  await page.getByLabel("具体事件").fill("今天会议里，我准备很久的方案被很快跳过了。");
  await page.getByRole("button", { name: "委屈" }).click();
  await page.getByLabel("相关人物").fill("同事");
  await page.getByRole("button", { name: "开始觉察" }).click();

  await expect(page.getByText(/我听见你在这件事里很委屈/)).toBeVisible();
  await page.getByRole("button", { name: "沉淀为结果" }).click();
  await expect(page.getByRole("heading", { name: "会议里被跳过的方案" })).toBeVisible();

  await page.getByRole("button", { name: "保存到时光画廊" }).click();
  await expect(page.getByRole("button", { name: "已保存到时光画廊" })).toBeVisible();

  await page.goto("/gallery");
  await page.getByRole("button", { name: /会议里被跳过的方案/ }).click();
  await expect(page.getByText("今天会议里，我准备很久的方案被很快跳过了。")).toBeVisible();
});

test("memory gallery and relationship compass render in E2E mode", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.getByText("记忆馆藏")).toBeVisible();

  await page.goto("/compass");
  await expect(page.getByRole("heading", { name: "人际罗盘" })).toBeVisible();
  await expect(page.getByText("MBTI 与荣格八维只用于自我理解")).toBeVisible();
  await expect(page.getByText("Tier 3 · 滋养关系 · 健康 3/5 · 愉悦 3/5")).toBeVisible();
  await expect(page.getByText("关系模式标签")).toBeVisible();
  await expect(page.getByText("还在观察中")).toBeVisible();
  await expect(page.getByRole("heading", { name: "荣格八维" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "下一次可以这样相处" })).toBeVisible();
  await page.getByLabel("MBTI 手填").fill("INFJ");
  await page.getByRole("button", { name: "保存 MBTI" }).click();
  await expect(page.getByRole("button", { name: "已保存" })).toBeVisible();
});
