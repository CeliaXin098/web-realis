"use client";

import { CalendarDays, ChevronDown, ChevronUp, Film, GalleryVerticalEnd, Heart, Music, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReflectionRecord } from "@/lib/records/types";
import { cn } from "@/lib/utils";

const memoryPhotos = [
  "/memory-gallery/water-green.jpg",
  "/memory-gallery/blue-horse.jpg",
  "/memory-gallery/yellow-field.jpg",
  "/memory-gallery/night-balloons.jpg",
];

type MemoryPosition = {
  opacity: string;
  scale: string;
  translateY: string;
  width: string;
  zIndex: number;
};

const desktopPositions: Record<number, MemoryPosition> = {
  "-3": { opacity: "0.14", scale: "0.58", translateY: "-548px", width: "340px", zIndex: 1 },
  "-2": { opacity: "0.32", scale: "0.7", translateY: "-382px", width: "420px", zIndex: 2 },
  "-1": { opacity: "0.64", scale: "0.84", translateY: "-206px", width: "520px", zIndex: 3 },
  "0": { opacity: "1", scale: "1", translateY: "0px", width: "648px", zIndex: 5 },
  "1": { opacity: "0.64", scale: "0.84", translateY: "228px", width: "520px", zIndex: 3 },
  "2": { opacity: "0.32", scale: "0.7", translateY: "418px", width: "420px", zIndex: 2 },
  "3": { opacity: "0.14", scale: "0.58", translateY: "578px", width: "340px", zIndex: 1 },
};

