import { describe, expect, it } from "vitest";
import { buildProfileFromReflection, mergeMemoryProfile } from "@/lib/memory/persistence";

describe("long-term self profile persistence", () => {
  it("reduces inferred MBTI to one type when building a profile", () => {
    const profile = buildProfileFromReflection({
      emotionTags: ["anxious"],
      eventText: "A conversation felt difficult.",
      recordId: "record-2",
      relatedPerson: "friend",
      userId: "user-1",
      reflection: {
        emotional_root: "Fear of being misunderstood.",
        pattern: "Avoids conflict.",
        underlying_needs: ["understanding"],
        compass_updates: [
          {
            common_triggers: [],
            interaction_guide: "",
            jungian_functions: [{ code: "Fi", tendency: "values", evidence: "dialogue", score: 4 }],
            mbti_tendency: "Likely INFP or INFJ",
            nickname: "friend",
            relationship_pattern_summary: "",
            relationship_type: "friend",
          },
        ],
      },
    });

    expect(profile.mbti_type).toBe("INFP");
    expect(profile.mbti_source).toBe("inferred");
    expect(profile.jungian_functions?.[0].code).toBe("Fi");
  });

  it("preserves a confirmed MBTI while merging later reflection insights", () => {
    const merged = mergeMemoryProfile(
      {
        caution_notes: [],
        common_triggers: [],
        core_needs: [],
        jungian_functions: [],
        mbti_source: "confirmed",
        mbti_type: "INFJ",
        recurring_patterns: [],
        support_style: "",
      },
      {
        caution_notes: [],
        common_triggers: [],
        core_needs: [],
        jungian_functions: [{ code: "Fi", tendency: "values", evidence: "dialogue", score: 4 }],
        mbti_source: "inferred",
        mbti_type: "INFP",
        recurring_patterns: [],
        support_style: "",
      },
    );

    expect(merged.mbti_type).toBe("INFJ");
    expect(merged.mbti_source).toBe("confirmed");
    expect(merged.jungian_functions?.[0].code).toBe("Fi");
  });
});
