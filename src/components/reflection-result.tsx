import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  HeartHandshake,
  Music2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { ReflectionOutput } from "@/lib/ai/reflection-schema";
import { Button } from "@/components/ui/button";

const labels = {
  film: { label: "电影", icon: Clapperboard },
  book: { label: "书籍", icon: BookOpen },
  music: { label: "音乐", icon: Music2 },
  action: { label: "行动", icon: Wand2 },
};

export function ReflectionResult({
  reflection,
  onSave,
  saving,
  saved,
}: {
  reflection: ReflectionOutput;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
}) {
  const jungianInsights = reflection.compass_updates.flatMap((update) =>
    (update.jungian_functions || []).map((item) => ({
      ...item,
      person: update.nickname || update.relationship_type,
    })),
  );

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#e0d8ca] bg-[#fffdf8]/80 shadow-[0_18px_55px_rgba(74,63,48,0.08)]">
      <header className="border-b border-[#e0d8ca] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(242,235,225,0.88))] px-6 py-7">
        <p className="font-sans-soft inline-flex items-center gap-2 rounded-full bg-[#efe7d9] px-3 py-1 text-xs text-[#7d6748]">
          <Sparkles className="size-3.5" />
          AI 觉察信
        </p>
        <h2 className="mt-5 text-4xl font-semibold leading-tight text-ink">{reflection.title}</h2>
        <p className="mt-5 border-l-2 border-[#b98532]/50 pl-5 text-base leading-8 text-muted">{reflection.summary}</p>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <LetterBlock title="亲爱的你">{reflection.gentle_response}</LetterBlock>
        <div className="grid gap-4 md:grid-cols-2">
          <LetterBlock title="深层原因">{reflection.emotional_root}</LetterBlock>
          <LetterBlock title="潜在需要">{reflection.underlying_needs.join("、")}</LetterBlock>
        </div>
        <LetterBlock title="荣格功能与模式线索">{reflection.pattern}</LetterBlock>

        {jungianInsights.length > 0 ? (
          <section className="rounded-[24px] border border-[#e0d8ca] bg-[#f8f2ea]/86 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-ink">荣格功能解读</h3>
                <p className="font-sans-soft mt-2 text-sm leading-6 text-muted">
                  这不是人格定论，只是从这次对话里提炼出的功能线索。
                </p>
              </div>
              <span className="font-sans-soft rounded-full bg-white/72 px-3 py-1 text-xs text-muted">Jungian Functions</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {jungianInsights.map((item) => (
                <article className="rounded-[20px] border border-[#ded6c8] bg-white/64 p-4" key={`${item.person}-${item.code}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-sans-soft text-lg font-semibold text-ink">{item.code}</span>
                    <span className="font-sans-soft rounded-full bg-sage/10 px-2.5 py-1 text-xs text-moss">
                      {item.score}/5
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.tendency}</p>
                  <p className="font-sans-soft mt-2 text-xs leading-5 text-muted/80">{item.evidence}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className="text-2xl font-semibold text-ink">治愈处方</h3>
          <p className="font-sans-soft mt-2 text-sm leading-6 text-muted">
            不是命令，而是给今天的你一个可以选择的温柔方向。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(reflection.prescriptions).map(([key, values]) => {
              const item = labels[key as keyof typeof labels];
              const Icon = item.icon;
              return (
                <section className="rounded-[22px] border border-[#ded6c8] bg-[#fbf8f1]/74 p-4" key={key}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-moss/10 text-moss">
                      <Icon className="size-5" />
                    </span>
                    <p className="font-semibold text-ink">{item.label}</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {values.map((value) => (
                      <li key={value}>· {value}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <blockquote className="rounded-[24px] border border-[#e4cf9d] bg-[#f4ead4]/72 p-5 leading-8 text-[#6f5930]">
          “{reflection.future_self_note}”
        </blockquote>

        {reflection.safety_note ? (
          <p className="rounded-2xl border border-clay/30 bg-clay/10 p-4 text-sm leading-6 text-[#8a4b39]">
            {reflection.safety_note}
          </p>
        ) : null}

        {onSave ? (
          <Button className="w-full" disabled={saving || saved} onClick={onSave} type="button">
            {saved ? (
              <>
                <CheckCircle2 className="size-4" />
                已保存到记忆画廊
              </>
            ) : saving ? (
              "正在封存..."
            ) : (
              <>
                <HeartHandshake className="size-4" />
                保存到记忆画廊
              </>
            )}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function LetterBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[24px] border border-[#ded6c8] bg-white/62 p-5">
      <h3 className="font-sans-soft text-sm font-semibold text-moss">{title}</h3>
      <p className="mt-3 leading-8 text-muted">{children}</p>
    </section>
  );
}