export function GalleryBoard({ records }: { records: ReflectionRecord[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [customCovers, setCustomCovers] = useState<Record<string, string>>({});
  const activeRecord = records[activeIndex] || records[0];
  const customCoverUrls = useRef<string[]>([]);

  const visibleMemories = useMemo(
    () =>
      records
        .map((record, index) => ({ record, index, offset: getShortestOffset(index, activeIndex, records.length) }))
        .filter((item) => Math.abs(item.offset) <= 3),
    [activeIndex, records],
  );

  useEffect(() => {
    return () => {
      customCoverUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function move(step: number) {
    setActiveIndex((current) => (current + step + records.length) % records.length);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    move(event.deltaY > 0 ? 1 : -1);
  }

  function resolveCover(record: ReflectionRecord, index: number) {
    return record.cover_image_url || customCovers[record.id] || memoryPhotos[index % memoryPhotos.length];
  }

  function handleCoverUpload(recordId: string, file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    customCoverUrls.current.push(url);
    setCustomCovers((current) => {
      const previous = current[recordId];
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return { ...current, [recordId]: url };
    });
  }

  return (
    <section className="relative left-1/2 -mt-4 min-h-[1010px] w-screen -translate-x-1/2 overflow-visible px-6 sm:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_38%,rgba(255,255,255,0.72),rgba(236,226,208,0.22)_38%,transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(90deg,rgba(108,90,64,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(108,90,64,0.03)_1px,transparent_1px)] bg-[size:92px_92px] opacity-55" />

      <div className="relative mx-auto grid min-h-[1010px] max-w-[1720px] gap-14 lg:grid-cols-[0.66fr_1.34fr] xl:grid-cols-[0.62fr_1.38fr]">
        <div className="relative min-h-[1010px] overflow-visible">
          <div className="relative z-30 -ml-20 flex max-w-[960px] items-start gap-7">
            <div className="flex shrink-0 items-center gap-5 rounded-[32px] border border-line/70 bg-[#faf7ef]/82 p-6 shadow-[0_16px_44px_rgba(84,65,44,0.07)] backdrop-blur">
              <span className="grid size-16 place-items-center rounded-[22px] bg-moss text-white shadow-lg shadow-moss/20">
                <GalleryVerticalEnd className="size-7" />
              </span>
              <div>
                <p className="font-sans-soft text-3xl font-semibold text-ink">记忆馆藏</p>
                <p className="mt-3 text-6xl font-semibold text-ink">{records.length}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-4 h-[840px] overflow-visible" onWheel={handleWheel}>
            <div className="absolute left-[28%] top-1/2 h-[840px] w-[760px] -translate-x-1/2 -translate-y-1/2 overflow-visible">
              {visibleMemories.map(({ record, index, offset }) => (
                <VerticalMemoryCard
                  active={offset === 0}
                  coverImage={resolveCover(record, index)}
                  index={index}
                  key={record.id}
                  offset={offset}
                  onCoverUpload={(file) => handleCoverUpload(record.id, file)}
                  onSelect={() => setActiveIndex(index)}
                  record={record}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-[28%] z-30 flex -translate-x-1/2 items-center gap-3">
              <button
                aria-label="上一条记忆"
                className="grid size-12 place-items-center rounded-full border border-line bg-white/82 text-muted shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-ink"
                onClick={() => move(-1)}
                type="button"
              >
                <ChevronUp className="size-5" />
              </button>
              <button
                aria-label="下一条记忆"
                className="grid size-12 place-items-center rounded-full border border-line bg-white/82 text-muted shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-ink"
                onClick={() => move(1)}
                type="button"
              >
                <ChevronDown className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <MemoryDetailPanel record={activeRecord} />
      </div>
    </section>
  );
}

function getShortestOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function VerticalMemoryCard({
  active,
  coverImage,
  index,
  offset,
  onCoverUpload,
  onSelect,
  record,
}: {
  active: boolean;
  coverImage: string;
  index: number;
  offset: number;
  onCoverUpload: (file?: File) => void;
  onSelect: () => void;
  record: ReflectionRecord;
}) {
  const position = desktopPositions[offset] || desktopPositions[0];
  const isTall = index % 3 === 1;
  const dateLabel = new Date(record.created_at).toLocaleDateString("zh-CN");
  const personLabel = record.related_person || "只与我有关";

  return (
    <button
      className={cn(
        "group absolute left-1/2 top-1/2 overflow-hidden rounded-[34px] bg-stone-200 text-left text-white outline-none transition-all duration-700 ease-out focus-visible:ring-4 focus-visible:ring-gold/40",
        active ? "shadow-[0_38px_110px_rgba(84,65,44,0.32)] ring-2 ring-white/85" : "shadow-[0_18px_52px_rgba(84,65,44,0.18)]",
      )}
      onClick={onSelect}
      style={{
        height: active ? (isTall ? 570 : 462) : isTall ? 340 : 260,
        opacity: position.opacity,
        transform: `translate(-50%, calc(-50% + ${position.translateY})) scale(${position.scale})`,
        width: position.width,
        zIndex: position.zIndex,
      }}
      type="button"
    >
      <span
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${coverImage})` }}
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,8,0.12),rgba(6,10,8,0.1)_30%,rgba(6,10,8,0.7)_100%)]" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(255,255,255,0.26),transparent_24%)]" />
      <span className="absolute left-8 top-7 flex flex-wrap gap-2 font-sans-soft text-sm font-medium text-white drop-shadow">
        <span className="rounded-full bg-black/20 px-3 py-1 backdrop-blur-sm">{dateLabel}</span>
        <span className="rounded-full bg-black/20 px-3 py-1 backdrop-blur-sm">{personLabel}</span>
      </span>
      {active ? (
        <label
          className="font-sans-soft absolute right-7 top-7 cursor-pointer rounded-full bg-white/18 px-3 py-1 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          更换封面
          <input
            accept="image/*"
            className="sr-only"
            onChange={(event) => onCoverUpload(event.target.files?.[0])}
            type="file"
          />
        </label>
      ) : null}
      <span className="absolute bottom-8 left-8 right-8 text-white">
        <span className="block line-clamp-2 text-4xl font-semibold leading-tight tracking-[-0.045em] text-white drop-shadow">
          {record.title}
        </span>
        {active ? (
          <span className="mt-4 block line-clamp-3 font-sans-soft text-lg leading-8 text-white/90 drop-shadow">{record.summary}</span>
        ) : null}
      </span>
    </button>
  );
}

function MemoryDetailPanel({ record }: { record: ReflectionRecord }) {
  const reasoningNotes = record.reasoning_notes;

  return (
    <aside className="relative mt-10 min-h-[900px] overflow-visible py-2 lg:pr-6">
      <div className="pointer-events-none absolute right-0 top-8 h-56 w-56 rounded-full bg-gold/14 blur-3xl" />
      <div className="relative min-h-[860px] rounded-[34px] border border-[#d8c9b3] bg-[#f3f0e8]/96 p-6 shadow-[0_24px_76px_rgba(84,65,44,0.14)] backdrop-blur">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-stretch">
          <header className="rounded-[30px] border border-[#d8c9b3] bg-[#faf7ef] p-6 shadow-[0_16px_44px_rgba(84,65,44,0.07)]">
            <p className="font-sans-soft text-2xl font-semibold tracking-[0.08em] text-clay">当前记忆</p>
            <time className="font-sans-soft mt-5 flex items-center gap-2 text-lg text-muted">
              <CalendarDays className="size-5" />
              {new Date(record.created_at).toLocaleDateString("zh-CN")}
            </time>
            <h2 className="text-balance mt-5 text-[3.5rem] font-semibold leading-tight tracking-[-0.045em] text-ink xl:text-[4rem]">
              {record.title}
            </h2>
            <p className="mt-5 text-xl leading-9 text-muted">{record.summary}</p>
          </header>

          <InfoCard title="当时记录">
            <p className="text-xl leading-9 text-ink">{record.event_text}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {record.emotion_tags.map((tag) => (
                <span className="font-sans-soft rounded-full bg-sage/12 px-3 py-1 text-base font-medium text-moss" key={tag}>
                  {tag}
                </span>
              ))}
              <span className="font-sans-soft rounded-full bg-gold/14 px-3 py-1 text-base font-medium text-[#7b6330]">
                强度 {record.emotion_intensity}/10
              </span>
              {record.related_person ? (
                <span className="font-sans-soft rounded-full bg-clay/12 px-3 py-1 text-base font-medium text-clay">
                  {record.related_person}
                </span>
              ) : null}
            </div>
          </InfoCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <InfoCard basis={reasoningNotes?.emotional_root_basis} title="深层原因">
            {record.emotional_root}
          </InfoCard>
          <InfoCard basis={reasoningNotes?.pattern_basis} title="模式线索">
            {record.pattern}
          </InfoCard>
          <InfoCard title="给未来的自己">
            <Sparkles className="mb-3 size-6 text-[#9a7331]" />
            {record.future_self_note}
            <ReasonNote basis={reasoningNotes?.future_self_note_basis} fallback="这条旧记录没有保存给未来自己的推断依据。" />
          </InfoCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <Prescription
            icon={<Film className="size-6" />}
            items={record.prescriptions.film}
            reasons={reasoningNotes?.prescription_reasons.film || []}
            title="电影"
          />
          <Prescription
            icon={<Music className="size-6" />}
            items={record.prescriptions.music}
            reasons={reasoningNotes?.prescription_reasons.music || []}
            title="音乐"
          />
          <Prescription
            icon={<Heart className="size-6" />}
            items={record.prescriptions.action}
            reasons={reasoningNotes?.prescription_reasons.action || []}
            title="行动"
          />
        </div>
      </div>
    </aside>
  );
}

function ReasonNote({
  basis,
  fallback = "这条旧记录没有保存推断依据。",
  label = "推断依据",
}: {
  basis?: string;
  fallback?: string;
  label?: string;
}) {
  return (
    <p className="font-sans-soft mt-4 rounded-2xl bg-[#ece6da] px-4 py-3 text-sm leading-6 text-muted">
      {label}：{basis?.trim() || fallback}
    </p>
  );
}

function InfoCard({ basis, children, title }: { basis?: string; children: React.ReactNode; title: string }) {
  return (
    <article className="rounded-[28px] border border-[#d8c9b3] bg-[#faf7ef] p-6 text-muted shadow-[0_14px_38px_rgba(84,65,44,0.07)]">
      <h3 className="font-sans-soft text-2xl font-semibold tracking-[0.06em] text-sage">{title}</h3>
      <div className="mt-4 text-lg leading-8">{children}</div>
      {basis !== undefined ? <ReasonNote basis={basis} /> : null}
    </article>
  );
}

function Prescription({
  icon,
  items,
  reasons,
  title,
}: {
  icon: React.ReactNode;
  items: string[];
  reasons: string[];
  title: string;
}) {
  return (
    <article className="rounded-[28px] border border-[#d8c9b3] bg-[#faf7ef] p-6 text-muted shadow-[0_14px_38px_rgba(84,65,44,0.07)]">
      <h3 className="flex items-center gap-2 font-sans-soft text-2xl font-semibold tracking-[0.02em] text-ink">
        {icon}
        {title}
      </h3>
      <ul className="mt-4 space-y-3 text-lg leading-8">
        {items.slice(0, 3).map((item, index) => (
          <li key={item}>
            {item}
            <ReasonNote basis={reasons[index]} fallback="这条旧记录没有保存推荐理由。" label="推荐理由" />
          </li>
        ))}
      </ul>
    </article>
  );
}

