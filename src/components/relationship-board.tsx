"use client";

import {
  ArrowRight,
  Fingerprint,
  Heart,
  Layers3,
  MoreVertical,
  ScrollText,
  Search,
  Sparkles,
} from "lucide-react";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SoftPanel } from "@/components/ui/card";
import type { UserMemoryProfile } from "@/lib/memory/types";
import type { JungianFunctionInsight } from "@/lib/records/types";
import {
  getQuadrantCopy,
  getRelationshipTemperature,
  getRelationshipHeadline,
  getRelationshipWeather,
  normalizeCompassProfile,
  type NormalizedCompassProfile,
} from "@/lib/relationship/compass";
import { extractMbtiType, formatMbtiLabel } from "@/lib/relationship/self-profile";
import { matchesProfile } from "@/lib/relationship/story-matching";
import { cn } from "@/lib/utils";

export type RelationshipProfile = {
  id: string;
  relationship_type: string;
  nickname: string;
  related_record_count: number;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  mbti_source?: "inferred" | "confirmed";
  jungian_functions?: JungianFunctionInsight[];
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  position_x?: number | null;
  position_y?: number | null;
  relation_label?: string | null;
  interaction_guide: string;
};

export type RelationshipEvent = {
  id: string;
  title: string;
  event_text: string;
  summary: string;
  related_person: string | null;
  emotion_tags: string[];
  created_at: string;
  compass_updates: Array<{
    relationship_type: string;
    nickname: string;
  }>;
};

type RelationshipBoardProps = {
  profiles: RelationshipProfile[];
  events: RelationshipEvent[];
  selfProfile: UserMemoryProfile | null;
};

type NetworkPosition = {
  left: number;
  top: number;
};

export function RelationshipBoard({ events, profiles, selfProfile }: RelationshipBoardProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(profiles[0]?.id);
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [localSelfProfile, setLocalSelfProfile] = useState(selfProfile);
  const relationshipProfiles = useMemo(() => localProfiles.filter((profile) => !isSelfProfile(profile)), [localProfiles]);
  const normalizedProfiles = useMemo(
    () =>
      relationshipProfiles.map((profile) => {
        const eventsText = events
          .filter((event) => matchesProfile(event, profile))
          .map((event) => `${event.title} ${event.event_text} ${event.summary} ${event.emotion_tags.join(" ")}`)
          .join(" ");

        return normalizeCompassProfile(profile, eventsText);
      }),
    [events, relationshipProfiles],
  );
  const selected = normalizedProfiles.find((profile) => profile.id === selectedId) || normalizedProfiles[0];

  const relatedEvents = useMemo(() => {
    if (!selected) return [];
    return events.filter((event) => matchesProfile(event, selected));
  }, [events, selected]);

  useEffect(() => {
    setLocalProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    setLocalSelfProfile(selfProfile);
  }, [selfProfile]);

  useEffect(() => {
    if (selectedId === "self") return;
    if (normalizedProfiles.length === 0) {
      setSelectedId(localSelfProfile ? "self" : undefined);
      return;
    }

    if (!selectedId || !normalizedProfiles.some((profile) => profile.id === selectedId)) {
      setSelectedId(normalizedProfiles[0].id);
    }
  }, [localSelfProfile, normalizedProfiles, selectedId]);

  async function updateSelfMbti(mbti: string) {
    const response = await fetch("/api/self-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mbti_type: mbti }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(result?.error || "保存失败");
    }
    const updated = (await response.json()) as UserMemoryProfile;
    setLocalSelfProfile(updated);
  }

  function updateMbti(id: string, mbti: string) {
    setLocalProfiles((current) =>
      current.map((profile) =>
        profile.id === id ? { ...profile, mbti_tendency: mbti, mbti_source: "confirmed" } : profile,
      ),
    );
  }

  function updateNickname(id: string, nickname: string) {
    setLocalProfiles((current) =>
      current.map((profile) => (profile.id === id ? { ...profile, nickname } : profile)),
    );
    persistPersonProfile({ id, nickname });
  }

  function updatePosition(id: string, position: NetworkPosition) {
    setLocalProfiles((current) =>
      current.map((profile) =>
        profile.id === id ? { ...profile, position_x: position.left, position_y: position.top } : profile,
      ),
    );
    persistPersonProfile({ id, position_x: position.left, position_y: position.top });
  }

  return (
    <section className="mt-8 overflow-visible xl:-mx-16 2xl:-mx-28">
      <div className="grid items-start gap-5 rounded-[38px] border border-[#ddd2c1] bg-[#f6f0e7]/92 p-4 shadow-[0_34px_100px_rgba(74,63,48,0.14)] backdrop-blur sm:p-5 xl:grid-cols-[minmax(790px,1.48fr)_minmax(430px,0.78fr)]">
        <div className="flex min-w-0 flex-col gap-4 overflow-visible">
          <CompassDashboardHeader profilesCount={normalizedProfiles.length} />
          <RelationshipQuadrantMap
            onRename={updateNickname}
            onSelectSelf={() => setSelectedId("self")}
            profiles={normalizedProfiles}
            selectedId={selectedId}
            onPositionChange={updatePosition}
            onSelect={setSelectedId}
          />
          {selectedId !== "self" && selected ? <RelationshipArchive events={relatedEvents} profile={selected} /> : null}
        </div>
        {selectedId === "self" ? (
          <SelfDetail onMbtiSaved={updateSelfMbti} profile={localSelfProfile} />
        ) : selected ? (
          <PersonDetail
            events={relatedEvents}
            onMbtiSaved={(mbti) => updateMbti(selected.id, mbti)}
            onNicknameChange={(nickname) => updateNickname(selected.id, nickname)}
            profile={selected}
          />
        ) : (
          <EmptyQuadrantMap />
        )}
      </div>
    </section>
  );
}

