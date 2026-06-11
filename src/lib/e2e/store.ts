import type { ReflectionRecord } from "@/lib/records/types";
import { getMockReflection } from "./mock-reflection";

const globalForE2E = globalThis as typeof globalThis & {
  __realisE2ERecords?: ReflectionRecord[];
};

export function getE2ERecords() {
  globalForE2E.__realisE2ERecords ??= [];
  return globalForE2E.__realisE2ERecords;
}

export function saveE2ERecord(input: {
  eventText: string;
  emotionTags: string[];
  emotionIntensity: number;
  relatedPerson?: string;
  conversationMessages?: ReflectionRecord["conversation_messages"];
  reflection?: ReturnType<typeof getMockReflection>;
}) {
  const reflection = input.reflection || getMockReflection();
  const record: ReflectionRecord = {
    id: `e2e-${Date.now()}`,
    event_text: input.eventText,
    emotion_tags: input.emotionTags,
    emotion_intensity: input.emotionIntensity,
    related_person: input.relatedPerson || null,
    title: reflection.title,
    summary: reflection.summary,
    gentle_response: reflection.gentle_response,
    conversation_messages: input.conversationMessages || [],
    emotional_root: reflection.emotional_root,
    underlying_needs: reflection.underlying_needs,
    pattern: reflection.pattern,
    prescriptions: reflection.prescriptions,
    future_self_note: reflection.future_self_note,
    reasoning_notes: reflection.reasoning_notes,
    compass_updates: reflection.compass_updates,
    safety_note: reflection.safety_note,
    created_at: new Date().toISOString(),
  };
  getE2ERecords().unshift(record);
  return record;
}
