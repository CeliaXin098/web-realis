import { describe, expect, it } from "vitest";
import { getGalleryRecordExcerpt } from "@/lib/records/gallery";
import type { ReflectionRecord } from "@/lib/records/types";

const record: ReflectionRecord = {
  id: "record-1",
  event_text: "今天会议中，我准备很久的方案被很快跳过了。",
  emotion_tags: ["委屈"],
  emotion_intensity: 6,
  related_person: "同事",
  title: "被跳过的方案",
  summary: "一个可能并不准确的抽象总结。",
  gentle_response: "我听见你的委屈。",
  emotional_root: "希望被认真看见。",
  underlying_needs: ["被看见"],
  pattern: "会反复复盘。",
  prescriptions: { film: [], book: [], music: [], action: [] },
  future_self_note: "你的准备有价值。",
  compass_updates: [],
  safety_note: null,
  created_at: "2026-06-11T10:00:00.000Z",
};

describe("getGalleryRecordExcerpt", () => {
  it("uses the concrete user event instead of an abstract AI summary", () => {
    expect(getGalleryRecordExcerpt(record)).toBe(record.event_text);
  });
});