function persistPersonProfile(payload: {
  id: string;
  mbti_tendency?: string;
  nickname?: string;
  position_x?: number;
  position_y?: number;
  relation_label?: string;
}) {
  void fetch("/api/person-profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function CompassDashboardHeader({ profilesCount }: { profilesCount: number }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-[#ded4c4] bg-[#fbf8f1]/72 px-5 py-4 shadow-[0_18px_50px_rgba(74,63,48,0.07)]">
      <div>
        <div className="flex items-center gap-2 text-4xl font-semibold leading-none text-ink">
          人际罗盘
          <Sparkles className="size-5 text-[#b98532]" />
        </div>
        <p className="font-sans-soft mt-3 text-sm text-muted">探索你与重要之人的关系宇宙</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-sans-soft flex items-center gap-2 rounded-full border border-[#ded4c4] bg-white/72 px-4 py-2 text-sm text-muted">
          <Search className="size-4" />
          {profilesCount} 位人物
        </div>
      </div>
    </header>
  );
}

function isSelfProfile(profile: RelationshipProfile) {
  const label = `${profile.relationship_type}${profile.nickname}`.toLowerCase();
  return /自我|自己|本人|me|self/.test(label);
}

function RelationshipQuadrantMap({
  onRename,
  onPositionChange,
  onSelect,
  onSelectSelf,
  profiles,
  selectedId,
}: {
  onRename: (id: string, nickname: string) => void;
  onPositionChange: (id: string, position: NetworkPosition) => void;
  onSelect: (id: string) => void;
  onSelectSelf: () => void;
  profiles: NormalizedCompassProfile[];
  selectedId?: string;
}) {
  const [zoom, setZoom] = useState(1.08);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selfPosition, setSelfPosition] = useState<NetworkPosition>({ left: 50, top: 48 });
  const [nodePositions, setNodePositions] = useState<Record<string, NetworkPosition>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const selfDisplayPosition = getDisplayPosition(selfPosition, zoom);
  const relationshipWeather = useMemo(() => getRelationshipWeather(profiles), [profiles]);

  const positionedProfiles = useMemo(
    () =>
      profiles.map((profile, index) => {
        const logicalPosition =
          nodePositions[profile.id] || getStoredNetworkPosition(profile) || getInfographicNetworkPosition(profile, index, profiles.length);
        return {
          label: "",
          position: getDisplayPosition(logicalPosition, zoom),
          profile,
        };
      }),
    [nodePositions, profiles, zoom],
  );

  function finishDrag() {
    if (draggingId && draggingId !== "self") {
      const profile = profiles.find((item) => item.id === draggingId);
      const position =
        nodePositions[draggingId] ||
        (profile ? getStoredNetworkPosition(profile) : null);
      if (position) onPositionChange(draggingId, position);
    }
    setDraggingId(null);
  }

  function updateDraggedPosition(clientX: number, clientY: number, id = draggingId) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!id || !rect) return;

    const displayLeft = ((clientX - rect.left) / rect.width) * 100;
    const displayTop = ((clientY - rect.top) / rect.height) * 100;
    const logicalLeft = 50 + (displayLeft - 50) / zoom;
    const logicalTop = 48 + (displayTop - 48) / zoom;
    const nextPosition = {
      left: clamp(logicalLeft, 1, 99),
      top: clamp(logicalTop, 4, 94),
    };

    if (id === "self") {
      setSelfPosition(nextPosition);
      return;
    }

    setNodePositions((current) => ({
      ...current,
      [id]: nextPosition,
    }));
  }

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-[#ded4c4] bg-[#f8f2ea] shadow-[0_24px_70px_rgba(74,63,48,0.10)]">
      <div
        className="relative min-h-[560px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_52%_50%,rgba(255,255,255,0.9),rgba(246,239,229,0.82)_42%,rgba(232,221,206,0.78)_100%)] xl:h-[600px]"
        onPointerCancel={finishDrag}
        onPointerLeave={finishDrag}
        onPointerMove={(event) => updateDraggedPosition(event.clientX, event.clientY)}
        onPointerUp={finishDrag}
        ref={canvasRef}
      >
        <div className="absolute inset-0">
          <NetworkCanvasBackground />
          <NetworkLinks items={positionedProfiles} origin={selfDisplayPosition} />
          <SelfNode
            isSelected={selectedId === "self"}
            onSelect={onSelectSelf}
            onStartDrag={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDraggingId("self");
              updateDraggedPosition(event.clientX, event.clientY, "self");
            }}
            position={selfDisplayPosition}
            zoom={zoom}
          />

          {positionedProfiles.map(({ position, profile }, index) => (
            <RelationshipPoint
              isSelected={profile.id === selectedId}
              index={index}
              key={profile.id}
              onRename={onRename}
              onSelect={onSelect}
              onStartDrag={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraggingId(profile.id);
                onSelect(profile.id);
                updateDraggedPosition(event.clientX, event.clientY, profile.id);
              }}
              position={position}
              profile={profile}
              zoom={zoom}
            />
          ))}
        </div>
        <NetworkLegend />
        <RelationshipWeather weather={relationshipWeather} />
        <ViewControls
          onZoomIn={() => setZoom((value) => Math.min(1.32, Number((value + 0.08).toFixed(2))))}
          onZoomOut={() => setZoom((value) => Math.max(0.92, Number((value - 0.08).toFixed(2))))}
        />
      </div>
    </div>
  );
}

