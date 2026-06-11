import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const singleMock = vi.fn();
let capturedUpsert: Record<string, unknown> | null = null;

vi.mock("@/lib/e2e/mock-reflection", () => ({
  isE2EMode: () => false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock }),
      }),
      upsert: (payload: Record<string, unknown>) => {
        capturedUpsert = payload;
        return {
          select: () => ({ single: singleMock }),
        };
      },
    }),
  }),
}));

describe("/api/self-profile", () => {
  beforeEach(() => {
    capturedUpsert = null;
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingleMock.mockResolvedValue({
      data: { mbti_type: "INFP", mbti_source: "inferred", jungian_functions: [] },
      error: null,
    });
    singleMock.mockResolvedValue({
      data: { mbti_type: "INFJ", mbti_source: "confirmed", jungian_functions: [] },
      error: null,
    });
  });

  it("reads the current user's long-term self profile", async () => {
    const { GET } = await import("@/app/api/self-profile/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      mbti_type: "INFP",
      mbti_source: "inferred",
    });
  });

  it("confirms a manually edited MBTI for the current user", async () => {
    const { PATCH } = await import("@/app/api/self-profile/route");
    const response = await PATCH(
      new Request("http://localhost/api/self-profile", {
        method: "PATCH",
        body: JSON.stringify({ mbti_type: "infj" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(capturedUpsert).toMatchObject({
      user_id: "user-1",
      mbti_type: "INFJ",
      mbti_source: "confirmed",
    });
  });

  it("rejects text that is not exactly one MBTI type", async () => {
    const { PATCH } = await import("@/app/api/self-profile/route");
    const response = await PATCH(
      new Request("http://localhost/api/self-profile", {
        method: "PATCH",
        body: JSON.stringify({ mbti_type: "INFP or INFJ" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(capturedUpsert).toBeNull();
  });
});
