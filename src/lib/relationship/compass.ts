import type { JungianFunctionInsight } from "@/lib/records/types";

export type RelationType = "朋友" | "同事" | "伴侣" | "家人" | "熟人" | "其他";
export type QuadrantId = "q1" | "q2" | "q3" | "q4";
export type RelationModeTag =
  | "不主动提问型"
  | "无法单独相处型"
  | "表演型关系"
  | "双重义务型"
  | "半伴侣型"
  | "历史型关系"
  | "非平行人生型"
  | "亦敌亦友型"
  | "社媒名人型"
  | "不平衡型";

export type RawCompassProfile = {
  id: string;
  relationship_type: string;
  nickname: string;
  related_record_count: number;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  mbti_source?: "inferred" | "confirmed";
  jungian_functions?: JungianFunctionInsight[];
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  position_x?: number | null;
  position_y?: number | null;
  relation_label?: string | null;
  interaction_guide: string;
};

export type NormalizedCompassProfile = RawCompassProfile & {
  relationType: RelationType;
  healthScore: number;
  joyScore: number;
  tier: 1 | 2 | 3 | 4;
  quadrant: QuadrantId;
  relationModeTags: RelationModeTag[];
};

export type RelationshipWeatherSummary = {
  temperature: number;
  label: string;
  description: string;
  profileCount: number;
};

const RELATION_MODE_TAGS = [
  "不主动提问型",
  "无法单独相处型",
  "表演型关系",
  "双重义务型",
  "半伴侣型",
  "历史型关系",
  "非平行人生型",
  "亦敌亦友型",
  "社媒名人型",
  "不平衡型",
] satisfies RelationModeTag[];

export function normalizeScore(value: number | null | undefined, fallback: number) {
  const next = Number.isFinite(value) ? Number(value) : fallback;
  return Math.min(5, Math.max(1, Math.round(next)));
}

export function classifyQuadrant(healthScore: number, joyScore: number): QuadrantId {
  if (healthScore >= 3 && joyScore >= 3) return "q1";
  if (healthScore >= 3 && joyScore < 3) return "q2";
  if (healthScore < 3 && joyScore >= 3) return "q3";
  return "q4";
}

export function getQuadrantCopy(id: QuadrantId) {
  const copy = {
    q1: { title: "滋养关系", description: "健康且愉悦，适合继续投入与珍惜。" },
    q2: { title: "稳固但费力", description: "关系基础健康，但相处需要更多松弛感。" },
    q3: { title: "上头但消耗", description: "相处有吸引力，也需要留意边界和代价。" },
    q4: { title: "需要边界", description: "当前既不滋养也不轻松，适合降频或重设边界。" },
  } satisfies Record<QuadrantId, { title: string; description: string }>;

  return copy[id];
}

export function mapClosenessToTier(closenessScore: number | null | undefined): 1 | 2 | 3 | 4 {
  const score = normalizeScore(closenessScore, 3);
  if (score >= 5) return 1;
  if (score >= 4) return 2;
  if (score >= 3) return 3;
  return 4;
}

export function normalizeRelationType(value: string): RelationType {
  if (/朋友|友人|闺蜜|兄弟|姐妹/.test(value)) return "朋友";
  if (/同事|工作|上司|下属|客户/.test(value)) return "同事";
  if (/伴侣|恋人|夫妻|爱人/.test(value)) return "伴侣";
  if (/父|母|家人|亲人|孩子|姐姐|妹妹|哥哥|弟弟/.test(value)) return "家人";
  if (/熟人|邻居|同学|普通/.test(value)) return "熟人";
  return "其他";
}

export function inferRelationModeTags(input: {
  relationship_type: string;
  relationship_pattern_summary: string;
  common_triggers: string[];
  eventsText?: string;
}): RelationModeTag[] {
  const text = `${input.relationship_type} ${input.relationship_pattern_summary} ${input.common_triggers.join(" ")} ${input.eventsText || ""}`;
  const tags: RelationModeTag[] = [];

  if (/不问|不主动|总是我问|总是我主动|没有回应/.test(text)) tags.push("不主动提问型");
  if (/不能单独|无法单独|必须很多人|尴尬|冷场/.test(text)) tags.push("无法单独相处型");
  if (/表演|热闹|人设|装作|维持气氛/.test(text)) tags.push("表演型关系");
  if (/应该|不得不|义务|责任|人情/.test(text)) tags.push("双重义务型");
  if (/像伴侣|依赖|占有|暧昧|边界模糊/.test(text)) tags.push("半伴侣型");
  if (/以前|多年|老朋友|历史|从小/.test(text)) tags.push("历史型关系");
  if (/不同阶段|不同城市|道路不同|节奏不同/.test(text)) tags.push("非平行人生型");
  if (/竞争|比较|嫉妒|塑料|互相刺痛/.test(text)) tags.push("亦敌亦友型");
  if (/社媒|朋友圈|关注|点赞|网上/.test(text)) tags.push("社媒名人型");
  if (/总是我|单方面|不平衡|付出更多/.test(text)) tags.push("不平衡型");

  return tags.slice(0, 3);
}

