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
  await expect(page.getByText("还没有记录", { exact: true })).toBeVisible();
  await page.getByLabel("具体事件").fill("今天会议里，我准备很久的方案被很快跳过了。");
  await page.getByRole("button", { name: "委屈" }).click();
  await page.getByLabel("相关人物").fill("同事");
  await expect(page.getByRole("button", { name: "伴侣" })).toBeVisible();
  await expect(page.getByRole("button", { name: "爸爸" })).toBeVisible();
  await expect(page.getByRole("button", { name: "儿子" })).toBeVisible();
  await expect(page.getByRole("button", { name: "女儿" })).toBeVisible();
  await expect(page.getByText("他（同事）")).toHaveCount(0);
  await page.getByRole("button", { name: "开始觉察" }).click();

  await expect(page.getByText(/我听见你在这件事里很委屈/)).toBeVisible();
  const conversationCard = page.getByTestId("conversation-card");
  await expect(conversationCard).toBeVisible();
  await expect(page.getByTestId("reflection-form-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "返回补充信息" })).toBeVisible();
  await expect(page.getByText("被理解", { exact: true })).toHaveCount(0);
  await expect(page.getByText("轻松自在", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "编辑" }).click();
  await expect(page.getByLabel("继续和 AI 说")).toHaveValue("今天会议里，我准备很久的方案被很快跳过了。");
  await page.getByRole("button", { name: "发送给 AI" }).click();
  await expect(page.getByText(/我听见你在这件事里很委屈/)).toBeVisible();
  await page.getByRole("button", { name: "沉淀为结果" }).click();
  await expect(page.getByRole("heading", { name: "会议里被跳过的方案" })).toBeVisible();
  await expect(page.getByRole("button", { name: "开始新一轮觉察" })).toBeVisible();

  await page.getByRole("button", { name: "保存到时光画廊" }).click();
  await expect(page.getByRole("button", { name: "已保存到时光画廊" })).toBeVisible();
  await page.getByRole("button", { name: "开始新一轮觉察" }).click();
  await expect(page.getByTestId("reflection-form-card")).toBeVisible();
  await expect(page.getByLabel("具体事件")).toHaveValue("");

  await page.goto("/gallery");
  await page.getByRole("button", { name: /会议里被跳过的方案/ }).click();
  await expect(page.getByText("今天会议里，我准备很久的方案被很快跳过了。").first()).toBeVisible();
  await expect(page.getByTestId("gallery-left-summary").getByText("AI 觉察总结")).toBeVisible();
  await expect(page.getByTestId("gallery-left-conversation").getByText("与 AI 的对话回看")).toBeVisible();
  await expect
    .poll(async () => {
      const [summary, conversation] = await Promise.all([
        page.getByTestId("gallery-left-summary").boundingBox(),
        page.getByTestId("gallery-left-conversation").boundingBox(),
      ]);
      return {
        leftDelta: Math.abs((summary?.x || 0) - (conversation?.x || 0)),
        widthDelta: Math.abs((summary?.width || 0) - (conversation?.width || 0)),
      };
    })
    .toEqual({ leftDelta: 0, widthDelta: 0 });
  await expect(page.getByTestId("gallery-detail-panel").getByText("AI 觉察总结")).toHaveCount(0);
  await expect(page.getByTestId("gallery-detail-panel").getByText("与 AI 的对话回看")).toHaveCount(0);
  await expect(page.getByText("强度等级 5/10")).toBeVisible();
  await expect(page.getByText(/我听见你在这件事里很委屈/)).toBeVisible();
});

test("AI reflection can return to preparation without losing the current event", async ({ page }) => {
  await page.goto("/reflect");
  await page.getByLabel("具体事件").fill("我今天突然觉得很累，想认真看看发生了什么。");
  await page.getByRole("button", { name: "开始觉察" }).click();

  await expect(page.getByRole("button", { name: "返回补充信息" })).toBeVisible();
  await page.getByRole("button", { name: "返回补充信息" }).click();
  await expect(page.getByLabel("具体事件")).toHaveValue("我今天突然觉得很累，想认真看看发生了什么。");
  await expect(page.getByTestId("reflection-form-card")).toBeVisible();
});

test("middle conversation composer grows and then scrolls while keeping actions visible", async ({ page }) => {
  await page.goto("/reflect");
  await page.getByLabel("具体事件").fill("今天发生了一件让我想继续说很多话的事情。");
  await page.getByRole("button", { name: "开始觉察" }).click();
  await expect(page.getByTestId("chat-composer")).toBeVisible();
  const composer = page.getByTestId("chat-composer");
  const initialHeight = await composer.evaluate((element) => element.getBoundingClientRect().height);

  await page.getByLabel("继续和 AI 说").fill(Array.from({ length: 30 }, (_, index) => `这是第${index + 1}行想说的话。`).join("\n"));

  await expect
    .poll(() => composer.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(initialHeight);
  await expect
    .poll(() => composer.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await expect(page.getByRole("button", { name: "语音输入" }).last()).toBeVisible();
  await expect(page.getByRole("button", { name: "发送给 AI" })).toBeVisible();
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
  await page.getByRole("button", { name: "我自己" }).click();
  await expect(page.getByRole("heading", { name: "外在的我，与内心的我" })).toBeVisible();
  await page.getByLabel("我的 MBTI").fill("ENFP");
  await page.getByRole("button", { name: "确认我的 MBTI" }).click();
  await expect(page.getByText("已保存为你的确认类型")).toBeVisible();
  await expect(page.getByText("常见内在冲突")).toBeVisible();
  await expect(page.getByText("照顾自己的建议")).toBeVisible();
});
