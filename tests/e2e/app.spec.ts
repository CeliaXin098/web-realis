import { expect, test } from "@playwright/test";

test("home opens and shows primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "给今天的心事，留一间安静发光的房间。" })).toBeVisible();
  await expect(page.getByRole("link", { name: /AI觉察/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /记忆画廊/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /人际罗盘/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Change language" }).first()).toBeVisible();
});

test("home song card does not play mismatched placeholder audio when no source is available", async ({ page }) => {
  await page.addInitScript(() => {
    const mediaProto = HTMLMediaElement.prototype as HTMLMediaElement & { __mockPlaying?: boolean };

    mediaProto.play = function () {
      this.__mockPlaying = true;
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };

    mediaProto.pause = function () {
      this.__mockPlaying = false;
      this.dispatchEvent(new Event("pause"));
    };
  });

  await page.route("**/api/home/song-deck", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        activeTrackId: "empty-01",
        cards: [
          {
            kind: "player",
            track: {
              accent: "#ff8b6b",
              artist: "静音歌手",
              audioUrl: "",
              bars: [40, 60, 80],
              code: "T - 01",
              frequency: "44.1 kHz",
              id: "empty-01",
              isPlayable: false,
              mood: "quiet",
              sourceLabel: "NetEase Music",
              sourceUrl: "https://music.163.com/",
              subtitle: "No source in this mocked state.",
              time: "03:00",
              title: "暂时无音源",
            },
          },
          {
            kind: "rust",
            track: {
              accent: "#d78c73",
              artist: "静音歌手",
              audioUrl: "",
              bars: [50, 70, 45],
              code: "T - 02",
              frequency: "44.1 kHz",
              id: "empty-02",
              isPlayable: false,
              mood: "quiet",
              sourceLabel: "NetEase Music",
              sourceUrl: "https://music.163.com/",
              subtitle: "No source in this mocked state.",
              time: "03:00",
              title: "也暂时无音源",
            },
          },
          {
            kind: "receipt",
            track: {
              accent: "#889e9a",
              artist: "静音歌手",
              audioUrl: "",
              bars: [45, 55, 65],
              code: "T - 03",
              frequency: "44.1 kHz",
              id: "empty-03",
              isPlayable: false,
              mood: "quiet",
              sourceLabel: "NetEase Music",
              sourceUrl: "https://music.163.com/",
              subtitle: "No source in this mocked state.",
              time: "03:00",
              title: "仍暂时无音源",
            },
          },
        ],
      },
    });
  });

  await page.goto("/");

  const frontCard = page.getByTestId("home-front-card");
  const audio = page.getByTestId("home-audio");

  await expect
    .poll(async () => audio.evaluate((node) => node.getAttribute("src")))
    .toBeNull();

  await frontCard.click();
  await expect(page.getByTestId("home-audio-status")).toContainText("暂时不能播放");
  await expect(frontCard).toHaveAttribute("aria-pressed", "false");
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
  for (const code of ["Ni", "Ne", "Si", "Se", "Ti", "Te", "Fi", "Fe"]) {
    await expect(page.getByText(code, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "下一次可以这样相处" })).toBeVisible();
  await page.getByLabel("MBTI 手填").fill("INFJ");
  await page.getByRole("heading", { name: "荣格八维" }).click();
  await expect(page.getByText("已自动保存")).toBeVisible();
  await expect(page.getByRole("button", { name: "保存 MBTI" })).toHaveCount(0);
  await expect(page.getByText("提倡者 / Counselor")).toHaveCount(0);
  await expect(page.getByText("可选填写，离开输入框后自动保存。")).toHaveCount(0);
  await expect(page.getByText("整理关系地图")).toHaveCount(0);
  await expect(page.getByText("可自由拖动人物，整理属于你的关系地图。")).toHaveCount(0);
  await expect(page.getByText("关系维度")).toHaveCount(0);
  await expect(page.getByText("我和 TA 的关系说明")).toHaveCount(0);
});
