import { describe, expect, it } from "vitest";
import { parseReflectionContent } from "@/lib/ai/reflection-parser";

describe("parseReflectionContent", () => {
  const validReflection = {
    title: "会议里被跳过的方案",
    summary: "摘要",
    gentle_response: "回应",
    emotional_root: "根源",
    underlying_needs: ["被看见"],
    pattern: "模式",
    prescriptions: {
      film: ["电影"],
      book: ["书"],
      music: ["音乐"],
      action: ["行动"],
    },
    future_self_note: "给未来自己的话",
    compass_updates: [
      {
        relationship_type: "同事",
        nickname: "同事",
        closeness_score: 4,
        health_score: 3,
        joy_score: 2,
        tier: 3,
        relation_mode_tags: ["不平衡型"],
        common_triggers: ["贡献被忽略"],
        relationship_pattern_summary: "在工作关系里很在意被看见。",
        mbti_tendency: "偏 Fi，仅用于自我理解。",
        jungian_functions: [
          {
            code: "Fi",
            tendency: "重视真实感",
            evidence: "用户提到准备没有被看见",
            score: 4,
          },
        ],
        interaction_guide: "用事实表达贡献和请求。",
      },
    ],
    safety_note: null,
  };

  it("parses valid JSON content", () => {
    expect(parseReflectionContent(JSON.stringify(validReflection)).title).toBe("会议里被跳过的方案");
  });

  it("parses JSON wrapped in markdown fences", () => {
    const content = `\`\`\`json\n${JSON.stringify(validReflection)}\n\`\`\``;
    expect(parseReflectionContent(content).underlying_needs).toEqual(["被看见"]);
  });

  it("keeps MBTI and Jungian function details for compass updates", () => {
    const parsed = parseReflectionContent(JSON.stringify(validReflection));

    expect(parsed.compass_updates[0].closeness_score).toBe(4);
    expect(parsed.compass_updates[0].health_score).toBe(3);
    expect(parsed.compass_updates[0].joy_score).toBe(2);
    expect(parsed.compass_updates[0].tier).toBe(3);
    expect(parsed.compass_updates[0].relation_mode_tags).toEqual(["不平衡型"]);
    expect(parsed.compass_updates[0].jungian_functions[0].code).toBe("Fi");
  });

  it("throws a stable error for invalid model output", () => {
    expect(() => parseReflectionContent("not json")).toThrow("AI_RESPONSE_INVALID_JSON");
  });
});
