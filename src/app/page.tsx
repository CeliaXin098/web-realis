import { Compass, GalleryVerticalEnd, LogIn, PenLine } from "lucide-react";
import Link from "next/link";
import { HomeSongCard } from "@/components/home-song-card";

const navItems = [
  {
    href: "/reflect",
    label: "AI觉察页",
    eyebrow: "AI REFLECT",
    body: "写下一件具体发生的事，让 AI 陪你看见情绪根源。",
    icon: PenLine,
  },
  {
    href: "/gallery",
    label: "记忆画廊页",
    eyebrow: "MEMORY GALLERY",
    body: "把一次觉察封存成可回看的记忆作品。",
    icon: GalleryVerticalEnd,
  },
  {
    href: "/compass",
    label: "人际罗盘页",
    eyebrow: "RELATION MAP",
    body: "沉淀你和重要他人的互动模式与相处指南。",
    icon: Compass,
  },
];

const notes = [
  { title: "Check-in Info", body: "记录今天最具体的一刻，不急着解释，不急着变好。" },
  { title: "Signal Room", body: "AI 会把情绪、需要、荣格线索整理成一封解读信。" },
  { title: "Quiet Archive", body: "每次觉察都会成为未来可以重新观看的一件记忆作品。" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f5f1e8] text-[#171715]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_20%,rgba(255,255,255,0.78),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(190,193,181,0.2),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.48),transparent_34%,rgba(255,255,255,0.36))]" />
      <div className="absolute bottom-0 left-[8%] top-0 w-px bg-[#d8d2c6]/70" />
      <div className="absolute left-0 top-0 h-full w-[10%] bg-white/18" />
      <div className="absolute right-10 top-20 hidden rotate-90 font-mono text-xs uppercase tracking-[0.55em] text-[#c8c3b7] lg:block">
        Realis Private Receipt
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-94px)] w-full max-w-[1500px] gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-28 lg:px-12 xl:gap-36">
        <section className="relative flex min-h-[760px] items-center justify-center py-8 lg:justify-start lg:pr-10">
          <HomeSongCard />
        </section>

        <aside className="flex flex-col justify-center gap-5 py-8 lg:pl-2">
          <div className="rounded-[30px] border border-[#d8d2c6] bg-[#efede4]/76 p-7 shadow-[0_22px_60px_rgba(34,31,25,0.08)]">
            <p className="font-sans-soft text-sm uppercase tracking-[0.28em] text-[#9c7b35]">About Realis</p>
            <h1 className="mt-5 text-[2.8rem] font-semibold leading-tight tracking-[-0.04em]">
              写给今天情绪的一间安静房间。
            </h1>
            <p className="font-sans-soft mt-5 text-base leading-8 text-[#5d574d]">
              Realis / 返照帮助你记录具体事件，与 AI 对话式觉察情绪根源，并把洞察封存为未来能重新观看的记忆画廊。
            </p>
            <Link
              className="font-sans-soft mt-7 inline-flex items-center gap-3 rounded-full bg-[#171715] px-6 py-3.5 text-base font-semibold text-[#f8f5ee] transition hover:-translate-y-0.5 hover:bg-[#2a2823]"
              href="/auth"
            >
              <LogIn className="size-4" />
              登录进入
            </Link>
          </div>

          <div className="grid gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="group rounded-[26px] border border-[#d8d2c6] bg-white/42 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/72 hover:shadow-[0_18px_48px_rgba(34,31,25,0.09)]"
                  href={item.href}
                  key={item.href}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.26em] text-[#9d9587]">{item.eyebrow}</p>
                      <h2 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.03em]">{item.label}</h2>
                    </div>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f1c24f] text-[#191814] transition group-hover:rotate-6">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <p className="font-sans-soft mt-3 text-base leading-7 text-[#625c52]">{item.body}</p>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="relative mx-auto grid w-full max-w-6xl gap-6 px-5 pb-12 sm:px-8 md:grid-cols-3 lg:-mt-24">
        {notes.map((note, index) => (
          <article className="grid grid-cols-[44px_1fr] gap-4" key={note.title}>
            <span
              className={`grid size-10 place-items-center rounded-full text-sm text-white ${
                index === 0 ? "bg-[#4a4947]" : index === 1 ? "bg-[#d77a5b]" : "bg-[#f1c24f] text-[#1a1814]"
              }`}
            >
              {index + 1}
            </span>
            <div>
              <h3 className="text-2xl font-semibold">{note.title}</h3>
              <p className="font-sans-soft mt-2 text-base leading-7 text-[#5d574d]">{note.body}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
