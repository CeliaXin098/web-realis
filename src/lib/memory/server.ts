import { buildMemoryContext, rankRelevantMemories } from "@/lib/memory/context";
import type { MemoryQueryInput } from "@/lib/memory/types";

type SupabaseLike = any;

export async function getUserMemoryContext({
  input,
  supabase,
  userId,
}: {
  input: MemoryQueryInput;
  supabase: SupabaseLike;
  userId: string;
}) {
  const profileResponse = await supabase
    .from("user_memory_profiles")
    .select("core_needs, recurring_patterns, common_triggers, support_style, caution_notes")
    .eq("user_id", userId)
    .maybeSingle();

  const eventsResponse = await supabase
    .from("user_memory_events")
    .select("id, memory_type, title, content, emotion_tags, related_person, keywords, created_at")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (profileResponse?.error || eventsResponse?.error) {
    return "暂无可参考的长期记忆。";
  }

  const memories = rankRelevantMemories(input, eventsResponse?.data || []);
  return buildMemoryContext({
    memories,
    profile: profileResponse?.data || null,
  });
}
