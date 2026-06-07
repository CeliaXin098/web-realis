export type ReflectionSidebarRecord = {
  id: string;
  created_at: string;
  emotion_tags: string[];
  event_text: string;
  related_person: string | null;
  summary: string;
  title: string;
};

export type ReflectionCalendarDay = {
  dateKey: string;
  day: number;
  hasRecord: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarInput = {
  month: number;
  records: ReflectionSidebarRecord[];
  today: Date;
  year: number;
};

type InsightInput = {
  assistantMessages: string[];
  emotionTags: string[];
  eventText: string;
  latestRecord: ReflectionSidebarRecord | null;
  relatedPerson: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDate(value: string) {
  return new Date(value);
}

export function buildReflectionCalendar({ month, records, today, year }: CalendarInput): ReflectionCalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const recordDateKeys = new Set(records.map((item) => toDateKey(toLocalDate(item.created_at))));
  const todayKey = toDateKey(today);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const visibleDayCount = Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7) * 7;

  return Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_IN_MS);
    const dateKey = toDateKey(date);

    return {
      dateKey,
      day: date.getDate(),
      hasRecord: recordDateKeys.has(dateKey),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
    };
  });
}

export function getRecentReflectionTimeline(records: ReflectionSidebarRecord[], limit = 4) {
  return [...records]
    .sort((left, right) => toLocalDate(right.created_at).getTime() - toLocalDate(left.created_at).getTime())
    .slice(0, limit)
    .map((record) => ({
      ...record,
      dateLabel: `${toLocalDate(record.created_at).getMonth() + 1}月${toLocalDate(record.created_at).getDate()}日`,
      metaLabel: `${record.emotion_tags[0] || "情绪记录"} · 强度线索`,
    }));
}

export function buildReflectionInsight({
  assistantMessages,
  emotionTags,
  eventText,
  latestRecord,
  relatedPerson,
}: InsightInput) {
  const emotion = emotionTags[0] || latestRecord?.emotion_tags[0] || "";
  const person = relatedPerson.trim() || latestRecord?.related_person || "";
  const hasAssistantMessage = Boolean(assistantMessages.at(-1)?.trim());

  if (hasAssistantMessage && person) {
    return `AI洞察：围绕${person}，这段对话正在指向你更想被认真理解和稳稳接住的部分。`;
  }

  if (hasAssistantMessage) {
    return `AI洞察：这段对话正在靠近一个更深的情绪需要，可以继续顺着最刺痛的瞬间往下看。`;
  }

  if (eventText.trim() && emotion) {
    return `AI洞察：这次记录里，“${emotion}”可能是最先需要被安放的感受。`;
  }

  if (latestRecord?.summary) {
    return `AI洞察：最近一次记录提醒你，${latestRecord.summary.slice(0, 42)}`;
  }

  return "开始记录后，这里会慢慢浮现你的情绪线索。";
}
