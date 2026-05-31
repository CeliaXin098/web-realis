import { NextResponse } from "next/server";
import { z } from "zod";
import { isE2EMode } from "@/lib/e2e/mock-reflection";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().trim().min(1).max(80).optional(),
  mbti_tendency: z.string().trim().max(120).optional(),
  position_x: z.number().min(0).max(100).nullable().optional(),
  position_y: z.number().min(0).max(100).nullable().optional(),
  relation_label: z.string().trim().max(28).optional(),
});

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (isE2EMode()) {
    return NextResponse.json({
      ...parsed.data,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = {
    ...(parsed.data.nickname !== undefined ? { nickname: parsed.data.nickname } : {}),
    ...(parsed.data.mbti_tendency !== undefined ? { mbti_tendency: parsed.data.mbti_tendency } : {}),
    ...(parsed.data.position_x !== undefined ? { position_x: parsed.data.position_x } : {}),
    ...(parsed.data.position_y !== undefined ? { position_y: parsed.data.position_y } : {}),
    ...(parsed.data.relation_label !== undefined ? { relation_label: parsed.data.relation_label } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("person_profiles")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
