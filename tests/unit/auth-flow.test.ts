import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  getPasswordValidationError,
  sanitizeNextPath,
} from "@/lib/auth/flow";

describe("auth flow helpers", () => {
  it("keeps safe internal next paths", () => {
    expect(sanitizeNextPath("/gallery")).toBe("/gallery");
    expect(sanitizeNextPath("/auth/reset?from=email")).toBe("/auth/reset?from=email");
  });

  it("rejects unsafe or external next paths", () => {
    expect(sanitizeNextPath("https://evil.test")).toBe("/reflect");
    expect(sanitizeNextPath("//evil.test")).toBe("/reflect");
    expect(sanitizeNextPath("gallery")).toBe("/reflect");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/reflect");
  });

  it("builds callback urls with sanitized next paths", () => {
    expect(buildAuthCallbackUrl("https://realis.example", "/gallery")).toBe(
      "https://realis.example/auth/callback?next=%2Fgallery",
    );
    expect(buildAuthCallbackUrl("https://realis.example", "https://evil.test")).toBe(
      "https://realis.example/auth/callback?next=%2Freflect",
    );
  });

  it("validates production-ready passwords", () => {
    expect(getPasswordValidationError("123456", "123456")).toBe("密码至少需要 8 位。");
    expect(getPasswordValidationError("abcdefgh", "abcdefgh")).toBe("密码需同时包含字母和数字。");
    expect(getPasswordValidationError("abc12345", "xyz12345")).toBe("两次输入的密码不一致。");
    expect(getPasswordValidationError("abc12345", "abc12345")).toBeNull();
  });
});
