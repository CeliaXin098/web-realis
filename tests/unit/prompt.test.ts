import { describe, expect, it } from "vitest";
import { buildReflectionChatPrompt, buildReflectionPrompt } from "@/lib/ai/prompt";

const input = {
  eventText: "今天会议里，我准备很久的方案被很快跳过了。",
  emotionTags: ["委屈", "失落"],
  emotionIntensity: 7,
  relatedPerson: "同事",
  conversationMessages: [
    { role: "user" as const, content: "我觉得自己像不存在一样。" },
    { role: "assistant" as const, content: "那一刻你很需要被认真看见。" },
  ],
};

describe("AI prompt builders", () => {
  it("builds a final reflection prompt with conversation and personality contract", () => {
    const prompt = buildReflectionPrompt(input);

    expect(prompt).toContain("你是 Realis / 返照的 AI 觉察助手");
    expect(prompt).toContain(input.eventText);
    expect(prompt).toContain("委屈、失落");
    expect(prompt).toContain("7/10");
    expect(prompt).toContain("同事");
    expect(prompt).toContain("我觉得自己像不存在一样。");
    expect(prompt).toContain("closeness_score");
    expect(prompt).toContain("health_score");
    expect(prompt).toContain("joy_score");
    expect(prompt).toContain("relation_mode_tags");
    expect(prompt).toContain("jungian_functions");
    expect(prompt).toContain("reasoning_notes");
    expect(prompt).toContain("summary 必须忠实概括用户的具体事件与对话");
    expect(prompt).toContain("不能补写用户没有提到的事实");
    expect(prompt).toContain("推断依据");
    expect(prompt).toContain("推荐理由");
    expect(prompt).toContain("Ni, Ne, Si, Se, Ti, Te, Fi, Fe");
    expect(prompt).toContain("mbti_tendency 只能填写一个最可能的四字母 MBTI");
    expect(prompt).toContain("严格 JSON");
  });

  it("builds a conversational prompt that does not request JSON", () => {
    const prompt = buildReflectionChatPrompt(input);

    expect(prompt).toContain("AI 觉察陪伴者");
    expect(prompt).toContain("提出一个具体、轻量、能继续深入的问题");
    expect(prompt).toContain("不要输出 JSON");
  });

  it("injects long-term memory context when available", () => {
    const prompt = buildReflectionChatPrompt({
      ...input,
      memoryContext: "可参考的长期记忆：用户在同事关系里容易担心尴尬。",
    });

    expect(prompt).toContain("长期记忆");
    expect(prompt).toContain("用户在同事关系里容易担心尴尬");
    expect(prompt).toContain("不要机械复述");
  });
});
