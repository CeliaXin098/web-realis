import type { MemoryType, UserMemoryProfile } from "@/lib/memory/types";
import {
  getQuadrantCopy,
  getRelationshipTemperature,
  normalizeCompassProfile,
} from "@/lib/relationship/compass";
import type { JungianFunctionInsight } from "@/lib/records/types";
import {
  aggregateSelfJungianFunctions,
  extractMbtiType,
  mergeSelfProfileInsights,
} from "@/lib/relationship/self-profile";

type SupabaseLike = any;

type MemoryEventInsert = {
  user_id: string;
  source_record_id: string;
  memory_type: MemoryType;
  title: string;
  content: string;
  emotion_tags: string[];
  related_person: string | null;
  keywords: string[];
  confidence: number;
};

type ReflectionForMemory = {
  compass_updates: Array<{
    closeness_score?: number;
    common_triggers: string[];
    health_score?: number | null;
    interaction_guide?: string;
    jungian_functions?: JungianFunctionInsight[];
    joy_score?: number | null;
    mbti_tendency?: string;
    nickname: string;
    relation_mode_tags?: string[] | null;
    relationship_pattern_summary: string;
    relationship_type: string;
    tier?: number | null;
  }>;
  emotional_root: string;
  pattern: string;
  underlying_needs: string[];
};

type BuildMemoryInput = {
  emotionTags: string[];
  eventText: string;
  reflection: ReflectionForMemory;
  recordId: string;
  relatedPerson?: string | null;
  userId: string;
};

const DEFAULT_CAUTION_NOTES = ["不要把一次事件上升成长期人格判断", "引用记忆时使用假设性、可撤回的语言"];

function cleanText(value: string | null | undefined) {
  return (value || "").trim();
}

function unique(values: Array<string | null | undefined>, limit = 12) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean))).slice(0, limit);
}

function keywordsFrom(...values: Array<string | string[] | null | undefined>) {
  return unique(
    values.flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return value
        .replace(/[，。！？、,.!?]/g, " ")
        .split(/\s+/)
        .filter((item) => item.length >= 2 && item.length <= 12);
    }),
    16,
  );
}

function memoryEvent(
  input: BuildMemoryInput,
  memory_type: MemoryType,
  title: string,
  content: string,
  extraKeywords: string[] = [],
): MemoryEventInsert | null {
  const finalTitle = cleanText(title);
  const finalContent = cleanText(content);

  if (!finalTitle || !finalContent) return null;

  return {
    user_id: input.userId,
    source_record_id: input.recordId,
    memory_type,
    title: finalTitle,
    content: finalContent,
    emotion_tags: input.emotionTags,
    related_person: cleanText(input.relatedPerson) || null,
    keywords: keywordsFrom(input.eventText, input.emotionTags, input.relatedPerson, extraKeywords, title),
    confidence: 0.68,
  };
}

