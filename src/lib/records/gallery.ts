import type { ReflectionRecord } from "./types";

export function getGalleryRecordExcerpt(record: ReflectionRecord) {
  return record.event_text.trim() || record.summary.trim();
}
