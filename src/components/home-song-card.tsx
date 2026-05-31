"use client";

import { ExternalLink, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getHomeSongDeck, type HomeSongCard as HomeSongCardData, type HomeSongDeck, type HomeSongDeckAction } from "@/lib/home/song-deck";

const fallbackDeck: HomeSongDeck = getHomeSongDeck();

const layers = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 82, y: -78, rotate: -4, scale: 1.03 },
  { x: 188, y: -42, rotate: 5, scale: 0.99 },
] as const;

export function HomeSongCard() {
  const [deck, setDeck] = useState<HomeSongDeck>(fallbackDeck);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const wheelLock = useRef(false);
  const nextLabel = useMemo(() => deck.cards[1]?.track.title || "下一首", [deck.cards]);

  useEffect(() => {
    let cancelled = false;

    async function loadDeck() {
      const response = await fetch("/api/home/song-deck", { cache: "no-store" });
      if (!response.ok) return;
      const nextDeck = (await response.json()) as HomeSongDeck;
      if (!cancelled) setDeck(nextDeck);
    }

    loadDeck().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function requestDeck(action: HomeSongDeckAction, selectedTrackId?: string) {
    const response = await fetch("/api/home/song-deck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeTrackId: deck.activeTrackId, action, selectedTrackId }),
    });

    if (!response.ok) return false;

    const nextDeck = (await response.json()) as HomeSongDeck;
    setDeck(nextDeck);
    return true;
  }

  async function bringForward(selectedTrackId?: string, action: HomeSongDeckAction = "next") {
    const ok = await requestDeck(selectedTrackId ? "select" : action, selectedTrackId);
    if (!ok) {
      setDeck((current) => rotateFallbackDeck(current, selectedTrackId, action));
    }
    setDragX(0);
    setDragY(0);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (wheelLock.current || Math.abs(event.deltaY) < 12) return;
    wheelLock.current = true;
    bringForward(undefined, event.deltaY > 0 ? "next" : "previous");
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 520);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    hasDragged.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!pointerStart.current) return;
    const nextX = event.clientX - pointerStart.current.x;
    const nextY = event.clientY - pointerStart.current.y;
    if (Math.abs(nextX) > 4 || Math.abs(nextY) > 4) hasDragged.current = true;
    setDragX(Math.max(-180, Math.min(180, nextX)));
    setDragY(Math.max(-110, Math.min(110, nextY)));
  }

  function finishDrag() {
    if (!pointerStart.current) return;
    pointerStart.current = null;
    setIsDragging(false);

    if (Math.abs(dragX) > 82 || Math.abs(dragY) > 68) {
      bringForward();
      return;
    }

    setDragX(0);
    setDragY(0);
  }

  function handleFrontClick() {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    setIsPlaying((current) => !current);
  }

  return (
    <div
      aria-label={`点击播放或暂停，拖开当前卡片后下一张会到前面：${nextLabel}`}
      className="relative z-10 aspect-[0.78] w-full max-w-[495px] touch-pan-y overflow-visible"
      onWheel={handleWheel}
      role="group"
    >
      {deck.cards.map((card, offset) => {
        const layer = layers[offset];
        const isFront = offset === 0;
        const x = layer.x + (isFront ? dragX : dragX * 0.08);
        const y = layer.y + (isFront ? dragY : dragY * 0.04);
        const rotate = layer.rotate + (isFront ? dragX / 78 : 0);

        return (
          <button
            aria-hidden={!isFront}
            className={`absolute inset-0 focus:outline-none focus:ring-4 focus:ring-gold/30 ${
              isDragging && isFront ? "cursor-grabbing transition-none" : "cursor-grab transition duration-500 ease-out"
            }`}
            key={card.track.code}
            onClick={isFront ? handleFrontClick : undefined}
            onDoubleClick={!isFront ? () => bringForward(card.track.id) : undefined}
            onPointerCancel={isFront ? finishDrag : undefined}
            onPointerDown={isFront ? handlePointerDown : undefined}
            onPointerMove={isFront ? handlePointerMove : undefined}
            onPointerUp={isFront ? finishDrag : undefined}
            style={{
              transform: `translate(${x}px, ${y}px) scale(${layer.scale}) rotate(${rotate}deg)`,
              zIndex: 30 - offset,
            }}
            tabIndex={isFront ? 0 : -1}
            type="button"
          >
            {card.kind === "player" ? (
              <PlayerCard isPlaying={isPlaying} track={card.track} />
            ) : card.kind === "rust" ? (
              <RustCard isFront={isFront} isPlaying={isPlaying} track={card.track} />
            ) : (
              <ReceiptCard isFront={isFront} isPlaying={isPlaying} track={card.track} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function rotateFallbackDeck(deck: HomeSongDeck, selectedTrackId?: string, action: HomeSongDeckAction = "next") {
  const selectedIndex = selectedTrackId ? deck.cards.findIndex((card) => card.track.id === selectedTrackId) : -1;

  if (selectedIndex > 0) {
    const cards = [...deck.cards.slice(selectedIndex), ...deck.cards.slice(0, selectedIndex)];
    return { activeTrackId: cards[0].track.id, cards };
  }

  if (action === "previous") {
    const cards = [deck.cards[deck.cards.length - 1], ...deck.cards.slice(0, -1)];
    return { activeTrackId: cards[0].track.id, cards };
  }

  const cards = [...deck.cards.slice(1), deck.cards[0]];
  return { activeTrackId: cards[0].track.id, cards };
}

function PlayerCard({ isPlaying, track }: { isPlaying: boolean; track: HomeSongCardData["track"] }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-[22px] bg-[#111316] p-8 text-left text-white shadow-[0_44px_105px_rgba(20,20,18,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%)]" />
      <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.34em] text-white/70">
        <span>{track.code}</span>
        <span>{isPlaying ? "PLAYING" : "AUDIO_IN"}</span>
      </div>

      <div className="relative mx-auto mt-8 grid aspect-square w-[84%] place-items-center">
        <div className="absolute inset-[12%] rounded-full border border-dashed border-white/24" />
        <div className="absolute inset-[24%] rounded-full border border-white/12" />
        <div className="absolute inset-[34%] rounded-full border border-white/20 bg-white/[0.02]" />
        <div className="absolute inset-[43%] rounded-full border border-white/24" />

        <div className={`absolute inset-0 rounded-full ${isPlaying ? "animate-[spin_12s_linear_infinite]" : "animate-[spin_24s_linear_infinite]"}`}>
          {track.bars.map((height, barIndex) => (
            <span
              className="absolute left-1/2 top-1/2 block w-[2px] origin-[50%_calc(50%+145px)] rounded-full bg-white/70 transition-all duration-500 group-hover:bg-white"
              key={`${track.code}-${barIndex}`}
              style={{
                height: `${isPlaying ? height + 12 : height}px`,
                transform: `translate(-50%, -50%) rotate(${barIndex * (360 / track.bars.length)}deg) translateY(-145px)`,
              }}
            />
          ))}
        </div>

        <span
          className="relative grid size-10 place-items-center rounded-full border border-white/24 bg-white/[0.04] text-white shadow-[0_0_28px_rgba(255,255,255,0.08)]"
          style={{ color: track.accent }}
        >
          {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
        </span>
      </div>

      <div className="relative mt-8">
        <p className="font-sans-soft text-sm text-white/62">{track.mood}</p>
        <p className="mt-3 font-sans-soft text-xl leading-7 text-white">{track.title}</p>
        <p className="font-sans-soft text-sm leading-7 text-white/72">{track.artist}</p>
        <p className="font-sans-soft mt-2 text-base leading-7 text-white/86">{track.subtitle}</p>
      </div>

      <div className="relative mt-6 h-px bg-white/10" />
      <div className="relative mt-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-white/58">
        <span>{track.time}</span>
        <span>{track.frequency}</span>
      </div>

      <span className="font-sans-soft absolute bottom-6 right-6 inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/50 opacity-0 transition group-hover:opacity-100">
        {track.sourceLabel}
        <ExternalLink className="size-3" />
      </span>
    </div>
  );
}

function RustCard({
  isFront,
  isPlaying,
  track,
}: {
  isFront: boolean;
  isPlaying: boolean;
  track: HomeSongCardData["track"];
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-[22px] bg-[#c95e3f] p-8 text-[#2b1812] shadow-[0_32px_88px_rgba(84,54,39,0.18)]">
      <div className="absolute inset-x-0 top-0 h-28 bg-white/8" />
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#f0b28b]/22" />
      <p className="font-mono absolute right-6 top-10 rotate-90 text-[11px] uppercase tracking-[0.34em] text-white/48">
        {track.code} emotional frequency
      </p>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#5c2819]/70">
            {isFront ? "now playing" : "next record"}
          </p>
          <p className="mt-4 max-w-[260px] text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-[#2f160f]">
            {track.mood}
          </p>
        </div>
        <span
          className="grid size-12 place-items-center rounded-full border border-[#2f160f]/20 bg-[#2f160f] text-[#f7d0aa]"
          style={{ color: track.accent }}
        >
          {isFront && isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
        </span>
      </div>

      <div className="absolute bottom-8 left-8 right-8">
        <div className="mb-8 flex h-28 items-end gap-2">
          {track.bars.slice(0, 14).map((height, index) => (
            <span
              className="w-1.5 rounded-full bg-[#2f160f]/55"
              key={`${track.code}-rust-${index}`}
              style={{ height: `${Math.max(18, height * 0.78)}px` }}
            />
          ))}
        </div>
        <p className="font-sans-soft text-xl leading-7 text-[#2f160f]">{track.title}</p>
        <p className="font-sans-soft text-sm leading-6 text-[#2f160f]/74">{track.artist}</p>
        <p className="font-sans-soft mt-2 text-base leading-7 text-[#2f160f]/78">{track.subtitle}</p>
      </div>
    </div>
  );
}

function ReceiptCard({
  isFront,
  isPlaying,
  track,
}: {
  isFront: boolean;
  isPlaying: boolean;
  track: HomeSongCardData["track"];
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-[22px] border border-[#c9c6bc] bg-[#dfe0d8]/90 p-9 text-[#3d3932] shadow-[0_24px_70px_rgba(34,31,25,0.12)]">
      <div className="ml-auto grid size-24 place-items-center rounded-full border border-dashed border-[#9b9689] text-center font-mono text-[10px] uppercase leading-4 tracking-[0.18em]">
        official
        <br />
        receipt
        <br />
        {track.code}
      </div>
      <p className="font-mono mt-28 text-[11px] uppercase tracking-[0.3em] text-[#8a8376]">guest name</p>
      <p className="mt-3 border-b border-[#c4bdb0] pb-5 text-2xl">{track.artist}</p>
      <p className="font-mono mt-9 text-[11px] uppercase tracking-[0.3em] text-[#8a8376]">check in</p>
      <p className="mt-3 border-b border-[#c4bdb0] pb-5 text-xl">{track.mood}</p>
      <p className="font-mono mt-9 text-[11px] uppercase tracking-[0.3em] text-[#8a8376]">source</p>
      <p className="mt-3 text-xl">{track.sourceLabel}</p>

      <div className="absolute bottom-8 left-9 right-9">
        <div className="mb-5 flex items-center justify-between border-t border-[#c4bdb0] pt-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8376]">
              {isFront ? "now playing" : "queued"}
            </p>
            <p className="font-sans-soft mt-2 text-sm leading-6 text-[#5c554b]">{track.title}</p>
          </div>
          <span className="grid size-11 place-items-center rounded-full bg-[#3d3932] text-[#efeee5]" style={{ color: track.accent }}>
            {isFront && isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
          </span>
        </div>
      </div>
    </div>
  );
}
