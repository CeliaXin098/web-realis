import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const singleMock = vi.fn();
let capturedUpdate: Record<string, unknown> | null = null;

vi.mock("@/lib/e2e/mock-reflection", () => ({
  isE2EMode: () => false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        capturedUpdate = payload;
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: singleMock,
              }),
            }),
          }),
        };
      },
    }),
  }),
}));

describe("/api/person-profiles PATCH", () => {
  beforeEach(() => {
    capturedUpdate = null;
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    singleMock.mockResolvedValue({ data: { id: "profile-1" }, error: null });
  });

  it("updates editable compass profile state for the current user", async () => {
    const { PATCH } = await import("@/app/api/person-profiles/route");
    const response = await PATCH(
      new Request("http://localhost/api/person-profiles", {
        method: "PATCH",
        body: JSON.stringify({
          id: "profile-1",
          nickname: "林然",
          mbti_tendency: "INFJ",
          position_x: 42.5,
          position_y: 58.25,
          relation_label: "互相鼓励",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(capturedUpdate).toMatchObject({
      nickname: "林然",
      mbti_tendency: "INFJ",
      position_x: 42.5,
      position_y: 58.25,
      relation_label: "互相鼓励",
    });
    expect(capturedUpdate?.updated_at).toEqual(expect.any(String));
  });

  it("rejects invalid node positions before touching Supabase", async () => {
    const { PATCH } = await import("@/app/api/person-profiles/route");
    const response = await PATCH(
      new Request("http://localhost/api/person-profiles", {
        method: "PATCH",
        body: JSON.stringify({
          id: "profile-1",
          position_x: 120,
          position_y: 50,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(capturedUpdate).toBeNull();
  });
});
