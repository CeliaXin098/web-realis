import { describe, expect, it } from "vitest";
import { isCompletionTruncated } from "@/lib/ai/completion";

describe("isCompletionTruncated", () => {
  it("recognizes output stopped by the token limit", () => {
    expect(isCompletionTruncated("length")).toBe(true);
  });

  it("accepts normally completed output", () => {
    expect(isCompletionTruncated("stop")).toBe(false);
    expect(isCompletionTruncated(null)).toBe(false);
  });
});
