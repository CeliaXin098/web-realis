import { describe, expect, it } from "vitest";
import { createEmptyReflectionSession } from "@/lib/reflection/session";

describe("reflection session", () => {
  it("creates a clean new round without historical records", () => {
    expect(createEmptyReflectionSession()).toEqual({
      chatInput: "",
      emotionIntensity: 5,
      emotionTags: [],
      error: "",
      eventText: "",
      messages: [],
      reflection: null,
      relatedPerson: "",
      saved: false,
      started: false,
    });
    expect(createEmptyReflectionSession()).not.toHaveProperty("records");
  });
});