function inferHealth(profile: RawCompassProfile) {
  const text = `${profile.relationship_pattern_summary} ${profile.common_triggers.join(" ")}`;
  if (/支持|尊重|清楚|稳定|安全/.test(text)) return 4;
  if (/消耗|比较|忽视|控制|压力|冲突/.test(text)) return 2;
  return normalizeScore(profile.closeness_score, 3);
}

function inferJoy(profile: RawCompassProfile) {
  const text = `${profile.relationship_pattern_summary} ${profile.common_triggers.join(" ")}`;
  if (/开心|轻松|有趣|温暖|自在/.test(text)) return 4;
  if (/无聊|别扭|紧张|焦虑|疲惫|尴尬/.test(text)) return 2;
  return 3;
}

function normalizeTier(value: number | null | undefined, fallback: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  const next = Number.isFinite(value) ? Number(value) : fallback;
  const tier = Math.min(4, Math.max(1, Math.round(next)));
  return tier as 1 | 2 | 3 | 4;
}

function isRelationModeTag(tag: string): tag is RelationModeTag {
  return RELATION_MODE_TAGS.includes(tag as RelationModeTag);
}

export function normalizeCompassProfile(profile: RawCompassProfile, eventsText = ""): NormalizedCompassProfile {
  const storedTags = profile.relation_mode_tags?.filter(Boolean) || [];
  const looksLikeUninferredDefault =
    profile.health_score === 3 && profile.joy_score === 3 && profile.tier === 3 && storedTags.length === 0;
  const healthScore = normalizeScore(looksLikeUninferredDefault ? null : profile.health_score, inferHealth(profile));
  const joyScore = normalizeScore(looksLikeUninferredDefault ? null : profile.joy_score, inferJoy(profile));
  const rawTags = storedTags.length > 0
    ? storedTags
    : inferRelationModeTags({ ...profile, eventsText });
  const relationModeTags = rawTags.filter(isRelationModeTag).slice(0, 3);
  const tier = normalizeTier(
    looksLikeUninferredDefault ? null : profile.tier,
    mapClosenessToTier(profile.closeness_score),
  );

  return {
    ...profile,
    relationType: normalizeRelationType(profile.relationship_type),
    healthScore,
    joyScore,
    tier,
    quadrant: classifyQuadrant(healthScore, joyScore),
    relationModeTags,
  };
}

export function getRelationshipTemperature(
  profile: Pick<NormalizedCompassProfile, "healthScore" | "joyScore" | "tier" | "related_record_count">,
) {
  const score =
    profile.healthScore * 11 +
    profile.joyScore * 8 +
    (5 - profile.tier) * 6 +
    Math.min(profile.related_record_count, 5) * 2;

  return Math.max(20, Math.min(99, Math.round(score)));
}

export function getRelationshipHeadline({
  quadrant,
  relationType,
}: Pick<NormalizedCompassProfile, "quadrant" | "relationType">) {
  if (quadrant === "q4") return "“这段关系正在提醒我：靠近之前，也要守住边界”";

  const copy: Record<RelationType, string> = {
    朋友: "“我们可以分享快乐，也能坦诚说出不容易”",
    同事: "“好的合作，不必以压住自己的感受为代价”",
    伴侣: "“我们在靠近彼此，也学习不弄丢自己”",
    家人: "“爱与边界，可以同时存在于家人之间”",
    熟人: "“不必急着熟悉，舒服的距离也很好”",
    其他: "“我可以慢一点，看看这段关系带来的感受”",
  };

  return copy[relationType];
}

export function getRelationshipWeather(profiles: NormalizedCompassProfile[]): RelationshipWeatherSummary {
  if (profiles.length === 0) {
    return {
      temperature: 0,
      label: "暂无天气",
      description: "保存带有相关人物的觉察后生成",
      profileCount: 0,
    };
  }

  const temperature = Math.round(
    profiles.reduce((total, profile) => total + getRelationshipTemperature(profile), 0) / profiles.length,
  );
  const boundaryCount = profiles.filter((profile) => profile.quadrant === "q4").length;
  const nourishingCount = profiles.filter((profile) => profile.quadrant === "q1").length;

  if (boundaryCount > nourishingCount) {
    return {
      temperature,
      label: "多云，留意边界",
      description: "近期较多关系让你感到费力，先照顾自己的空间。",
      profileCount: profiles.length,
    };
  }

  if (temperature >= 80) {
    return {
      temperature,
      label: "晴朗而温暖",
      description: "近期关系里有较多支持、轻松与稳定感。",
      profileCount: profiles.length,
    };
  }

  if (temperature >= 60) {
    return {
      temperature,
      label: "温和有光",
      description: "关系整体平稳，也有一些值得继续观察的细节。",
      profileCount: profiles.length,
    };
  }

  return {
    temperature,
    label: "阴晴交替",
    description: "有靠近，也有消耗，慢一点确认自己的感受。",
    profileCount: profiles.length,
  };
}
