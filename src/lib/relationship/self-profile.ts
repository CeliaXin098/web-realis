import type { JungianFunctionInsight } from "@/lib/records/types";

export type MbtiSource = "inferred" | "confirmed";

export type SelfProfileInsights = {
  mbti_type: string;
  mbti_source: MbtiSource;
  jungian_functions: JungianFunctionInsight[];
};

const MBTI_PATTERN = /\b([IE][NS][TF][JP])\b/i;

export function extractMbtiType(value: string | null | undefined) {
  return value?.match(MBTI_PATTERN)?.[1]?.toUpperCase() || "";
}

export function formatMbtiLabel(value: string | null | undefined, source: MbtiSource = "inferred") {
  const type = extractMbtiType(value);
  if (!type) return "";
  return source === "inferred" ? `${type}（推测）` : type;
}

export function aggregateSelfJungianFunctions(
  existing: JungianFunctionInsight[] = [],
  incoming: JungianFunctionInsight[] = [],
) {
  const order: JungianFunctionInsight["code"][] = [];
  const grouped = new Map<
    JungianFunctionInsight["code"],
    { latest: JungianFunctionInsight; scores: number[] }
  >();

  for (const insight of [...existing, ...incoming]) {
    if (!grouped.has(insight.code)) order.push(insight.code);
    const previous = grouped.get(insight.code);
    grouped.set(insight.code, {
      latest: insight,
      scores: [...(previous?.scores || []), insight.score],
    });
  }

  return order.map((code) => {
    const group = grouped.get(code)!;
    return {
      ...group.latest,
      score: Math.round(group.scores.reduce((sum, score) => sum + score, 0) / group.scores.length),
    };
  });
}

export function mergeSelfProfileInsights(
  existing: SelfProfileInsights | null,
  incoming: SelfProfileInsights,
): SelfProfileInsights {
  const keepConfirmed = existing?.mbti_source === "confirmed" && extractMbtiType(existing.mbti_type);

  return {
    mbti_type: keepConfirmed || extractMbtiType(incoming.mbti_type) || extractMbtiType(existing?.mbti_type),
    mbti_source: keepConfirmed ? "confirmed" : incoming.mbti_source,
    jungian_functions: aggregateSelfJungianFunctions(existing?.jungian_functions, incoming.jungian_functions),
  };
}
