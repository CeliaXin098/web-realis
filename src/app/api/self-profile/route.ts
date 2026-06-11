import { NextResponse } from "next/server";
import { z } from "zod";
import { isE2EMode } from "@/lib/e2e/mock-reflection";
import { createClient } from "@/lib/supabase/server";

const PROFILE_FIELDS =
  "core_needs, recurring_patterns, common_triggers, support_style, caution_notes, mbti_type, mbti_source, jungian_functions";

const mbtiSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum([
    "INTJ",
    "INTP",
    "ENTJ",
    "ENTP",
    "INFJ",
    "INFP",
    "ENFJ",
    "ENFP",
    "ISTJ",
    "ISFJ",
    "ESTJ",
    "ESFJ",
    "ISTP",
    "ISFP",
    "ESTP",
    "ESFP",
  ]),
);

const updateSchema = z.object({
  mbti_type: mbtiSchema,
});

const EMPTY_PROFILE = {
  caution_notes: [],
  common_triggers: [],
  core_needs: [],
  jungian_functions: [],
  mbti_source: "inferred",
  mbti_type: "",
  recurring_patterns: [],
  support_style: "",
};

export async function GET() {
  if (isE2EMode()) return NextResponse.json(EMPTY_PROFILE);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_memory_profiles")
    .select(PROFILE_FIELDS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || EMPTY_PROFILE);
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (isE2EMode()) {
    return NextResponse.json({ ...EMPTY_PROFILE, mbti_type: parsed.data.mbti_type, mbti_source: "confirmed" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing, error: readError } = await supabase
    .from("user_memory_profiles")
    .select(PROFILE_FIELDS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const { data, error } = await supabase
    .from("user_memory_profiles")
    .upsert(
      {
        ...EMPTY_PROFILE,
        ...(existing || {}),
        user_id: user.id,
        mbti_type: parsed.data.mbti_type,
        mbti_source: "confirmed",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
