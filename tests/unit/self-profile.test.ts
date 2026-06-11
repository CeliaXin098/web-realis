import { describe, expect, it } from "vitest";
import {
  aggregateSelfJungianFunctions,
  extractMbtiType,
  formatMbtiLabel,
  mergeSelfProfileInsights,
} from "@/lib/relationship/self-profile";

describe("self profile helpers", () => {
  it("extracts only the first valid MBTI type from verbose AI text", () => {
    expect(extractMbtiType("可能倾向 INFP 或 INFJ，注重深层意义")).toBe("INFP");
    expect(extractMbtiType("暂时无法判断")).toBe("");
  });

  it("marks inferred MBTI while leaving confirmed MBTI unmarked", () => {
    expect(formatMbtiLabel("infp", "inferred")).toBe("INFP（推测）");
    expect(formatMbtiLabel("INFJ", "confirmed")).toBe("INFJ");
  });

  it("aggregates repeated Jungian function evidence by code", () => {
    const result = aggregateSelfJungianFunctions(
      [
        { code: "Fi", tendency: "重视个人价值", evidence: "第一次记录", score: 4 },
        { code: "Ne", tendency: "探索可能性", evidence: "第一次记录", score: 3 },
      ],
      [
        { code: "Fi", tendency: "在意内在一致", evidence: "第二次记录", score: 2 },
        { code: "Fe", tendency: "留意他人感受", evidence: "第二次记录", score: 4 },
      ],
    );

    expect(result.map((item) => item.code)).toEqual(["Fi", "Ne", "Fe"]);
    expect(result[0]).toMatchObject({
      code: "Fi",
      score: 3,
      tendency: "在意内在一致",
      evidence: "第二次记录",
    });
  });

  it("never overwrites a user-confirmed MBTI with an inferred value", () => {
    const merged = mergeSelfProfileInsights(
      {
        mbti_type: "INFJ",
        mbti_source: "confirmed",
        jungian_functions: [],
      },
      {
        mbti_type: "INFP",
        mbti_source: "inferred",
        jungian_functions: [{ code: "Fi", tendency: "重视个人价值", evidence: "新记录", score: 4 }],
      },
    );

    expect(merged.mbti_type).toBe("INFJ");
    expect(merged.mbti_source).toBe("confirmed");
    expect(merged.jungian_functions[0].code).toBe("Fi");
  });
});