export function buildMemoryEventsFromReflection(input: BuildMemoryInput) {
  const events: MemoryEventInsert[] = [];

  for (const need of input.reflection.underlying_needs.slice(0, 4)) {
    const event = memoryEvent(input, "need", `需要：${need}`, `用户在类似情境中可能很需要${need}。`, [need]);
    if (event) events.push(event);
  }

  const pattern = memoryEvent(input, "pattern", "反复模式线索", input.reflection.pattern);
  if (pattern) events.push(pattern);

  const root = memoryEvent(input, "trigger", "情绪触发线索", input.reflection.emotional_root);
  if (root) events.push(root);

  for (const update of input.reflection.compass_updates.slice(0, 3)) {
    const relationshipProfile = normalizeCompassProfile({
      id: `${input.recordId}-${update.nickname || update.relationship_type}`,
      relationship_type: update.relationship_type,
      nickname: update.nickname,
      related_record_count: 1,
      common_triggers: update.common_triggers,
      relationship_pattern_summary: update.relationship_pattern_summary,
      mbti_tendency: "",
      closeness_score: update.closeness_score,
      health_score: update.health_score,
      joy_score: update.joy_score,
      tier: update.tier,
      relation_mode_tags: update.relation_mode_tags,
      interaction_guide: update.interaction_guide || "",
    });
    const quadrant = getQuadrantCopy(relationshipProfile.quadrant);
    const relationshipTemperature = getRelationshipTemperature(relationshipProfile);

    for (const trigger of update.common_triggers.slice(0, 4)) {
      const triggerEvent = memoryEvent(
        { ...input, relatedPerson: update.nickname || input.relatedPerson },
        "trigger",
        `触发点：${trigger}`,
        `和${update.nickname || update.relationship_type}相关时，${trigger}可能会触发用户的情绪。`,
        [trigger, update.nickname, update.relationship_type],
      );
      if (triggerEvent) events.push(triggerEvent);
    }

    const personEvent = memoryEvent(
      { ...input, relatedPerson: update.nickname || input.relatedPerson },
      "person",
      `人物记忆：${update.nickname || update.relationship_type}`,
      `本次觉察中，与${update.nickname || update.relationship_type}的关系呈现“${quadrant.title}”：健康度 ${relationshipProfile.healthScore}/5，愉悦度 ${relationshipProfile.joyScore}/5，关系温度 ${relationshipTemperature}。${update.relationship_pattern_summary}`,
      [update.nickname, update.relationship_type, quadrant.title, ...relationshipProfile.relationModeTags],
    );
    if (personEvent) events.push(personEvent);
  }

  return events.slice(0, 12);
}

export function mergeMemoryProfile(existing: UserMemoryProfile | null, incoming: UserMemoryProfile): UserMemoryProfile {
  const selfInsights = mergeSelfProfileInsights(
    existing
      ? {
          jungian_functions: existing.jungian_functions || [],
          mbti_source: existing.mbti_source || "inferred",
          mbti_type: existing.mbti_type || "",
        }
      : null,
    {
      jungian_functions: incoming.jungian_functions || [],
      mbti_source: incoming.mbti_source || "inferred",
      mbti_type: incoming.mbti_type || "",
    },
  );

  return {
    caution_notes: unique([...(existing?.caution_notes || []), ...incoming.caution_notes], 8),
    common_triggers: unique([...(existing?.common_triggers || []), ...incoming.common_triggers], 12),
    core_needs: unique([...(existing?.core_needs || []), ...incoming.core_needs], 12),
    ...selfInsights,
    recurring_patterns: unique([...(existing?.recurring_patterns || []), ...incoming.recurring_patterns], 10),
    support_style: cleanText(existing?.support_style) || cleanText(incoming.support_style),
  };
}

export function buildProfileFromReflection(input: BuildMemoryInput): UserMemoryProfile {
  const mbtiType = input.reflection.compass_updates
    .map((update) => extractMbtiType(update.mbti_tendency))
    .find(Boolean) || "";

  return {
    caution_notes: DEFAULT_CAUTION_NOTES,
    common_triggers: unique(input.reflection.compass_updates.flatMap((update) => update.common_triggers), 12),
    core_needs: unique(input.reflection.underlying_needs, 12),
    jungian_functions: aggregateSelfJungianFunctions(
      [],
      input.reflection.compass_updates.flatMap((update) => update.jungian_functions || []),
    ),
    mbti_source: "inferred",
    mbti_type: mbtiType,
    recurring_patterns: unique([input.reflection.pattern], 10),
    support_style: "温柔、具体、不要贴标签；提醒历史模式时先询问是否贴近。",
  };
}

export async function persistUserMemory(supabase: SupabaseLike, input: BuildMemoryInput) {
  const events = buildMemoryEventsFromReflection(input);

  if (events.length > 0) {
    const { error } = await supabase.from("user_memory_events").insert(events);
    if (error) throw new Error(error.message);
  }

  const existingResponse = await supabase
    .from("user_memory_profiles")
    .select("core_needs, recurring_patterns, common_triggers, support_style, caution_notes, mbti_type, mbti_source, jungian_functions")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existingResponse?.error) throw new Error(existingResponse.error.message);

  const merged = mergeMemoryProfile(existingResponse?.data ?? null, buildProfileFromReflection(input));
  const { error } = await supabase.from("user_memory_profiles").upsert(
    {
      user_id: input.userId,
      ...merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
}
