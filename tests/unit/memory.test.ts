import { describe, expect, it } from "vitest";
import { buildMemoryContext, rankRelevantMemories } from "@/lib/memory/context";
import { buildMemoryEventsFromReflection, mergeMemoryProfile } from "@/lib/memory/persistence";
import type { UserMemoryEvent, UserMemoryProfile } from "@/lib/memory/types";

const baseMemory: UserMemoryEvent = {
  id: "memory-1",
  content: "用户在同事关系里容易担心尴尬，并反复预演后果。",
  created_at: "2026-06-01T10:00:00.000Z",
  emotion_tags: ["委屈", "焦虑"],
  keywords: ["同事", "尴尬", "预演"],
  memory_type: "pattern",
  related_person: "同事",
  title: "同事关系里的尴尬预演",
};

describe("user memory helpers", () => {
  it("ranks memories related to the current event first", () => {
    const ranked = rankRelevantMemories(
      {
        emotionTags: ["委屈"],
        eventText: "今天同事又很快跳过了我的方案，我担心之后见面会尴尬。",
        relatedPerson: "同事",
      },
      [
        {
          ...baseMemory,
          id: "unrelated",
          content: "用户喜欢在独处时听安静的音乐。",
          emotion_tags: ["平静"],
          keywords: ["音乐", "独处"],
          related_person: null,
          title: "独处偏好",
        },
        baseMemory,
      ],
    );

    expect(ranked[0].id).toBe("memory-1");
  });

  it("builds a gentle memory context without personality diagnosis", () => {
    const profile: UserMemoryProfile = {
      caution_notes: ["不要把一次犹豫直接解释成人格问题。"],
      common_triggers: ["被忽视"],
      core_needs: ["被认真看见"],
      recurring_patterns: ["关系不确定时容易提前预演后果"],
      support_style: "温柔但直接",
    };

    const context = buildMemoryContext({
      memories: [baseMemory],
      profile,
    });

    expect(context).toContain("可参考的长期记忆");
    expect(context).toContain("请用假设性语言");
    expect(context).toContain("同事关系里的尴尬预演");
    expect(context).not.toContain("诊断");
  });

  it("returns an empty-safe context when no memory exists", () => {
    expect(buildMemoryContext({ memories: [], profile: null })).toBe("暂无可参考的长期记忆。");
  });

  it("builds bounded memory events from a saved reflection", () => {
    const events = buildMemoryEventsFromReflection({
      emotionTags: ["委屈"],
      eventText: "会议里我准备很久的方案被同事很快跳过。",
      reflection: {
        emotional_root: "真正刺痛的是准备没有被认真看见。",
        pattern: "在工作关系里容易把一次被忽略提前推演成长期不被重视。",
        underlying_needs: ["被看见", "被尊重"],
        compass_updates: [
          {
            closeness_score: 3,
            health_score: 2,
            joy_score: 2,
            relation_mode_tags: ["不平衡型"],
            tier: 3,
            common_triggers: ["贡献被忽略"],
            interaction_guide: "先用事实表达自己的贡献。",
            nickname: "同事",
            relationship_pattern_summary: "同事关系里在意被认真看见。",
            relationship_type: "同事",
          },
        ],
      },
      recordId: "record-1",
      relatedPerson: "同事",
      userId: "user-1",
    });

    expect(events.map((event) => event.memory_type)).toContain("need");
    expect(events.map((event) => event.memory_type)).toContain("pattern");
    expect(events.map((event) => event.memory_type)).toContain("trigger");
    const relationshipMemory = events.find((event) => event.memory_type === "person");
    expect(relationshipMemory?.content).toContain("健康度 2/5");
    expect(relationshipMemory?.content).toContain("愉悦度 2/5");
    expect(relationshipMemory?.content).toContain("关系温度");
    expect(events.every((event) => !event.content.includes("人格"))).toBe(true);
  });

  it("merges memory profile values without duplicates", () => {
    const merged = mergeMemoryProfile(
      {
        caution_notes: ["不要诊断"],
        common_triggers: ["被忽视"],
        core_needs: ["被看见"],
        recurring_patterns: ["提前预演"],
        support_style: "温柔但直接",
      },
      {
        caution_notes: ["不要诊断", "不要把一次事件上升成长期标签"],
        common_triggers: ["被忽视", "贡献被忽略"],
        core_needs: ["被看见", "安全感"],
        recurring_patterns: ["提前预演"],
        support_style: "温柔但直接",
      },
    );

    expect(merged.core_needs).toEqual(["被看见", "安全感"]);
    expect(merged.common_triggers).toEqual(["被忽视", "贡献被忽略"]);
    expect(merged.caution_notes).toContain("不要把一次事件上升成长期标签");
  });
});
