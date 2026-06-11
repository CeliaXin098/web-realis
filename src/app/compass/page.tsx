import { ArrowRight, Compass as CompassIcon, MessagesSquare, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SoftPanel } from "@/components/ui/card";
import { RelationshipBoard, type RelationshipEvent, type RelationshipProfile } from "@/components/relationship-board";
import { isE2EMode } from "@/lib/e2e/mock-reflection";
import { getE2ERecords } from "@/lib/e2e/store";
import type { UserMemoryProfile } from "@/lib/memory/types";
import type { ReflectionRecord } from "@/lib/records/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function CompassPage() {
  if (isE2EMode()) {
    const records = getE2ERecords();
    const profiles = records.flatMap((record) =>
      record.compass_updates.map((update, index) => ({
        id: `${record.id}-${index}`,
        relationship_type: update.relationship_type,
        nickname: update.nickname,
        related_record_count: 1,
        common_triggers: update.common_triggers,
        relationship_pattern_summary: update.relationship_pattern_summary,
        mbti_tendency: update.mbti_tendency,
        jungian_functions: update.jungian_functions,
        closeness_score: update.closeness_score,
        health_score: update.health_score,
        joy_score: update.joy_score,
        tier: update.tier,
        relation_mode_tags: update.relation_mode_tags,
        interaction_guide: update.interaction_guide,
      })),
    );
    return <Compass events={toRelationshipEvents(records)} profiles={profiles} selfProfile={buildE2ESelfProfile(records)} />;
  }

  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginRequired />;
  }

  const [{ data: profilesData }, { data: recordsData }, { data: selfProfileData }] = await Promise.all([
    supabase.from("person_profiles").select("*").order("updated_at", { ascending: false }),
    supabase.from("reflection_records").select("*").order("created_at", { ascending: false }),
    supabase
      .from("user_memory_profiles")
      .select("core_needs, recurring_patterns, common_triggers, support_style, caution_notes, mbti_type, mbti_source, jungian_functions")
      .maybeSingle(),
  ]);

  return (
    <Compass
      events={toRelationshipEvents((recordsData || []) as ReflectionRecord[])}
      profiles={(profilesData || []) as RelationshipProfile[]}
      selfProfile={(selfProfileData || null) as UserMemoryProfile | null}
    />
  );
}

function Compass({
  events,
  profiles,
  selfProfile,
}: {
  events: RelationshipEvent[];
  profiles: RelationshipProfile[];
  selfProfile: UserMemoryProfile | null;
}) {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:py-14">
      <section className="grid gap-8 xl:-mx-14 xl:grid-cols-[0.9fr_1.1fr] xl:items-end 2xl:-mx-24">
        <div>
          <Badge>Relationship Compass</Badge>
          <h1 className="text-balance mt-5 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            人际罗盘
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            把重要关系放进象限图里，看见谁滋养你、谁消耗你，以及下一次如何相处。
          </p>
          <p className="font-sans-soft mt-5 inline-flex rounded-full border border-line bg-white/58 px-4 py-2 text-sm text-muted">
            MBTI 与荣格八维只用于自我理解，不用于诊断或固定任何人。
          </p>
        </div>

        <SoftPanel className="grid gap-5 p-6 sm:grid-cols-3">
          <Metric icon={UsersRound} label="关系人数" value={profiles.length.toString()} />
          <Metric
            icon={MessagesSquare}
            label="关联事件"
            value={events.length.toString()}
          />
          <Metric
            icon={ShieldCheck}
            label="相处建议"
            value={profiles.length > 0 ? "已生成" : "等待中"}
          />
        </SoftPanel>
      </section>

      {profiles.length === 0 && !selfProfile ? (
        <EmptyCompass />
      ) : (
        <RelationshipBoard events={events} profiles={profiles} selfProfile={selfProfile} />
      )}
    </main>
  );
}

