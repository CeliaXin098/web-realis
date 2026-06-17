import { ArrowRight, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GalleryBoard } from "@/components/gallery-board";
import type { ReflectionRecord } from "@/lib/records/types";
import { isE2EMode } from "@/lib/e2e/mock-reflection";
import { getE2ERecords } from "@/lib/e2e/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function GalleryPage() {
  if (isE2EMode()) {
    return <Gallery records={getE2ERecords()} />;
  }

  if (!isSupabaseConfigured()) {
    return <SetupRequired title="记忆画廊" />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginRequired title="记忆画廊" />;
  }

  const { data: records } = await supabase
    .from("reflection_records")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (records || []) as ReflectionRecord[];

  return <Gallery records={list} />;
}

function Gallery({ records }: { records: ReflectionRecord[] }) {
  return (
    <main className="min-h-screen w-full bg-[#05080d]">
      {records.length === 0 ? <EmptyGallery /> : <GalleryBoard records={records} />}
    </main>
  );
}

function EmptyGallery() {
  return (
    <section className="min-h-screen bg-[#05080d] px-4 py-16 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[34px] border border-dashed border-white/15 bg-slate-950/50 p-8 shadow-[0_0_90px_rgba(45,78,120,0.18)] backdrop-blur sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <span className="grid size-14 place-items-center rounded-2xl bg-sky-200/12 text-sky-100">
            <LockKeyhole className="size-6" />
          </span>
          <h2 className="mt-6 text-3xl font-semibold text-slate-50">还没有封存的记忆</h2>
          <p className="mt-4 max-w-xl leading-8 text-slate-400">
            从一次 AI 觉察开始。写下今天发生的事，保存后这里会生成第一件属于你的记忆作品。
          </p>
          <ButtonLink className="mt-7" href="/reflect">
            去写第一条记录
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["事件", "情绪", "给未来的我"].map((label, index) => (
            <div
              className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5"
              key={label}
            >
              <p className="font-sans-soft text-xs text-slate-500">0{index + 1}</p>
              <p className="mt-8 text-lg font-semibold text-slate-200">{label}</p>
              <div className="mt-4 h-1 rounded-full bg-sky-200/20" />
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

function LoginRequired({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#05080d] px-4 py-16 sm:px-6">
      <Card className="mx-auto max-w-3xl border-white/10 bg-slate-950/60 p-8 text-slate-100 sm:p-10">
        <Badge>Private Space</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-slate-50">{title}</h1>
        <p className="mt-4 leading-8 text-slate-400">这里保存的是你的私密内容，请先登录后再进入记忆画廊。</p>
        <ButtonLink className="mt-7" href="/auth">
          登录 / 注册
          <ArrowRight className="size-4" />
        </ButtonLink>
      </Card>
    </main>
  );
}

function SetupRequired({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#05080d] px-4 py-16 sm:px-6">
      <Card className="mx-auto max-w-3xl border-white/10 bg-slate-950/60 p-8 text-slate-100 sm:p-10">
        <Badge variant="warm">Setup</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-slate-50">{title}</h1>
        <p className="mt-4 leading-8 text-slate-400">
          还没有配置 Supabase 环境变量。请根据 <code>.env.example</code> 补齐本地环境后重启服务。
        </p>
      </Card>
    </main>
  );
}
