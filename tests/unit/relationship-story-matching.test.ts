import { describe, expect, it } from "vitest";
import { matchesProfile, type MatchableRelationshipEvent } from "@/lib/relationship/story-matching";

const baseEvent: MatchableRelationshipEvent = {
  related_person: "同事",
  compass_updates: [
    {
      relationship_type: "同事",
      nickname: "同事",
    },
  ],
};

describe("relationship story matching", () => {
  it("keeps generic coworker stories attached after the profile is renamed", () => {
    expect(
      matchesProfile(baseEvent, {
        relationship_type: "同事",
        nickname: "张三",
      }),
    ).toBe(true);
  });

  it("does not attach a generic coworker story to another relationship type", () => {
    expect(
      matchesProfile(baseEvent, {
        relationship_type: "朋友",
        nickname: "小林",
      }),
    ).toBe(false);
  });
});