function buildE2ESelfProfile(records: ReflectionRecord[]): UserMemoryProfile | null {
  if (records.length === 0) return null;
  const updates = records.flatMap((record) => record.compass_updates);
  return {
    caution_notes: [],
    common_triggers: Array.from(new Set(updates.flatMap((update) => update.common_triggers))),
    core_needs: Array.from(new Set(records.flatMap((record) => record.underlying_needs))),
    jungian_functions: updates.flatMap((update) => update.jungian_functions || []),
    mbti_source: "inferred",
    mbti_type: updates.find((update) => update.mbti_tendency)?.mbti_tendency || "",
    recurring_patterns: Array.from(new Set(records.map((record) => record.pattern))),
    support_style: "温柔、具体地理解自己。",
  };
}

function toRelationshipEvents(records: ReflectionRecord[]): RelationshipEvent[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    event_text: record.event_text,
    summary: record.summary,
    related_person: record.related_person,
    emotion_tags: record.emotion_tags,
    created_at: record.created_at,
    compass_updates: record.compass_updates.map((update) => ({
      relationship_type: update.relationship_type,
      nickname: update.nickname,
    })),
  }));
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-line/70 bg-paper/70 p-4">
      <Icon className="size-5 text-moss" />
      <p className="font-sans-soft mt-5 text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function EmptyCompass() {
  return (
    <section className="mt-10 rounded-[34px] border border-dashed border-line bg-white/52 p-8 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <span className="grid size-14 place-items-center rounded-2xl bg-sage/12 text-moss">
            <CompassIcon className="size-6" />
          </span>
          <h2 className="mt-6 text-3xl font-semibold text-ink">还没有关系点位</h2>
          <p className="mt-4 max-w-xl leading-8 text-muted">
            保存一条带有相关人物的 AI 觉察后，这里会开始生成关系健康度、相处愉悦度、Tier 和相处建议。
          </p>
          <ButtonLink className="mt-7" href="/reflect">
            去完成一次觉察
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="relative min-h-72 overflow-hidden rounded-[30px] border border-line/70 bg-[#fbf7ed]">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 text-xs text-muted">
            <div className="bg-clay/8 p-5">上头但消耗</div>
            <div className="bg-sage/16 p-5 text-right">滋养关系</div>
            <div className="self-end bg-night/5 p-5">需要边界</div>
            <div className="self-end bg-gold/12 p-5 text-right">稳固但费力</div>
          </div>
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-clay/35" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-clay/35" />
          <div className="absolute left-[68%] top-[26%] grid size-20 place-items-center rounded-full border border-sage/30 bg-white/78 text-sm font-semibold text-moss shadow-lg">
            朋友
          </div>
          <div className="absolute left-[28%] top-[42%] grid size-14 place-items-center rounded-full border border-clay/30 bg-white/70 text-xs text-clay shadow-md">
            熟人
          </div>
          <div className="absolute left-[58%] top-[66%] grid size-16 place-items-center rounded-full border border-gold/35 bg-white/72 text-xs text-[#7b6330] shadow-md">
            同事
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginRequired() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card className="p-8 sm:p-10">
        <Badge>Private Space</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-ink">人际罗盘</h1>
        <p className="mt-4 leading-8 text-muted">这里会沉淀你和重要他人的关系画像，请先登录。</p>
        <Link className="font-sans-soft mt-7 inline-flex items-center gap-2 rounded-full bg-night px-5 py-3 text-sm font-medium text-paper" href="/auth">
          登录 / 注册
          <ArrowRight className="size-4" />
        </Link>
      </Card>
    </main>
  );
}

function SetupRequired() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card className="p-8 sm:p-10">
        <Badge variant="warm">Setup</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-ink">人际罗盘</h1>
        <p className="mt-4 leading-8 text-muted">
          还没有配置 Supabase 环境变量。请根据 <code>.env.example</code> 补齐本地环境后重启服务。
        </p>
      </Card>
    </main>
  );
}
