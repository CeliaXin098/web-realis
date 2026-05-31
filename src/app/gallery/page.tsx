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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {records.length === 0 ? <EmptyGallery /> : <GalleryBoard records={records} />}
    </main>
  );
}

function EmptyGallery() {
  return (
    <section className="mt-6 overflow-hidden rounded-[34px] border border-dashed border-line bg-white/52 p-8 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <span className="grid size-14 place-items-center rounded-2xl bg-sage/12 text-moss">
            <LockKeyhole className="size-6" />
          </span>
          <h2 className="mt-6 text-3xl font-semibold text-ink">还没有封存的记忆</h2>
          <p className="mt-4 max-w-xl leading-8 text-muted">
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
              className="rounded-[26px] border border-line/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(238,232,220,0.62))] p-5"
              key={label}
            >
              <p className="font-sans-soft text-xs text-muted">0{index + 1}</p>
              <p className="mt-8 text-lg font-semibold text-ink">{label}</p>
              <div className="mt-4 h-1 rounded-full bg-sage/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoginRequired({ title }: { title: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card className="p-8 sm:p-10">
        <Badge>Private Space</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-4 leading-8 text-muted">这里保存的是你的私密内容，请先登录后再进入记忆画廊。</p>
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
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Card className="p-8 sm:p-10">
        <Badge variant="warm">Setup</Badge>
        <h1 className="mt-5 text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-4 leading-8 text-muted">
          还没有配置 Supabase 环境变量。请根据 <code>.env.example</code> 补齐本地环境后重启服务。
        </p>
      </Card>
    </main>
  );
}