function NetworkLegend() {
  const items = [
    ["朋友", "bg-[#7f944d]"],
    ["同事", "bg-[#315f94]"],
    ["伴侣", "bg-[#b74d4f]"],
    ["家人（含父母）", "bg-[#d6b92d]"],
    ["熟人", "bg-[#8f6b9d]"],
    ["其他（含陌生人）", "bg-[#a59c8d]"],
  ];

  return (
    <div className="absolute left-8 top-8 z-50 w-fit rounded-[22px] border border-[#ded4c4] bg-[#fffaf2]/88 p-4 shadow-[0_18px_45px_rgba(74,63,48,0.10)] backdrop-blur">
      <p className="font-sans-soft text-sm font-semibold text-ink">关系图例</p>
      <div className="mt-3 inline-grid grid-cols-[max-content_max-content] gap-x-2 gap-y-2.5">
        {items.map(([label, color]) => (
          <div className="font-sans-soft flex items-center gap-2 text-xs text-muted" key={label}>
            <span className={cn("size-3 shrink-0 rounded-full ring-2 ring-white", color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RelationshipWeather({ weather }: { weather: ReturnType<typeof getRelationshipWeather> }) {
  return (
    <div className="absolute bottom-8 left-8 z-50 rounded-[24px] border border-[#ded4c4] bg-[#fffaf2]/82 p-5 shadow-[0_18px_45px_rgba(74,63,48,0.10)] backdrop-blur">
      <p className="font-sans-soft text-sm font-semibold text-ink">关系天气</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#f0dfb8] text-[#8b642a]">
          <Sparkles className="size-7" />
        </div>
        <div>
          <p className="text-3xl font-semibold text-ink">{weather.temperature > 0 ? `${weather.temperature}°` : "—"}</p>
          <p className="font-sans-soft mt-1 text-xs font-medium text-ink">{weather.label}</p>
          <p className="font-sans-soft mt-1 max-w-48 text-xs leading-5 text-muted">{weather.description}</p>
        </div>
      </div>
    </div>
  );
}

function ViewControls({
  onZoomIn,
  onZoomOut,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="absolute bottom-8 right-8 z-50 rounded-full border border-[#ded4c4] bg-[#fffaf2]/84 p-1.5 shadow-[0_18px_45px_rgba(74,63,48,0.10)] backdrop-blur">
      <div className="flex gap-1.5">
        <button aria-label="缩小关系地图" className="rounded-full border border-[#ded4c4] bg-white/70 px-3 py-1.5 text-sm" onClick={onZoomOut} type="button">
          -
        </button>
        <button aria-label="放大关系地图" className="rounded-full border border-[#ded4c4] bg-white/70 px-3 py-1.5 text-sm" onClick={onZoomIn} type="button">
          +
        </button>
      </div>
    </div>
  );
}

function EmptyQuadrantMap() {
  return (
    <Card className="flex min-h-[420px] items-center justify-center p-6 sm:p-7">
      <div className="max-w-md text-center">
        <Badge>Empty Compass</Badge>
        <h2 className="mt-5 text-3xl font-semibold text-ink">还没有关系点位</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          保存一条带有相关人物的 AI 觉察后，这里会开始生成关系健康度、相处愉悦度、Tier 和相处建议。
        </p>
        <ButtonLink className="mt-6" href="/reflect">
          去完成一次觉察
          <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function NetworkCanvasBackground() {
  const stars = [
    { left: "18%", top: "31%", size: "size-1.5" },
    { left: "27%", top: "17%", size: "size-2" },
    { left: "43%", top: "27%", size: "size-1.5" },
    { left: "63%", top: "22%", size: "size-2" },
    { left: "78%", top: "39%", size: "size-1.5" },
    { left: "72%", top: "68%", size: "size-2" },
    { left: "52%", top: "77%", size: "size-1.5" },
    { left: "25%", top: "70%", size: "size-2" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.92),transparent_16%),radial-gradient(circle_at_50%_48%,rgba(195,181,232,0.34),transparent_34%),radial-gradient(circle_at_42%_56%,rgba(249,185,204,0.18),transparent_28%),radial-gradient(circle_at_62%_38%,rgba(255,225,155,0.18),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(196,179,156,0.12)_1px,transparent_1.7px)] bg-[size:auto,auto,auto,auto,24px_24px]" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
        <defs>
          <filter id="chart-line-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="chart-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="48%" stopColor="#e8defc" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" fill="url(#chart-center-glow)" r="24" />
        {[14, 23, 32, 41, 49].map((radius, index) => (
          <circle
            cx="50"
            cy="50"
            fill="none"
            filter="url(#chart-line-glow)"
            key={radius}
            r={radius}
            stroke={index === 4 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.62)"}
            strokeDasharray={index === 4 ? "1.2 1.8" : undefined}
            strokeWidth={index === 0 ? 0.34 : 0.22}
          />
        ))}
        {[
          [50, 50, 50, 14],
          [50, 50, 72, 22],
          [50, 50, 84, 42],
          [50, 50, 73, 73],
          [50, 50, 50, 84],
          [50, 50, 27, 74],
          [50, 50, 16, 47],
          [50, 50, 29, 23],
        ].map(([x1, y1, x2, y2], index) => (
          <line
            filter="url(#chart-line-glow)"
            key={`${x2}-${y2}`}
            stroke={index % 2 === 0 ? "rgba(255,255,255,0.52)" : "rgba(244,213,162,0.38)"}
            strokeWidth="0.2"
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
          />
        ))}
        {[
          [28, 34],
          [42, 31],
          [61, 32],
          [72, 47],
          [64, 65],
          [44, 70],
          [31, 55],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} fill="rgba(255,255,255,0.9)" r={index % 2 ? 0.52 : 0.68} />
            <circle cx={cx} cy={cy} fill="none" r={index % 2 ? 1.3 : 1.8} stroke="rgba(255,245,209,0.42)" strokeWidth="0.18" />
          </g>
        ))}
      </svg>
      {stars.map((star) => (
        <span
          className={`absolute ${star.size} rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95),0_0_28px_rgba(243,205,126,0.42)]`}
          key={`${star.left}-${star.top}`}
          style={{ left: star.left, top: star.top }}
        />
      ))}
    </div>
  );
}

function RelationshipClusterBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[32px]">
      <div className="absolute left-[8%] top-[12%] h-[43%] w-[40%] rounded-[48%_52%_46%_54%/52%_44%_56%_48%] bg-[#eadfcb]/34 blur-[2px]" />
      <div className="absolute right-[7%] top-[11%] h-[43%] w-[40%] rounded-[52%_48%_55%_45%/48%_56%_44%_52%] bg-[#f4dc82]/20 blur-[2px]" />
      <div className="absolute bottom-[8%] left-[10%] h-[36%] w-[40%] rounded-[46%_54%_44%_56%/52%_45%_55%_48%] bg-[#d9e4ed]/26 blur-[2px]" />
      <div className="absolute bottom-[9%] right-[15%] h-[32%] w-[30%] rounded-[50%] bg-[#efd0c9]/24 blur-[2px]" />
      <div className="absolute left-[42%] top-[34%] h-[35%] w-[30%] rounded-full bg-[#d9cdf4]/22 blur-[3px]" />
    </div>
  );
}

function NetworkLinks({
  items,
  origin,
}: {
  items: Array<{ label: string; position: NetworkPosition; profile: NormalizedCompassProfile }>;
  origin: NetworkPosition;
}) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="relationship-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="relationship-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#b78b43" opacity="0.95" />
        </marker>
      </defs>
      {items.map(({ label, position, profile }, index) => {
        const curve = getCurvePath(origin, position, index);
        const stroke = getRelationStroke(profile.relationType);
        return (
          <g key={profile.id}>
            <path
              d={curve}
              fill="none"
              stroke={stroke}
              strokeLinecap="round"
              strokeOpacity="0.22"
              strokeWidth={profile.tier === 1 ? 0.9 : 0.72}
              filter="url(#relationship-glow)"
            />
            <path
              d={curve}
              fill="none"
              markerEnd="url(#relationship-arrow)"
              stroke={stroke}
              strokeDasharray={profile.tier >= 3 ? "1.7 2.4" : "6 2.2"}
              strokeLinecap="round"
              strokeOpacity="0.82"
              strokeWidth={profile.tier === 1 ? 0.38 : 0.3}
              filter="url(#relationship-glow)"
            />
            <circle cx={position.left} cy={position.top} fill="#fff7df" r="0.62" stroke={stroke} strokeWidth="0.22" />
            {label ? (
              <foreignObject
                height="9"
                width="28"
                x={(origin.left + position.left) / 2 - 14}
                y={(origin.top + position.top) / 2 - 4.5}
              >
                <div className="flex h-full items-center justify-center">
                  <span className="font-sans-soft max-w-full truncate rounded-md border border-[#d7cbb7]/70 bg-[#fffaf1]/94 px-1.5 py-0.5 text-[7px] font-semibold leading-none text-[#6b5b47] shadow-sm">
                    {label}
                  </span>
                </div>
              </foreignObject>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function SelfNode({
  isSelected,
  onSelect,
  onStartDrag,
  position,
  zoom,
}: {
  isSelected: boolean;
  onSelect: () => void;
  onStartDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  position: NetworkPosition;
  zoom: number;
}) {
  const size = 62 * clamp(zoom, 0.92, 1.14);
  const avatar = getAvatarPreset(8);

  return (
    <button
      aria-label="我自己"
      className={cn(
        "absolute z-40 flex -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center text-center transition-[box-shadow,transform] duration-200 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-sage/25",
        isSelected && "scale-105",
      )}
      onClick={onSelect}
      onPointerDown={onStartDrag}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
      type="button"
    >
      <span
        className="relative grid overflow-hidden rounded-full border-[5px] border-white bg-[#efe1d0] shadow-[0_0_0_5px_rgba(255,255,255,0.78),0_0_34px_rgba(74,63,48,0.34)]"
        style={{ height: size, width: size }}
      >
        <span className="absolute inset-0" style={{ background: avatar.backdrop }} />
        <span className="absolute bottom-[12%] left-1/2 h-[56%] w-[52%] -translate-x-1/2 rounded-t-full" style={{ background: avatar.clothes }} />
        <span className="absolute left-1/2 top-[23%] h-[46%] w-[42%] -translate-x-1/2 rounded-[48%_48%_44%_44%] bg-[#f2c7aa]" />
        <span className="absolute left-1/2 top-[15%] h-[36%] w-[54%] -translate-x-1/2 rounded-t-full" style={{ background: avatar.hair }} />
        <span className="absolute left-[38%] top-[44%] size-1 rounded-full bg-[#3c2d28]" />
        <span className="absolute right-[38%] top-[44%] size-1 rounded-full bg-[#3c2d28]" />
        <span className="absolute left-1/2 top-[56%] h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#b87570]" />
      </span>
      <span className="mt-1 rounded-full border border-white/70 bg-[#fff8eb]/94 px-2.5 py-0.5 text-sm font-semibold leading-none text-ink shadow-[0_8px_20px_rgba(74,63,48,0.13)]">
        我
      </span>
    </button>
  );
}

function RelationshipPoint({
  index,
  isSelected,
  onRename,
  onSelect,
  onStartDrag,
  position,
  profile,
  zoom,
}: {
  index: number;
  isSelected: boolean;
  onRename: (id: string, nickname: string) => void;
  onSelect: (id: string) => void;
  onStartDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  position: NetworkPosition;
  profile: NormalizedCompassProfile;
  zoom: number;
}) {
  const tone = getInfographicRelationTone(profile.relationType);
  const avatar = getAvatarPreset(index);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.nickname);
  const score = Math.max(30, Math.min(99, Math.round((profile.healthScore * 12 + profile.joyScore * 8 + (5 - profile.tier) * 7))));

  useEffect(() => {
    setDraftName(profile.nickname);
    setIsEditingName(false);
  }, [profile.id, profile.nickname]);

  function commitName() {
    const nextName = draftName.trim();
    if (nextName && nextName !== profile.nickname) {
      onRename(profile.id, nextName);
    } else {
      setDraftName(profile.nickname);
    }
    setIsEditingName(false);
  }

  return (
    <button
      aria-label={`选择 ${profile.nickname || profile.relationType}，${profile.relationType}，健康度 ${profile.healthScore}，愉悦度 ${profile.joyScore}`}
      aria-pressed={isSelected}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 touch-none select-none flex-col items-center rounded-[999px] text-center transition-[box-shadow,transform] duration-200 hover:z-20 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-sage/25",
        isSelected ? "z-40 ring-4 ring-moss/15" : "z-30",
      )}
      onClick={() => onSelect(profile.id)}
      onPointerDown={onStartDrag}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
      title={`${profile.nickname} · ${profile.relationType}`}
      type="button"
    >
      <span
        className={cn(
          "relative grid overflow-hidden rounded-full border-[5px] bg-[#efe1d0] shadow-[0_0_0_4px_rgba(255,255,255,0.72),0_0_28px_rgba(196,146,84,0.52)]",
          tone.border,
        )}
        style={getAvatarFrameStyle(profile, zoom)}
      >
        <span className="absolute inset-0" style={{ background: avatar.backdrop }} />
        <span className="absolute bottom-[12%] left-1/2 h-[56%] w-[52%] -translate-x-1/2 rounded-t-full" style={{ background: avatar.clothes }} />
        <span className="absolute left-1/2 top-[23%] h-[46%] w-[42%] -translate-x-1/2 rounded-[48%_48%_44%_44%] bg-[#f2c7aa]" />
        <span className="absolute left-1/2 top-[15%] h-[36%] w-[54%] -translate-x-1/2 rounded-t-full" style={{ background: avatar.hair }} />
        <span className="absolute left-[38%] top-[44%] size-1 rounded-full bg-[#3c2d28]" />
        <span className="absolute right-[38%] top-[44%] size-1 rounded-full bg-[#3c2d28]" />
        <span className="absolute left-1/2 top-[56%] h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#b87570]" />
      </span>
      {isEditingName ? (
        <input
          autoFocus
          className="mt-1 w-20 rounded-full border border-[#d8ccba] bg-[#fff8eb]/95 px-2.5 py-0.5 text-center text-xs font-semibold leading-none text-ink shadow-[0_8px_20px_rgba(74,63,48,0.12)] outline-none"
          onBlur={commitName}
          onChange={(event) => setDraftName(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitName();
            if (event.key === "Escape") {
              setDraftName(profile.nickname);
              setIsEditingName(false);
            }
          }}
          value={draftName}
        />
      ) : (
        <span
          className="mt-1 rounded-full border border-white/70 bg-[#fff8eb]/92 px-2.5 py-0.5 text-xs font-semibold leading-none text-ink shadow-[0_8px_20px_rgba(74,63,48,0.12)]"
          onDoubleClick={(event) => {
            event.stopPropagation();
            setIsEditingName(true);
          }}
        >
          {profile.nickname}
        </span>
      )}
      <span className={cn("font-sans-soft mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-none shadow-sm", tone.pill)}>
        <Heart className="size-3 fill-current" />
        {score}
      </span>
      {profile.mbti_tendency ? (
        <span className="sr-only">
          {profile.mbti_tendency}
        </span>
      ) : null}
    </button>
  );
}

function getNetworkPosition(profile: NormalizedCompassProfile, index: number, total: number) {
  const anchors: Record<NormalizedCompassProfile["relationType"], Array<{ left: number; top: number }>> = {
    朋友: [
      { left: 28, top: 22 },
      { left: 18, top: 39 },
      { left: 42, top: 31 },
      { left: 55, top: 21 },
    ],
    同事: [
      { left: 77, top: 27 },
      { left: 88, top: 41 },
      { left: 69, top: 42 },
    ],
    伴侣: [
      { left: 24, top: 72 },
      { left: 36, top: 82 },
    ],
    家人: [
      { left: 60, top: 71 },
      { left: 69, top: 83 },
      { left: 49, top: 82 },
    ],
    熟人: [
      { left: 83, top: 72 },
      { left: 91, top: 84 },
    ],
    其他: [
      { left: 48, top: 12 },
      { left: 15, top: 64 },
      { left: 89, top: 58 },
    ],
  };
  const list = anchors[profile.relationType] || anchors.其他;
  const base = list[index % list.length];
  const ringOffset = total > 1 ? ((index % 5) - 2) * 1.8 : 0;

  return {
    left: Math.min(92, Math.max(8, base.left + ringOffset)),
    top: Math.min(88, Math.max(10, base.top - ringOffset)),
  };
}

function getDisplayPosition(position: NetworkPosition, zoom: number): NetworkPosition {
  return {
    left: clamp(50 + (position.left - 50) * zoom, 1, 99),
    top: clamp(48 + (position.top - 48) * zoom, 6, 92),
  };
}

function getStoredNetworkPosition(profile: Pick<NormalizedCompassProfile, "position_x" | "position_y">) {
  const left = typeof profile.position_x === "number" ? profile.position_x : Number(profile.position_x);
  const top = typeof profile.position_y === "number" ? profile.position_y : Number(profile.position_y);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;

  return {
    left: clamp(left, 1, 99),
    top: clamp(top, 4, 94),
  };
}

function getInfographicNetworkPosition(profile: NormalizedCompassProfile, index: number, total: number) {
  const anchors: Record<NormalizedCompassProfile["relationType"], Array<NetworkPosition>> = {
    朋友: [
      { left: 24, top: 24 },
      { left: 14, top: 39 },
      { left: 37, top: 33 },
      { left: 30, top: 14 },
    ],
    同事: [
      { left: 23, top: 70 },
      { left: 36, top: 80 },
      { left: 43, top: 64 },
    ],
    伴侣: [
      { left: 73, top: 29 },
      { left: 82, top: 42 },
    ],
    家人: [
      { left: 66, top: 21 },
      { left: 82, top: 25 },
      { left: 72, top: 45 },
    ],
    熟人: [
      { left: 77, top: 73 },
      { left: 88, top: 82 },
    ],
    其他: [
      { left: 48, top: 12 },
      { left: 15, top: 64 },
      { left: 89, top: 58 },
    ],
  };
  const list = anchors[profile.relationType] || anchors.其他;
  const base = list[index % list.length];
  const ringOffset = total > 1 ? ((index % 5) - 2) * 1.7 : 0;

  return {
    left: Math.min(92, Math.max(8, base.left + ringOffset)),
    top: Math.min(88, Math.max(10, base.top - ringOffset)),
  };
}

function getCurvePath(origin: NetworkPosition, position: NetworkPosition, index: number) {
  const dx = position.left - origin.left;
  const dy = position.top - origin.top;
  const bend = index % 2 === 0 ? 8 : -8;
  const controlX = origin.left + dx * 0.48 - dy * 0.08 + bend;
  const controlY = origin.top + dy * 0.48 + dx * 0.08 - bend * 0.35;

  return `M ${origin.left} ${origin.top} Q ${controlX} ${controlY} ${position.left} ${position.top}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPointStyle(profile: NormalizedCompassProfile, position: NetworkPosition, zoom: number): CSSProperties {
  const sizeByTier: Record<NormalizedCompassProfile["tier"], number> = {
    1: 108,
    2: 88,
    3: 70,
    4: 56,
  };
  const size = sizeByTier[profile.tier] * clamp(zoom, 0.92, 1.18);

  return {
    height: size,
    left: `${position.left}%`,
    top: `${position.top}%`,
    width: size,
  };
}

function getAvatarFrameStyle(profile: NormalizedCompassProfile, zoom: number): CSSProperties {
  const baseByTier: Record<NormalizedCompassProfile["tier"], number> = {
    1: 58,
    2: 52,
    3: 46,
    4: 40,
  };
  const size = baseByTier[profile.tier] * clamp(zoom, 0.92, 1.14);

  return {
    height: size,
    width: size,
  };
}

function getAvatarPreset(index: number) {
  const presets = [
    {
      backdrop: "linear-gradient(135deg,#f8d3c6,#f3eadc 48%,#d8c5aa)",
      clothes: "linear-gradient(135deg,#7c4f45,#d1a17c)",
      hair: "linear-gradient(135deg,#2c211f,#6a473d)",
    },
    {
      backdrop: "linear-gradient(135deg,#e7d7bd,#fff4dd 52%,#c9975d)",
      clothes: "linear-gradient(135deg,#2f3d3a,#789071)",
      hair: "linear-gradient(135deg,#1d1b1b,#4b3a34)",
    },
    {
      backdrop: "linear-gradient(135deg,#d9dfcf,#f7efdf 52%,#b7a581)",
      clothes: "linear-gradient(135deg,#715d7c,#bda8c6)",
      hair: "linear-gradient(135deg,#3c2925,#8a5b4c)",
    },
    {
      backdrop: "linear-gradient(135deg,#f1ddba,#fff8e6 50%,#d7b36d)",
      clothes: "linear-gradient(135deg,#314968,#7fa0b9)",
      hair: "linear-gradient(135deg,#201b1a,#5d463c)",
    },
    {
      backdrop: "linear-gradient(135deg,#ead3c8,#f8eee2 48%,#cfaa91)",
      clothes: "linear-gradient(135deg,#8b513f,#d68c67)",
      hair: "linear-gradient(135deg,#241c1d,#6d3839)",
    },
    {
      backdrop: "linear-gradient(135deg,#d9d0bd,#fff4df 52%,#bfa873)",
      clothes: "linear-gradient(135deg,#4f6043,#9dae72)",
      hair: "linear-gradient(135deg,#171717,#4a3a31)",
    },
  ];

  return presets[index % presets.length];
}

function getRelationTone(type: NormalizedCompassProfile["relationType"]) {
  const tones = {
    朋友: {
      bg: "bg-[linear-gradient(135deg,rgba(229,236,225,0.96),rgba(255,255,255,0.82))]",
      border: "border-sage/45",
      pill: "bg-white/70 text-moss",
    },
    同事: {
      bg: "bg-[linear-gradient(135deg,rgba(232,215,176,0.90),rgba(255,255,255,0.82))]",
      border: "border-gold/45",
      pill: "bg-white/72 text-[#7b6330]",
    },
    伴侣: {
      bg: "bg-[linear-gradient(135deg,rgba(230,193,170,0.92),rgba(255,255,255,0.82))]",
      border: "border-clay/45",
      pill: "bg-white/72 text-clay",
    },
    家人: {
      bg: "bg-[linear-gradient(135deg,rgba(214,222,205,0.95),rgba(255,255,255,0.82))]",
      border: "border-[#7f8f74]/45",
      pill: "bg-white/72 text-[#596951]",
    },
    熟人: {
      bg: "bg-[linear-gradient(135deg,rgba(226,218,205,0.92),rgba(255,255,255,0.82))]",
      border: "border-[#b9a893]/45",
      pill: "bg-white/72 text-[#806f5d]",
    },
    其他: {
      bg: "bg-[linear-gradient(135deg,rgba(238,234,224,0.94),rgba(255,255,255,0.82))]",
      border: "border-line/80",
      pill: "bg-white/72 text-muted",
    },
  } satisfies Record<NormalizedCompassProfile["relationType"], { bg: string; border: string; pill: string }>;

  return tones[type];
}

function getInfographicRelationTone(type: NormalizedCompassProfile["relationType"]) {
  switch (type) {
    case "朋友":
      return { bg: "bg-[#7f944d] text-white", border: "border-[#7f944d]", pill: "bg-[#7f944d] text-white" };
    case "同事":
      return { bg: "bg-[#315f94] text-white", border: "border-[#315f94]", pill: "bg-[#315f94] text-white" };
    case "伴侣":
      return { bg: "bg-[#b74d4f] text-white", border: "border-[#b74d4f]", pill: "bg-[#b74d4f] text-white" };
    case "家人":
      return { bg: "bg-[#d6b92d] text-[#2b2514]", border: "border-[#d6b92d]", pill: "bg-[#d6b92d] text-[#2b2514]" };
    case "熟人":
      return { bg: "bg-[#8f6b9d] text-white", border: "border-[#8f6b9d]", pill: "bg-[#8f6b9d] text-white" };
    default:
      return { bg: "bg-[#a59c8d] text-white", border: "border-[#a59c8d]", pill: "bg-[#a59c8d] text-white" };
  }
}

function getRelationStroke(type: NormalizedCompassProfile["relationType"]) {
  switch (type) {
    case "朋友":
      return "#6f813f";
    case "同事":
      return "#315f94";
    case "伴侣":
      return "#a64045";
    case "家人":
      return "#d5b817";
    case "熟人":
      return "#806091";
    default:
      return "#817464";
  }
}

function SelfDetail({
  onMbtiSaved,
  profile,
}: {
  onMbtiSaved: (mbti: string) => Promise<void>;
  profile: UserMemoryProfile | null;
}) {
  const [mbti, setMbti] = useState(extractMbtiType(profile?.mbti_type));
  const [status, setStatus] = useState("");
  const functions = completeJungianFunctions(profile?.jungian_functions || []);
  const evidenceCount =
    (profile?.core_needs.length || 0) +
    (profile?.recurring_patterns.length || 0) +
    (profile?.common_triggers.length || 0);
  const selfAcceptance = Math.min(92, 42 + Math.min(evidenceCount, 10) * 5);
  const innerAlignment = Math.min(90, 38 + Math.min(profile?.jungian_functions?.length || 0, 8) * 6);
  const outward = profile?.recurring_patterns[0] || "还需要更多觉察记录，才能看见你惯常如何面对外界。";
  const innerNeeds = profile?.core_needs.length ? profile.core_needs.join("、") : "还没有足够记录来辨认内心需要。";
  const conflicts = profile?.common_triggers.length
    ? `当${profile.common_triggers.slice(0, 3).join("、")}出现时，外在应对与内心需要可能会彼此拉扯。`
    : "目前还没有足够记录形成稳定的内在冲突线索。";

  useEffect(() => {
    setMbti(extractMbtiType(profile?.mbti_type));
  }, [profile?.mbti_type]);

  async function saveMbti() {
    const normalized = extractMbtiType(mbti);
    if (!normalized || normalized !== mbti.trim().toUpperCase()) {
      setStatus("请输入一个完整的四字母 MBTI 类型");
      return;
    }
    setStatus("正在保存...");
    try {
      await onMbtiSaved(normalized);
      setMbti(normalized);
      setStatus("已保存为你的确认类型");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败，请稍后再试");
    }
  }

  return (
    <aside className="flex flex-col gap-4 rounded-[34px] border border-[#d8ccba] bg-[#fbf8f1]/92 p-4 shadow-[0_28px_80px_rgba(74,63,48,0.12)] backdrop-blur sm:p-5">
      <section className="overflow-hidden rounded-[30px] border border-[#ded4c4] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.96),transparent_30%),linear-gradient(135deg,#f1e7d8,#e5ddd2)] p-6">
        <div className="flex items-center gap-5">
          <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-[#ead7c2] text-3xl font-semibold text-ink shadow-[0_18px_45px_rgba(74,63,48,0.16)]">
            我
          </div>
          <div>
            <Badge variant="warm">Self Relationship</Badge>
            <h2 className="mt-3 text-4xl font-semibold text-ink">外在的我，与内心的我</h2>
            <p className="font-sans-soft mt-2 text-sm leading-6 text-muted">这些线索来自你的长期觉察，会随着新记录继续变化。</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
        <section className="flex min-h-48 flex-col items-center justify-center rounded-[26px] border border-[#ddd2c1] bg-[#fffaf2]/86 p-5 text-center">
          <h3 className="font-sans-soft text-xl font-semibold text-ink">
            MBTI{profile?.mbti_source === "inferred" ? "（推测）" : ""}
          </h3>
          <input
            aria-label="我的 MBTI"
            className="mt-5 w-full bg-transparent text-center text-5xl font-semibold uppercase text-ink outline-none placeholder:text-muted/30"
            maxLength={4}
            onChange={(event) => setMbti(event.target.value)}
            placeholder="尚未形成"
            value={mbti}
          />
          <button className="font-sans-soft mt-4 rounded-full bg-night px-4 py-2 text-xs font-medium text-paper" onClick={saveMbti} type="button">
            确认我的 MBTI
          </button>
          {status ? <p className="font-sans-soft mt-3 text-xs text-muted">{status}</p> : null}
        </section>
        <section className="rounded-[26px] border border-[#d4c8dc] bg-[#f3edf4]/82 p-5">
          <h3 className="font-sans-soft text-xl font-semibold text-ink">荣格八维线索</h3>
          <div className="mt-5 space-y-2.5">
            {functions.map((item) => (
              <div className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2" key={item.code}>
                <span className="font-sans-soft text-xs text-muted">{item.code}</span>
                <span className="h-1.5 rounded-full bg-[#e1d6c5]">
                  <span className="block h-full rounded-full bg-[#b9aedf]" style={{ width: `${item.score * 18}%` }} />
                </span>
                <span className="font-sans-soft text-xs text-muted">{item.score * 20}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <SelfInsightCard label="外在表现" text={outward} />
        <SelfInsightCard label="内心需要" text={innerNeeds} />
      </section>

      <section className="rounded-[26px] border border-[#e0c8bd] bg-[#fff0e8]/82 p-5">
        <h3 className="font-sans-soft text-xl font-semibold text-ink">我与自己的关系线索</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelfScore label="自我接纳度" value={selfAcceptance} />
          <SelfScore label="内外一致度" value={innerAlignment} />
        </div>
        <p className="font-sans-soft mt-4 text-xs leading-6 text-muted">分数只表示当前记录中可见线索的丰富程度，不是对你的评判。</p>
      </section>

      <SelfInsightCard label="常见内在冲突" text={conflicts} />
      <SelfInsightCard label="照顾自己的建议" text={profile?.support_style || "先允许感受存在，再决定此刻最需要怎样照顾自己。"} />
    </aside>
  );
}

function SelfInsightCard({ label, text }: { label: string; text: string }) {
  return (
    <section className="rounded-[26px] border border-[#ddd2c1] bg-[#fffaf2]/82 p-5">
      <h3 className="font-sans-soft text-xl font-semibold text-ink">{label}</h3>
      <p className="font-sans-soft mt-3 text-sm leading-7 text-muted">{text}</p>
    </section>
  );
}

function SelfScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] bg-white/55 p-4">
      <span className="grid size-16 shrink-0 place-items-center rounded-full border border-[#e0c8bd] bg-white/75 text-xl font-semibold text-ink">{value}</span>
      <span className="font-sans-soft text-sm font-semibold text-ink">{label}</span>
    </div>
  );
}

function PersonDetail({
  events,
  onMbtiSaved,
  onNicknameChange,
  profile,
}: {
  events: RelationshipEvent[];
  onMbtiSaved: (mbti: string) => void;
  onNicknameChange: (nickname: string) => void;
  profile: NormalizedCompassProfile;
}) {
  const [mbti, setMbti] = useState(extractMbtiType(profile.mbti_tendency));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draftNickname, setDraftNickname] = useState(profile.nickname);
  const functions = completeJungianFunctions(
    profile.jungian_functions?.length ? profile.jungian_functions : inferJungianFunctions(profile, events),
  );
  const quadrant = getQuadrantCopy(profile.quadrant);
  const relationshipTemperature = getRelationshipTemperature(profile);
  const relationshipMetrics = [
    ["信任度", profile.healthScore * 20],
    ["安全感", profile.joyScore * 20],
    ["共鸣度", Math.round((profile.healthScore + profile.joyScore) * 10)],
    ["默契度", Math.min(95, 55 + profile.related_record_count * 8)],
  ] as const;

  useEffect(() => {
    setMbti(extractMbtiType(profile.mbti_tendency));
    setDraftNickname(profile.nickname);
    setSaved(false);
    setSaveError("");
  }, [profile.id, profile.nickname]);

  async function saveMbti(nextMbti = mbti) {
    setSaving(true);
    setSaved(false);
    setSaveError("");

    try {
      const response = await fetch("/api/person-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile.id, mbti_tendency: nextMbti }),
      });

      if (!response.ok) {
        throw new Error("保存失败，请稍后再试。");
      }

      onMbtiSaved(nextMbti);
      setSaved(true);
    } catch {
      setSaveError("保存失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  function commitNickname() {
    const nextName = draftNickname.trim();
    if (nextName && nextName !== profile.nickname) {
      onNicknameChange(nextName);
    } else {
      setDraftNickname(profile.nickname);
    }
  }

  function commitMbti() {
    const nextMbti = extractMbtiType(mbti);
    setMbti(nextMbti);
    if (nextMbti && (nextMbti !== extractMbtiType(profile.mbti_tendency) || profile.mbti_source !== "confirmed")) {
      void saveMbti(nextMbti);
    }
  }

  return (
    <aside className="relative flex flex-col gap-4 rounded-[34px] border border-[#d8ccba] bg-[#fbf8f1]/92 p-4 shadow-[0_28px_80px_rgba(74,63,48,0.12)] backdrop-blur sm:p-5">
      <div className="relative overflow-hidden rounded-[30px] border border-[#ded4c4] bg-[radial-gradient(circle_at_24%_16%,rgba(255,255,255,0.96),transparent_28%),linear-gradient(135deg,rgba(246,238,226,0.98),rgba(236,226,211,0.82))] p-5">
        <button className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-white/70" type="button">
          <MoreVertical className="size-5" />
        </button>
        <div className="flex items-center gap-5">
          <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-[#efe2d0] text-3xl font-semibold text-ink shadow-[0_18px_45px_rgba(74,63,48,0.16)]">
            {profile.nickname.slice(0, 1) || profile.relationType.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <Badge variant="warm">{profile.relationship_type}</Badge>
            <h2 className="mt-3 flex items-center gap-2 text-4xl font-semibold leading-tight text-ink">
              <input
                className="min-w-0 max-w-[13rem] bg-transparent outline-none"
                onBlur={commitNickname}
                onChange={(event) => setDraftNickname(event.target.value)}
                value={draftNickname}
              />
              <Sparkles className="size-5 text-[#b98532]" />
            </h2>
            <p className="font-sans-soft mt-2 text-sm leading-6 text-muted">{getRelationshipHeadline(profile)}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="font-sans-soft rounded-full bg-[#eadfcb] px-3 py-1 text-xs text-[#7d6748]">{quadrant.title}</span>
          <span className="font-sans-soft rounded-full bg-[#efe4d4] px-3 py-1 text-xs text-[#8b642a]">Tier {profile.tier}</span>
          <span className="font-sans-soft rounded-full bg-[#e7dccd] px-3 py-1 text-xs text-moss">知己</span>
        </div>
        <p className="sr-only">
          Tier {profile.tier} · {quadrant.title} · 健康 {profile.healthScore}/5 · 愉悦 {profile.joyScore}/5
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
        <section className="flex min-h-48 flex-col items-center justify-center rounded-[26px] border border-[#ddd2c1] bg-[#fffaf2]/86 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_28px_rgba(74,63,48,0.05)]">
          <h2 className="font-sans-soft text-xl font-semibold text-ink">
            MBTI{profile.mbti_source === "confirmed" ? "" : "（推测）"}
          </h2>
          <input
            aria-label="MBTI 手填"
            className="mt-5 w-full bg-transparent text-center text-5xl font-semibold uppercase text-ink outline-none placeholder:text-lg placeholder:font-normal placeholder:normal-case placeholder:text-muted/45"
            onBlur={commitMbti}
            onChange={(event) => setMbti(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitMbti();
              if (event.key === "Escape") {
                setMbti(extractMbtiType(profile.mbti_tendency));
              }
            }}
            placeholder="INFJ"
            value={mbti}
          />
        </section>
        <section className="rounded-[26px] border border-[#d4c8dc] bg-[#f3edf4]/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_28px_rgba(74,63,48,0.05)]">
          <h2 className="font-sans-soft text-xl font-semibold text-ink">荣格八维</h2>
          <div className="mt-5 space-y-2.5">
            {functions.map((item) => (
              <div className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2" key={`${item.code}-${item.tendency}`}>
                <span className="font-sans-soft text-xs text-muted">{item.code}</span>
                <span className="h-1.5 rounded-full bg-[#e1d6c5]">
                  <span className="block h-full rounded-full bg-[#b9aedf]" style={{ width: `${item.score * 18}%` }} />
                </span>
                <span className="font-sans-soft text-xs text-muted">{item.score * 20}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[26px] border border-[#e0c8bd] bg-[#fff0e8]/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_28px_rgba(74,63,48,0.05)]">
        <div className="flex items-center justify-between">
          <h2 className="font-sans-soft text-xl font-semibold text-ink">关系温度</h2>
          <Heart className="size-5 fill-[#d88080] text-[#d88080]" />
        </div>
        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[9rem_1fr]">
          <div
            className="grid size-36 shrink-0 place-items-center rounded-full p-[10px]"
            style={{ background: `conic-gradient(#dca7a0 ${relationshipTemperature}%, #edd8d2 0)` }}
          >
            <div className="grid size-full place-items-center rounded-full bg-[#fff8f3] text-center">
              <div>
                <p className="text-4xl font-semibold text-ink">{relationshipTemperature}</p>
                <p className="font-sans-soft mt-1 text-xs text-muted">{quadrant.title}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {relationshipMetrics.map(([label, value]) => (
              <div className="grid grid-cols-[4rem_1fr_2.5rem] items-center gap-2" key={label}>
                <span className="font-sans-soft text-xs text-muted">{label}</span>
                <span className="h-1.5 rounded-full bg-[#e1d6c5]">
                  <span className="block h-full rounded-full bg-[#dca7a0]" style={{ width: `${value}%` }} />
                </span>
                <span className="font-sans-soft grid size-9 place-items-center rounded-full border border-[#e0c8bd] bg-white/70 text-[10px] font-semibold text-muted">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {saving || saved || saveError ? (
        <p className="font-sans-soft -mt-1 px-2 text-xs text-muted">
          {saving ? "正在自动保存..." : saveError || (saved ? "已自动保存" : "")}
        </p>
      ) : null}

      <RelationModeCard profile={profile} />
      <RelationshipAdviceCard guide={profile.interaction_guide} />
    </aside>
  );
}

function RelationshipArchive({
  events,
  profile,
}: {
  events: RelationshipEvent[];
  profile: NormalizedCompassProfile;
}) {
  return (
    <section className="pt-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-ink">我们的故事</h3>
          <p className="font-sans-soft mt-1 text-sm text-muted">共同记忆时间轴</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="font-sans-soft rounded-full border border-[#ded4c4] bg-white/70 px-4 py-2 text-xs text-muted" type="button">
            全部事件
          </button>
        </div>
      </div>

      <div className="relative mt-8 overflow-x-auto overflow-y-visible pb-3 [scrollbar-color:#d8ccba_transparent] [scrollbar-width:thin]">
        <div className="pointer-events-none absolute left-8 top-[0.55rem] hidden h-px min-w-[880px] bg-[#d8ccba] xl:block" style={{ width: `${Math.max(events.length, 4) * 16}rem` }} />
        <div className="relative flex min-w-max gap-3 pt-8">
        {events.length > 0 ? (
          events.map((event) => (
            <article className="relative w-64 shrink-0 rounded-[24px] border border-[#ddd2c1] bg-[linear-gradient(135deg,#fffdf8,#f5ecde)] p-4 shadow-[0_10px_26px_rgba(74,63,48,0.055)] sm:p-5" key={event.id}>
              <span className="absolute left-1/2 top-[-2.15rem] hidden size-3 -translate-x-1/2 rounded-full bg-[#b6a3d8] ring-4 ring-[#fbf8f1] xl:block" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="max-w-xl text-lg font-semibold leading-snug text-ink">{event.title}</h4>
                <time className="font-sans-soft text-xs text-muted">
                  {new Date(event.created_at).toLocaleDateString("zh-CN")}
                </time>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{event.event_text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {event.emotion_tags.map((tag) => (
                  <span className="font-sans-soft rounded-full bg-sage/10 px-2.5 py-1 text-xs text-moss" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <SoftPanel className="p-6">
            <p className="text-sm leading-7 text-muted">还没有可关联的具体事件。</p>
          </SoftPanel>
        )}
        </div>
      </div>
    </section>
  );
}

function RelationModeCard({ profile }: { profile: NormalizedCompassProfile }) {
  const tags = profile.relationModeTags.length > 0 ? profile.relationModeTags : ["情感共鸣强", "价值观高度契合", "相互成长支持"];

  return (
    <section className="rounded-[26px] border border-[#e0c8bd] bg-[#fff0e8]/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_28px_rgba(74,63,48,0.05)]">
      <h2 className="font-sans-soft text-xl font-semibold text-ink">关系模式分析</h2>
      <p className="sr-only">关系模式标签</p>
      <p className="font-sans-soft mt-4 text-xs text-muted">你们属于</p>
      <h3 className="mt-2 text-2xl font-semibold text-[#c85f55]">{profile.quadrant === "q1" ? "灵魂共振型关系" : "需要校准的关系"}</h3>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-28 w-52">
          <div className="absolute left-7 top-4 grid size-24 place-items-center rounded-full bg-[radial-gradient(circle,rgba(179,198,238,0.8),rgba(179,198,238,0.18))] text-sm font-semibold text-[#596d9c] shadow-[0_12px_36px_rgba(116,137,183,0.16)]">
            你
          </div>
          <div className="absolute right-7 top-4 grid size-24 place-items-center rounded-full bg-[radial-gradient(circle,rgba(238,179,170,0.8),rgba(238,179,170,0.18))] text-sm font-semibold text-[#a25751] shadow-[0_12px_36px_rgba(180,109,99,0.16)]">
            {profile.nickname}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="sr-only">还在观察中</span>
        {tags.slice(0, 4).map((tag) => (
          <span className="font-sans-soft rounded-full bg-[#f2e2c9] px-3 py-1 text-xs text-[#9a6c32]" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function RelationshipAdviceCard({ guide }: { guide: string }) {
  const suitable = ["深度对话与分享", "一起探索新事物", "给予情感支持", "共同成长进步"];
  const avoid = ["过度理性分析", "情绪压抑不表达", "忽视对方感受", "过度依赖"];

  return (
    <section className="rounded-[26px] border border-[#d7d1be] bg-[#f5f0df]/86 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_28px_rgba(74,63,48,0.05)]">
      <h2 className="font-sans-soft text-xl font-semibold text-ink">下一次可以这样相处</h2>
      {guide ? <p className="mt-3 text-sm leading-6 text-muted">{guide}</p> : null}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="font-sans-soft text-sm font-semibold text-moss">适合</h3>
          <div className="mt-3 space-y-3">
            {suitable.map((item) => (
              <p className="font-sans-soft flex items-center gap-2 text-sm text-muted" key={item}>
                <span className="text-moss">✓</span>
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-sans-soft text-sm font-semibold text-[#c85f55]">避免</h3>
          <div className="mt-3 space-y-3">
            {avoid.map((item) => (
              <p className="font-sans-soft flex items-center gap-2 text-sm text-muted" key={item}>
                <span className="text-[#c85f55]">×</span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const JUNGIAN_FUNCTION_CODES = ["Ni", "Ne", "Si", "Se", "Ti", "Te", "Fi", "Fe"] as const;

function completeJungianFunctions(functions: JungianFunctionInsight[]): JungianFunctionInsight[] {
  const byCode = new Map(functions.map((item) => [item.code, item]));

  return JUNGIAN_FUNCTION_CODES.map(
    (code) =>
      byCode.get(code) || {
        code,
        tendency: "还需要更多相处记录才能形成线索",
        evidence: "当前证据不足，暂时保持开放观察",
        score: 1,
      },
  );
}

function inferJungianFunctions(profile: RelationshipProfile, events: RelationshipEvent[]): JungianFunctionInsight[] {
  const text = `${profile.mbti_tendency} ${profile.relationship_pattern_summary} ${profile.common_triggers.join(" ")} ${events
    .map((event) => `${event.title} ${event.event_text} ${event.emotion_tags.join(" ")}`)
    .join(" ")}`;

  if (/T|Te|效率|结果|方案|工作|会议|推进/.test(text)) {
    return [
      {
        code: "Te",
        tendency: "更容易被效率、结果与外部评价牵动",
        evidence: "近期事件里出现了任务推进、贡献是否被看见等线索",
        score: 3,
      },
      {
        code: "Fi",
        tendency: "对真实感、尊重感和个人价值较敏感",
        evidence: "触发点集中在被忽略、被理解不足或表达受阻",
        score: 3,
      },
    ];
  }

  if (/F|Fi|Fe|关系|回应|照顾|冲突|委屈|失落/.test(text)) {
    return [
      {
        code: "Fi",
        tendency: "会优先感知内在价值是否被尊重",
        evidence: "记录里更常出现委屈、失落或被看见的需要",
        score: 3,
      },
      {
        code: "Fe",
        tendency: "容易捕捉关系氛围与他人的反应",
        evidence: "关系模式中出现了互动节奏、回应方式与情绪承接",
        score: 3,
      },
    ];
  }

  return [
    {
      code: "Ni",
      tendency: "倾向从事件背后寻找长期模式",
      evidence: "当前资料较少，先以关系模式和反复触发点作为轻量推测",
      score: 2,
    },
    {
      code: "Si",
      tendency: "会从既往经验里判断这段关系是否安全",
      evidence: "事件记录会逐渐沉淀出熟悉的反应路径",
      score: 2,
    },
  ];
}

function InsightBlock({
  children,
  className = "",
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  icon: typeof Fingerprint;
  title: string;
}) {
  return (
    <section className={`rounded-[26px] border border-[#ddd2c1] bg-[#f1eadf] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] ${className}`}>
      <h3 className="font-sans-soft flex items-center gap-2 text-sm font-medium text-moss">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{children}</p>
    </section>
  );
}
