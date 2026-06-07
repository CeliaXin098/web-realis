export type HealingPrescription = {
  film: string[];
  book: string[];
  music: string[];
  action: string[];
};

export type ReasoningNotes = {
  emotional_root_basis: string;
  pattern_basis: string;
  future_self_note_basis: string;
  prescription_reasons: HealingPrescription;
};

export type JungianFunctionInsight = {
  code: "Ni" | "Ne" | "Si" | "Se" | "Ti" | "Te" | "Fi" | "Fe";
  tendency: string;
  evidence: string;
  score: number;
};

export type CompassUpdate = {
  relationship_type: string;
  nickname: string;
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  jungian_functions?: JungianFunctionInsight[];
  interaction_guide: string;
};

export type ReflectionRecord = {
  id: string;
  event_text: string;
  emotion_tags: string[];
  emotion_intensity: number;
  related_person: string | null;
  title: string;
  summary: string;
  gentle_response: string;
  emotional_root: string;
  underlying_needs: string[];
  pattern: string;
  prescriptions: HealingPrescription;
  future_self_note: string;
  reasoning_notes?: ReasoningNotes | null;
  compass_updates: CompassUpdate[];
  safety_note: string | null;
  created_at: string;
  cover_image_url?: string | null;
};
