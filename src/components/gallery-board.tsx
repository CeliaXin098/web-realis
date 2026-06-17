"use client";

import { Html, Float, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import { ImagePlus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ReflectionRecord } from "@/lib/records/types";
import { cn } from "@/lib/utils";

const memoryPhotos = [
  "/memory-gallery/water-green.jpg",
  "/memory-gallery/blue-horse.jpg",
  "/memory-gallery/yellow-field.jpg",
  "/memory-gallery/night-balloons.jpg",
];

const radius = 3.2;
const depthGap = 1.1;

type MemoryItem = {
  instanceId: string;
  sourceId: string;
  record: ReflectionRecord;
  index: number;
};

type MemoryPoint = MemoryItem & {
  position: THREE.Vector3;
};

type SelectedMemory = {
  coverImage: string;
  record: ReflectionRecord;
};

export function GalleryBoard({ records }: { records: ReflectionRecord[] }) {
  const customCoverUrls = useRef<string[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [customCovers, setCustomCovers] = useState<Record<string, string>>({});
  const [selectedMemory, setSelectedMemory] = useState<SelectedMemory | null>(null);
  const reducedMotion = useReducedMotion();

  const memories = useMemo(() => buildMemoryItems(records), [records]);
  const timelineIndex = getDwelledTimelineIndex(scrollProgress, memories.length);
  const activeIndex = Math.min(memories.length - 1, Math.max(0, Math.round(timelineIndex)));

  useEffect(() => {
    document.body.classList.add("gallery-dark");
    return () => document.body.classList.remove("gallery-dark");
  }, []);

  useEffect(() => {
    return () => {
      customCoverUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function resolveCover(memory: MemoryItem) {
    return memory.record.cover_image_url || customCovers[memory.sourceId] || memoryPhotos[memory.index % memoryPhotos.length];
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

  function handleFrameWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? 1 : -1;
    const step = Math.min(0.08, Math.max(0.018, Math.abs(event.deltaY) / 3600));
    setScrollProgress((current) => Math.min(1, Math.max(0, current + direction * step)));
  }

  return (
    <section className="relative grid min-h-[calc(100dvh-100px)] w-full place-items-center overflow-hidden bg-[#05080d] px-6 py-6 text-slate-100">
      <OpeningFlash disabled={reducedMotion} />
      <div
        className="relative h-[82vh] max-h-[820px] min-h-[520px] w-[90vw] max-w-[1680px] overflow-hidden rounded-[34px] border border-white/[0.10] bg-[#05080d] shadow-[0_0_110px_rgba(55,94,145,0.16)]"
        onWheel={handleFrameWheel}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,rgba(96,137,172,0.18),transparent_30%),radial-gradient(circle_at_26%_70%,rgba(36,58,82,0.20),transparent_38%),linear-gradient(180deg,#030508_0%,#07101a_54%,#04070d_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7)_0_1px,transparent_1px),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.55)_0_1px,transparent_1px)] [background-size:5px_5px,7px_7px]" />

        <div className="absolute inset-0 z-10">
          <Canvas dpr={[1, 1.8]} gl={{ alpha: true, antialias: true }} shadows>
            <PerspectiveCamera makeDefault fov={46} position={[0, 0, 7]} />
            <color args={["#05080d"]} attach="background" />
            <fog attach="fog" args={["#05080d", 8, 38]} />
            <ambientLight intensity={0.72} />
            <pointLight color="#93c5fd" intensity={38} position={[0, 2.8, 2]} />
            <pointLight color="#f5d6a4" intensity={8} position={[-5, -3, -8]} />
            {!reducedMotion ? <ParticleField /> : null}
            <MemoryHelix
              activeIndex={activeIndex}
              timelineIndex={timelineIndex}
              memories={memories}
              onCardSelect={(record, coverImage) => setSelectedMemory({ coverImage, record })}
              onCoverUpload={handleCoverUpload}
              reducedMotion={reducedMotion}
              resolveCover={resolveCover}
              scrollProgress={scrollProgress}
            />
          </Canvas>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-sans-soft text-[10px] uppercase tracking-[0.34em] text-slate-500">
          Scroll to dive
        </div>
        <div className="pointer-events-none absolute bottom-7 right-6 top-7 z-20 w-px rounded-full bg-white/10">
          <div
            className="absolute left-1/2 h-16 w-1.5 -translate-x-1/2 rounded-full bg-sky-200/55 shadow-[0_0_18px_rgba(147,197,253,0.45)] transition-transform duration-200"
            style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 64}px)` }}
          />
        </div>
      </div>
      {selectedMemory ? <MemorySummaryDialog memory={selectedMemory} onClose={() => setSelectedMemory(null)} /> : null}
    </section>
  );
}

function MemoryHelix({
  activeIndex,
  timelineIndex,
  memories,
  onCardSelect,
  onCoverUpload,
  reducedMotion,
  resolveCover,
  scrollProgress,
}: {
  activeIndex: number;
  timelineIndex: number;
  memories: MemoryItem[];
  onCardSelect: (record: ReflectionRecord, coverImage: string) => void;
  onCoverUpload: (recordId: string, file?: File) => void;
  reducedMotion: boolean;
  resolveCover: (memory: MemoryItem) => string;
  scrollProgress: number;
}) {
  const points = useMemo<MemoryPoint[]>(
    () =>
      memories.map((memory, index) => {
        const angle = index * 0.75;
        return {
          ...memory,
          position: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * 1.2, -index * depthGap),
        };
      }),
    [memories],
  );

  return (
    <>
      <CameraRig reducedMotion={reducedMotion} scrollProgress={scrollProgress} timelineIndex={timelineIndex} />
      <MemoryStream points={points.map((point) => point.position)} />
      <group>
        {points.map((memory) => (
          <MemoryChip
            activeIndex={activeIndex}
            timelineIndex={timelineIndex}
            coverImage={resolveCover(memory)}
            key={memory.instanceId}
            memory={memory}
            onCardSelect={onCardSelect}
            onCoverUpload={onCoverUpload}
          />
        ))}
      </group>
    </>
  );
}

function CameraRig({
  reducedMotion,
  scrollProgress,
  timelineIndex,
}: {
  reducedMotion: boolean;
  scrollProgress: number;
  timelineIndex: number;
}) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const activeZ = -timelineIndex * depthGap;
    const angle = timelineIndex * 0.75;
    const activeX = Math.cos(angle) * radius;
    const activeY = Math.sin(angle) * 1.2;
    const drift = reducedMotion ? 0 : Math.sin(scrollProgress * Math.PI * 2) * 0.18;
    const desired = new THREE.Vector3(activeX * 0.72 + drift, activeY * 0.58, activeZ + 6.15);
    camera.position.lerp(desired, 1 - Math.exp(-delta * 3.8));
    target.set(activeX * 0.46, activeY * 0.38, activeZ - 6.4);
    camera.lookAt(target);
  });

  return null;
}

function MemoryStream({ points }: { points: THREE.Vector3[] }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 280, 0.026, 10, false]} />
        <meshBasicMaterial color="#c7e9ff" opacity={0.34} transparent />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 280, 0.078, 10, false]} />
        <meshBasicMaterial color="#5e7dff" opacity={0.08} transparent />
      </mesh>
    </group>
  );
}

function MemoryChip({
  activeIndex,
  timelineIndex,
  coverImage,
  memory,
  onCardSelect,
  onCoverUpload,
}: {
  activeIndex: number;
  timelineIndex: number;
  coverImage: string;
  memory: MemoryPoint;
  onCardSelect: (record: ReflectionRecord, coverImage: string) => void;
  onCoverUpload: (recordId: string, file?: File) => void;
}) {
  const distance = Math.abs(memory.index - timelineIndex);
  const isActive = memory.index === activeIndex;
  const isNearLens = distance < 0.78;
  const opacity = isNearLens ? 1 : Math.max(0.1, 0.9 - distance * 0.17);
  const scale = isNearLens ? 1.04 : Math.max(0.46, 0.88 - distance * 0.05);
  const blur = isNearLens ? 0 : Math.min(6, Math.max(0, distance - 0.68) * 0.9);

  return (
    <Float enabled={!isActive} floatIntensity={0.18} rotationIntensity={0.08} speed={1.6}>
      <group position={memory.position}>
        <Html
          center
          className="pointer-events-auto"
          distanceFactor={5.7}
          occlude={false}
          style={{
            filter: `blur(${blur}px)`,
            opacity,
            transform: `scale(${scale})`,
            transition: "filter 260ms ease, opacity 260ms ease, transform 260ms ease",
          }}
          transform
        >
          <button
            aria-label={memory.record.title}
            className={cn(
              "group relative h-[72px] w-[116px] overflow-hidden rounded-[14px] border border-white/[0.12] bg-[rgba(15,23,42,0.48)] text-left shadow-[0_0_22px_rgba(120,160,255,0.14)] outline-none backdrop-blur-[18px] transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_0_34px_rgba(148,190,255,0.24)] focus-visible:ring-2 focus-visible:ring-sky-200/70",
              isNearLens && "border-sky-100/45 shadow-[0_0_58px_rgba(147,197,253,0.34)]",
            )}
            onClick={() => onCardSelect(memory.record, coverImage)}
            type="button"
          >
            <span
              className={cn(
                "absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105 group-hover:opacity-90",
                isNearLens ? "opacity-95" : "opacity-64",
              )}
              style={{ backgroundImage: `url(${coverImage})` }}
            />
            <span
              className={cn(
                "absolute inset-0 transition duration-300",
                isNearLens
                  ? "bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_42%,rgba(2,6,14,0.58))]"
                  : "bg-[linear-gradient(180deg,rgba(2,6,14,0.12),rgba(2,6,14,0.24)_42%,rgba(2,6,14,0.86))]",
              )}
            />
            <span className="absolute left-2.5 top-2 font-sans-soft text-[8px] uppercase tracking-[0.18em] text-sky-100/90">
              {String(memory.index + 1).padStart(2, "0")}
            </span>
            <span className="absolute bottom-2 left-2.5 right-2.5">
              <span className="font-sans-soft block text-[7px] tracking-[0.12em] text-slate-300/80">{formatDate(memory.record.created_at)}</span>
              <span className="mt-0.5 block line-clamp-2 font-serif text-[9px] leading-tight text-white">{memory.record.title}</span>
            </span>
            {isNearLens ? (
              <label
                className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-full border border-white/15 bg-slate-950/45 text-slate-100 opacity-0 backdrop-blur transition group-hover:opacity-100"
                onClick={(event) => event.stopPropagation()}
                title="更换此记忆图片"
              >
                <ImagePlus className="size-4" />
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => onCoverUpload(memory.sourceId, event.target.files?.[0])}
                  type="file"
                />
              </label>
            ) : null}
          </button>
        </Html>
      </group>
    </Float>
  );
}

function ParticleField() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(420 * 3);
    for (let index = 0; index < 420; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 18;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[index * 3 + 2] = -Math.random() * 56 + 4;
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#dbeafe" opacity={0.28} size={0.024} sizeAttenuation transparent />
    </points>
  );
}

function MemorySummaryDialog({ memory, onClose }: { memory: SelectedMemory; onClose: () => void }) {
  const { coverImage, record } = memory;
  const firstPersonSummary = toFirstPerson(record.summary);

  return (
    <motion.div
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-[#02050a]/42 px-4 backdrop-blur-[5px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      onClick={onClose}
    >
      <motion.article
        className="relative grid h-[min(48vh,500px)] min-h-[360px] w-[min(78vw,1180px)] grid-cols-[0.9fr_1.35fr] overflow-hidden rounded-[26px] border border-white/[0.14] bg-[rgba(10,17,32,0.88)] text-slate-100 shadow-[0_0_100px_rgba(95,140,220,0.24)] backdrop-blur-2xl max-lg:h-[76vh] max-lg:w-[92vw] max-lg:grid-cols-1"
        initial={{ opacity: 0, scale: 0.94, y: 14, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(147,197,253,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
        <button
          aria-label="关闭记忆总结"
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full border border-white/10 bg-black/20 text-2xl text-slate-300 transition hover:bg-white/[0.14] hover:text-white"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className="relative min-h-0 overflow-hidden max-lg:min-h-[240px]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})`, backgroundPosition: "center center" }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(10,17,32,0.18)_78%,rgba(10,17,32,0.86)_100%)]" />
        </div>
        <div className="relative flex min-w-0 flex-col overflow-y-auto p-7 pr-10">
          <div className="[&>span]:hidden">
            <div>
              <span className="font-sans-soft inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#9fb8ff]">
                <Sparkles className="size-3.5" />
                {formatDate(record.created_at)}
              </span>
              <h2 className="mt-2 line-clamp-2 font-serif text-3xl font-semibold leading-tight text-white">{record.title}</h2>
            </div>
            <span className="text-xl tracking-[0.16em] text-amber-300">★★★</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {record.emotion_tags.slice(0, 4).map((tag) => (
              <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs text-slate-300" key={tag}>
                {tag}
              </span>
            ))}
            <span className="rounded-full border border-rose-200/10 bg-rose-300/10 px-3 py-1 text-xs text-rose-200">
              Mood: {record.emotion_intensity * 10}%
            </span>
          </div>
          <p className="mt-5 text-base leading-8 text-slate-300">{firstPersonSummary}</p>
          <div className="mt-5 rounded-2xl bg-[#070d19]/78 p-4">
            <p className="font-sans-soft text-[11px] uppercase tracking-[0.2em] text-slate-500">原始输入</p>
            <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-300">“{record.event_text}”</p>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

function OpeningFlash({ disabled }: { disabled: boolean }) {
  const [visible, setVisible] = useState(!disabled);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (disabled) {
      setVisible(false);
      return;
    }

    const imageTimer = window.setInterval(() => setIndex((current) => (current + 1) % memoryPhotos.length), 130);
    const exitTimer = window.setTimeout(() => setVisible(false), 1500);
    return () => {
      window.clearInterval(imageTimer);
      window.clearTimeout(exitTimer);
    };
  }, [disabled]);

  if (!visible) return null;

  return (
    <motion.div
      animate={{ opacity: [1, 1, 0], filter: ["blur(0px)", "blur(0px)", "blur(18px)"], scale: [1, 1.02, 1.08] }}
      className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#030508]"
      initial={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.72, 1] }}
    >
      <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${memoryPhotos[index]})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(191,219,254,0.18),transparent_36%),linear-gradient(180deg,rgba(3,5,8,0.2),#030508)]" />
      <div className="relative font-serif text-3xl tracking-[-0.03em] text-slate-100">Record what matters.</div>
    </motion.div>
  );
}

function buildMemoryItems(records: ReflectionRecord[]) {
  const minimumCount = Math.max(24, records.length);
  return Array.from({ length: minimumCount }, (_, index) => {
    const record = records[index % records.length];
    return {
      instanceId: `${record.id}-${index}`,
      sourceId: record.id,
      record,
      index,
    };
  });
}

function getDwelledTimelineIndex(progress: number, total: number) {
  if (total <= 1) return 0;
  const raw = progress * (total - 1);
  const base = Math.min(total - 1, Math.floor(raw));
  const phase = raw - base;
  if (base >= total - 1) return total - 1;

  // Keep each memory clear in the active zone before easing toward the next one.
  if (phase < 0.58) return base;
  return base + easeInOutCubic((phase - 0.58) / 0.42);
}

function easeInOutCubic(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function toFirstPerson(text: string) {
  return text
    .replaceAll("用户", "我")
    .replaceAll("她", "我")
    .replaceAll("他", "我")
    .replaceAll("自己", "我")
    .replaceAll("对方", "那个人");
}
