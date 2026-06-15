import { Compass, GalleryVerticalEnd, PenLine, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "首页" },
  { href: "/reflect", label: "AI觉察", icon: PenLine },
  { href: "/gallery", label: "记忆画廊", icon: GalleryVerticalEnd },
  { href: "/compass", label: "人际罗盘", icon: Compass },
];

export async function Navigation() {
  let currentUser: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUser = user;
    } catch {
      currentUser = null;
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-porcelain/86 backdrop-blur-2xl">
      <nav className="grid min-h-[94px] w-full grid-cols-[1fr_auto_1fr] items-center gap-5 px-5 py-4 sm:px-9 lg:px-14">
        <Link className="group inline-flex w-fit items-center gap-3 justify-self-start" href="/">
          <span className="grid size-14 place-items-center rounded-[22px] bg-night text-xl text-paper shadow-[0_14px_34px_rgba(24,35,31,0.18)] transition group-hover:-rotate-3">
            返
          </span>
          <span>
            <span className="block text-xl font-semibold tracking-wide text-ink">Realis</span>
            <span className="font-sans-soft block text-base tracking-[0.2em] text-muted">返照</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 rounded-full border border-line/70 bg-white/58 p-2 shadow-sm md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                className="font-sans-soft inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-lg text-muted transition hover:bg-paper hover:text-ink"
                href={link.href}
                key={link.href}
              >
                {Icon ? <Icon className="size-4" /> : null}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 justify-self-end">
          <ButtonLink className="min-h-12 max-w-[220px] px-6 text-lg" href={currentUser ? "/reflect" : "/auth"} variant="secondary">
            {currentUser ? <UserRound className="size-5 shrink-0" /> : <Sparkles className="size-4 shrink-0" />}
            <span className="truncate">{currentUser ? "已登录" : "登录"}</span>
          </ButtonLink>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              className="font-sans-soft inline-flex shrink-0 items-center gap-2 rounded-full border border-line/70 bg-white/48 px-3 py-2 text-xs text-muted"
              href={link.href}
              key={link.href}
            >
              {Icon ? <Icon className="size-3.5" /> : null}
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
