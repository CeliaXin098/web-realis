import type { MemoryQueryInput, UserMemoryEvent, UserMemoryProfile } from "@/lib/memory/types";

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function uniqueText(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function scoreMemory(input: MemoryQueryInput, memory: UserMemoryEvent) {
  const eventText = normalizeToken(input.eventText);
  const relatedPerson = normalizeToken(input.relatedPerson || "");
  const emotionTags = input.emotionTags.map(normalizeToken);
  let score = 0;

  if (relatedPerson && normalizeToken(memory.related_person || "") === relatedPerson) {
    score += 4;
  }

  for (const tag of memory.emotion_tags.map(normalizeToken)) {
    if (emotionTags.includes(tag)) score += 2;
  }

  for (const keyword of memory.keywords.map(normalizeToken)) {
    if (keyword && eventText.includes(keyword)) score += 3;
  }

  for (const text of [memory.title, memory.content].map(normalizeToken)) {
    if (relatedPerson && text.includes(relatedPerson)) score += 1;
    for (const tag of emotionTags) {
      if (tag && text.includes(tag)) score += 1;
    }
  }

  return score;
}

export function rankRelevantMemories(input: MemoryQueryInput, memories: UserMemoryEvent[], limit = 5) {
  return [...memories]
    .map((memory) => ({ memory, score: scoreMemory(input, memory) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.memory.created_at).getTime() - new Date(left.memory.created_at).getTime();
    })
    .slice(0, limit)
    .map((item) => item.memory);
}

export function buildMemoryContext({
  memories,
  profile,
}: {
  memories: UserMemoryEvent[];
  profile: UserMemoryProfile | null;
}) {
  if (!profile && memories.length === 0) {
    return "暂无可参考的长期记忆。";
  }

  const lines = [
    "可参考的长期记忆：请用假设性语言温柔参考，不要机械复述，不要把一次事件上升成人格判断。",
  ];

  if (profile) {
    const needs = uniqueText(profile.core_needs).slice(0, 5);
    const triggers = uniqueText(profile.common_triggers).slice(0, 5);
    const patterns = uniqueText(profile.recurring_patterns).slice(0, 5);
    const cautions = uniqueText(profile.caution_notes).slice(0, 3);

    if (needs.length > 0) lines.push(`- 稳定需要：${needs.join("、")}`);
    if (triggers.length > 0) lines.push(`- 常见触发：${triggers.join("、")}`);
    if (patterns.length > 0) lines.push(`- 反复模式：${patterns.join("、")}`);
    if (profile.support_style.trim()) lines.push(`- 适合的陪伴方式：${profile.support_style.trim()}`);
    if (cautions.length > 0) lines.push(`- 使用边界：${cautions.join("、")}`);
  }

  for (const memory of memories.slice(0, 5)) {
    lines.push(`- ${memory.title}：${memory.content}`);
  }

  return lines.join("\n");
}
