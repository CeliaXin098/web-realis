export type MemoryType = "need" | "trigger" | "pattern" | "person" | "preference" | "warning";

export type UserMemoryEvent = {
  id: string;
  content: string;
  created_at: string;
  emotion_tags: string[];
  keywords: string[];
  memory_type: MemoryType;
  related_person: string | null;
  title: string;
};

export type UserMemoryProfile = {
  caution_notes: string[];
  common_triggers: string[];
  core_needs: string[];
  recurring_patterns: string[];
  support_style: string;
};

export type MemoryQueryInput = {
  emotionTags: string[];
  eventText: string;
  relatedPerson?: string;
};
