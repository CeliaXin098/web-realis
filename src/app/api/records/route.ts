import { NextResponse } from "next/server";
import { z } from "zod";
import { reflectionSchema } from "@/lib/ai/reflection-schema";
import { isE2EMode } from "@/lib/e2e/mock-reflection";
import { getE2ERecords, saveE2ERecord } from "@/lib/e2e/store";
import { persistUserMemory } from "@/lib/memory/persistence";
import { normalizeCompassProfile } from "@/lib/relationship/compass";
import { createClient } from "@/lib/supabase/server";

const saveSchema = z.object({
  eventText: z.string().min(10),
  emotionTags: z.array(z.string()).default([]),
  emotionIntensity: z.number().int().min(1).max(10),
  relatedPerson: z.string().optional(),
  reflection: reflectionSchema,
});

export async function GET() {
  if (isE2EMode()) {
    return NextResponse.json(getE2ERecords());
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("reflection_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (isE2EMode()) {
    const body = await request.json();
    const record = saveE2ERecord({
      eventText: body.eventText,
      emotionTags: body.emotionTags || [],
      emotionIntensity: body.emotionIntensity || 5,
      relatedPerson: body.relatedPerson,
    });
    return NextResponse.json(record);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { eventText, emotionTags, emotionIntensity, relatedPerson, reflection } = parsed.data;
  const { data, error } = await supabase
    .from("reflection_records")
    .insert({
      user_id: user.id,
      event_text: eventText,
      emotion_tags: emotionTags,
      emotion_intensity: emotionIntensity,
      related_person: relatedPerson || null,
      title: reflection.title,
      summary: reflection.summary,
      gentle_response: reflection.gentle_response,
      emotional_root: reflection.emotional_root,
      underlying_needs: reflection.underlying_needs,
      pattern: reflection.pattern,
      prescriptions: reflection.prescriptions,
      future_self_note: reflection.future_self_note,
      reasoning_notes: reflection.reasoning_notes,
      compass_updates: reflection.compass_updates,
      safety_note: reflection.safety_note,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await persistUserMemory(supabase as any, {
      emotionTags,
      eventText,
      reflection,
      recordId: data.id,
      relatedPerson,
      userId: user.id,
    });
  } catch (memoryError) {
    console.error("Failed to persist user memory", memoryError);
  }

  for (const update of reflection.compass_updates) {
    const { data: existingProfile } = await supabase
      .from("person_profiles")
      .select("id, related_record_count, common_triggers, position_x, position_y, relation_label")
      .eq("user_id", user.id)
      .eq("relationship_type", update.relationship_type)
      .eq("nickname", update.nickname)
      .maybeSingle();

    const normalized = normalizeCompassProfile(
      {
        id: existingProfile?.id || `${user.id}-${update.relationship_type}-${update.nickname}`,
        relationship_type: update.relationship_type,
        nickname: update.nickname,
        related_record_count: (existingProfile?.related_record_count || 0) + 1,
        common_triggers: mergeTextList(existingProfile?.common_triggers, update.common_triggers),
        relationship_pattern_summary: update.relationship_pattern_summary,
        mbti_tendency: update.mbti_tendency,
        jungian_functions: update.jungian_functions,
        closeness_score: update.closeness_score,
        health_score: update.health_score,
        joy_score: update.joy_score,
        tier: update.tier,
        relation_mode_tags: update.relation_mode_tags,
        interaction_guide: update.interaction_guide,
      },
      `${eventText} ${emotionTags.join(" ")} ${reflection.summary} ${reflection.emotional_root}`,
    );

    const { error: profileError } = await supabase.from("person_profiles").upsert(
      {
        user_id: user.id,
        relationship_type: update.relationship_type,
        nickname: update.nickname,
        related_record_count: normalized.related_record_count,
        common_triggers: normalized.common_triggers,
        relationship_pattern_summary: update.relationship_pattern_summary,
        mbti_tendency: update.mbti_tendency,
        jungian_functions: update.jungian_functions,
        closeness_score: update.closeness_score,
        health_score: normalized.healthScore,
        joy_score: normalized.joyScore,
        tier: normalized.tier,
        relation_mode_tags: normalized.relationModeTags,
        position_x: existingProfile?.position_x ?? null,
        position_y: existingProfile?.position_y ?? null,
        relation_label: existingProfile?.relation_label || "",
        interaction_guide: update.interaction_guide,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,relationship_type,nickname" },
    );

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

function mergeTextList(existing: string[] | null | undefined, incoming: string[]) {
  return Array.from(new Set([...(existing || []), ...incoming].map((item) => item.trim()).filter(Boolean))).slice(0, 12);
}
