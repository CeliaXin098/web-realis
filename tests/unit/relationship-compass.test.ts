import { describe, expect, it } from "vitest";
import {
  classifyQuadrant,
  getQuadrantCopy,
  inferRelationModeTags,
  mapClosenessToTier,
  normalizeCompassProfile,
  normalizeRelationType,
  normalizeScore,
} from "@/lib/relationship/compass";

describe("relationship compass logic", () => {
  it("normalizes score values into the 1-5 range", () => {
    expect(normalizeScore(undefined, 4)).toBe(4);
    expect(normalizeScore(null, 2)).toBe(2);
    expect(normalizeScore(0, 3)).toBe(1);
    expect(normalizeScore(6, 3)).toBe(5);
    expect(normalizeScore(3.6, 3)).toBe(4);
    expect(normalizeScore(Number.NaN, 3)).toBe(3);
  });

  it("classifies the four health and joy quadrants", () => {
    expect(classifyQuadrant(4, 4)).toBe("q1");
    expect(classifyQuadrant(4, 2)).toBe("q2");
    expect(classifyQuadrant(2, 4)).toBe("q3");
    expect(classifyQuadrant(2, 2)).toBe("q4");
  });

  it("returns Chinese quadrant copy", () => {
    expect(getQuadrantCopy("q1")).toEqual({
      title: "滋养关系",
      description: "健康且愉悦，适合继续投入与珍惜。",
    });
    expect(getQuadrantCopy("q2").title).toBe("稳固但费力");
    expect(getQuadrantCopy("q3").title).toBe("上头但消耗");
    expect(getQuadrantCopy("q4").title).toBe("需要边界");
  });

  it("maps closeness score to Tier with closer people getting smaller Tier numbers", () => {
    expect(mapClosenessToTier(5)).toBe(1);
    expect(mapClosenessToTier(4)).toBe(2);
    expect(mapClosenessToTier(3)).toBe(3);
    expect(mapClosenessToTier(2)).toBe(4);
    expect(mapClosenessToTier(1)).toBe(4);
  });

  it("normalizes Chinese relationship labels into supported relation types", () => {
    expect(normalizeRelationType("多年朋友")).toBe("朋友");
    expect(normalizeRelationType("工作同事")).toBe("同事");
    expect(normalizeRelationType("亲密伴侣")).toBe("伴侣");
    expect(normalizeRelationType("家人妈妈")).toBe("家人");
    expect(normalizeRelationType("普通熟人")).toBe("熟人");
    expect(normalizeRelationType("网友")).toBe("其他");
  });

  it("infers up to three relationship mode tags from profile and event text", () => {
    expect(
      inferRelationModeTags({
        relationship_type: "朋友",
        relationship_pattern_summary:
          "我们经常很开心，但也会互相比较，偶尔有隐性竞争，而且总是我主动",
        common_triggers: ["被忽视", "比较"],
        eventsText:
          "每次聚会都很热闹，但结束后我会感觉自己在表演，也会有一点不平衡",
      }),
    ).toEqual(["不主动提问型", "表演型关系", "亦敌亦友型"]);
  });

  it("uses stored relation mode tags when they are already present", () => {
    expect(
      inferRelationModeTags({
        relationship_type: "同事",
        relationship_pattern_summary: "需要承担责任和人情，也不能单独相处",
        common_triggers: ["社媒点赞"],
      }),
    ).toEqual(["无法单独相处型", "双重义务型", "社媒名人型"]);
  });

  it("normalizes a partial profile into renderable compass values", () => {
    const normalized = normalizeCompassProfile({
      id: "p1",
      relationship_type: "朋友",
      nickname: "小林",
      related_record_count: 2,
      common_triggers: ["被忽视"],
      relationship_pattern_summary: "很支持我，但最近联系变少",
      mbti_tendency: "",
      closeness_score: 4,
      interaction_guide: "下次直接说需求",
    });

    expect(normalized).toMatchObject({
      id: "p1",
      relationType: "朋友",
      healthScore: 4,
      joyScore: 3,
      tier: 2,
      quadrant: "q1",
    });
    expect(normalized.relationModeTags).toEqual([]);
  });

  it("normalizes stored scores, tier, and mode tags on a complete profile", () => {
    const normalized = normalizeCompassProfile({
      id: "p2",
      relationship_type: "恋人",
      nickname: "阿南",
      related_record_count: 5,
      common_triggers: ["边界模糊"],
      relationship_pattern_summary: "像伴侣一样依赖，但最近很疲惫",
      mbti_tendency: "Fi",
      closeness_score: 5,
      health_score: 1.2,
      joy_score: 6,
      tier: 7,
      relation_mode_tags: ["半伴侣型", "未知标签"],
      interaction_guide: "先确认边界",
    });

    expect(normalized.relationType).toBe("伴侣");
    expect(normalized.healthScore).toBe(1);
    expect(normalized.joyScore).toBe(5);
    expect(normalized.tier).toBe(4);
    expect(normalized.quadrant).toBe("q3");
    expect(normalized.relationModeTags).toEqual(["半伴侣型"]);
  });

  it("treats stored database defaults without tags as uninferred values", () => {
    const normalized = normalizeCompassProfile({
      id: "p3",
      relationship_type: "同事",
      nickname: "同事",
      related_record_count: 1,
      common_triggers: ["压力"],
      relationship_pattern_summary: "这段关系让我很疲惫，也有明显消耗。",
      mbti_tendency: "",
      closeness_score: 5,
      health_score: 3,
      joy_score: 3,
      tier: 3,
      relation_mode_tags: [],
      interaction_guide: "先保持边界。",
    });

    expect(normalized.healthScore).toBe(2);
    expect(normalized.joyScore).toBe(2);
    expect(normalized.tier).toBe(1);
    expect(normalized.quadrant).toBe("q4");
  });
});
