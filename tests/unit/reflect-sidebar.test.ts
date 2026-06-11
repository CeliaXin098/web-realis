import { describe, expect, it } from "vitest";
import {
  buildReflectionCalendar,
  buildReflectionInsight,
  getRecentTimelineLabel,
  getRecentReflectionTimeline,
  type ReflectionSidebarRecord,
} from "@/lib/reflection/reflect-sidebar";

function record(id: string, createdAt: string, overrides: Partial<ReflectionSidebarRecord> = {}): ReflectionSidebarRecord {
  return {
    id,
    created_at: createdAt,
    emotion_intensity: 7,
    emotion_tags: ["委屈"],
    event_text: `第 ${id} 条具体事件记录`,
    related_person: "同事",
    summary: `第 ${id} 条摘要`,
    title: `记录 ${id}`,
    ...overrides,
  };
}

describe("reflect sidebar helpers", () => {
  it("builds a month calendar with only user record dates highlighted", () => {
    const grid = buildReflectionCalendar({
      month: 5,
      records: [record("1", "2026-06-04T10:00:00.000Z"), record("2", "2026-06-20T10:00:00.000Z")],
      today: new Date("2026-06-04T12:00:00.000Z"),
      year: 2026,
    });

    expect(grid).toHaveLength(35);
    expect(grid.filter((day) => day.hasRecord).map((day) => day.day)).toEqual([4, 20]);
    expect(grid.find((day) => day.day === 4 && day.isCurrentMonth)?.isToday).toBe(true);
    expect(buildReflectionCalendar({ month: 5, records: [], today: new Date("2026-06-04"), year: 2026 }).some((day) => day.hasRecord)).toBe(false);
  });

  it("returns the four newest timeline records only", () => {
    const timeline = getRecentReflectionTimeline([
      record("old", "2026-06-01T10:00:00.000Z"),
      record("2", "2026-06-02T10:00:00.000Z"),
      record("3", "2026-06-03T10:00:00.000Z"),
      record("4", "2026-06-04T10:00:00.000Z"),
      record("new", "2026-06-05T10:00:00.000Z"),
    ]);

    expect(timeline.map((item) => item.id)).toEqual(["new", "4", "3", "2"]);
    expect(timeline[0].dateLabel).toBe("6月5日");
    expect(timeline[0].metaLabel).toBe("委屈 · 强度等级 7/10");
  });

  it("describes the actual recent record count instead of implying four records exist", () => {
    expect(getRecentTimelineLabel(0)).toBe("还没有记录");
    expect(getRecentTimelineLabel(1)).toBe("最近 1 条记录");
    expect(getRecentTimelineLabel(8)).toBe("最近 4 条记录");
  });

  it("builds insight from the current conversation instead of returning fixed copy", () => {
    expect(
      buildReflectionInsight({
        assistantMessages: ["你似乎很在意自己的准备被认真看见。"],
        emotionTags: ["委屈"],
        eventText: "会议里我准备很久的方案被很快跳过了。",
        latestRecord: null,
        relatedPerson: "同事",
      }),
    ).toContain("同事");

    expect(
      buildReflectionInsight({
        assistantMessages: [],
        emotionTags: [],
        eventText: "",
        latestRecord: null,
        relatedPerson: "",
      }),
    ).toBe("开始记录后，这里会慢慢浮现你的情绪线索。");
  });
});
