# Homepage Music And Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real in-page music playback with a daily rotating three-track homepage deck, make the stacked cards fully opaque, and update the homepage hero copy.

**Architecture:** Keep the existing `/api/home/song-deck` contract, but move deck generation to a server-side daily playlist module that produces three stable tracks for a given date. Extend the front-end card component to control a real `HTMLAudioElement`, attempt fallback audio when needed, and render updated opaque card styling plus the approved homepage copy.

**Tech Stack:** Next.js App Router, React 19 client components, TypeScript, Vitest, Playwright

---

## File Structure

- Create: `src/lib/home/daily-song-catalog.ts`
  - Holds the larger candidate catalog, daily selection logic, and fallback deck generation.
- Modify: `src/lib/home/song-deck.ts`
  - Extends `HomeSongTrack` with audio fields and date-aware deck generation while preserving the existing API shape.
- Modify: `src/app/api/home/song-deck/route.ts`
  - Passes optional date context through to the deck generator and keeps deck rotation behavior server-side.
- Modify: `src/components/home-song-card.tsx`
  - Adds real audio playback, fallback handling, and opaque card styling.
- Modify: `src/app/page.tsx`
  - Replaces the hero headline and body copy.
- Modify: `tests/unit/home-song-deck.test.ts`
  - Covers daily rotation, stable same-day selection, and deck ordering.
- Modify: `tests/e2e/app.spec.ts`
  - Verifies the new homepage headline is visible.

### Task 1: Daily deck data model

**Files:**
- Create: `src/lib/home/daily-song-catalog.ts`
- Modify: `src/lib/home/song-deck.ts`
- Test: `tests/unit/home-song-deck.test.ts`

- [ ] **Step 1: Write the failing unit tests for date-based deck selection**

```ts
import { describe, expect, it } from "vitest";
import { getHomeSongDeck } from "@/lib/home/song-deck";

describe("home song deck", () => {
  it("returns the same three tracks for the same date", () => {
    const morningDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const eveningDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    expect(morningDeck.cards.map((card) => card.track.id)).toEqual(eveningDeck.cards.map((card) => card.track.id));
  });

  it("returns a different three-track group on a different date", () => {
    const firstDay = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const secondDay = getHomeSongDeck(undefined, { dateKey: "2026-06-04" });

    expect(firstDay.cards.map((card) => card.track.id)).not.toEqual(secondDay.cards.map((card) => card.track.id));
  });

  it("includes playable metadata on homepage tracks", () => {
    const deck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    for (const card of deck.cards) {
      expect(card.track.audioUrl).toBeTruthy();
      expect(card.track.sourceUrl).toBeTruthy();
      expect(typeof card.track.isPlayable).toBe("boolean");
    }
  });
});
```

- [ ] **Step 2: Run the targeted unit test and confirm failure**

Run: `npm run test:run -- tests/unit/home-song-deck.test.ts`  
Expected: FAIL because `getHomeSongDeck` does not yet accept date options or return audio metadata.

- [ ] **Step 3: Add a daily catalog module with enough tracks for day-based rotation**

```ts
export type DailySongCatalogEntry = {
  id: string;
  code: string;
  title: string;
  artist: string;
  subtitle: string;
  mood: string;
  time: string;
  frequency: string;
  accent: string;
  sourceLabel: string;
  sourceUrl: string;
  audioUrl: string;
  fallbackAudioUrl?: string;
  isPlayable: boolean;
  bars: number[];
};

export const dailySongCatalog: DailySongCatalogEntry[] = [
  // Provide at least 9 entries so consecutive dates can produce distinct groups of 3.
];

export function getDailyTrackGroup(dateKey: string) {
  const normalized = dailySongCatalog.length - (dailySongCatalog.length % 3 || 3);
  const pool = dailySongCatalog.slice(0, normalized);
  const groups = Array.from({ length: pool.length / 3 }, (_, index) => pool.slice(index * 3, index * 3 + 3));
  const hash = Array.from(dateKey).reduce((total, char) => total + char.charCodeAt(0), 0);
  return groups[hash % groups.length];
}
```

- [ ] **Step 4: Extend the song deck module to build a date-aware deck**

```ts
export type HomeSongTrack = {
  id: string;
  code: string;
  title: string;
  artist: string;
  subtitle: string;
  mood: string;
  time: string;
  frequency: string;
  accent: string;
  sourceLabel: string;
  sourceUrl: string;
  audioUrl: string;
  fallbackAudioUrl?: string;
  isPlayable: boolean;
  bars: number[];
};

export function getHomeSongDeck(activeTrackId?: string | null, options?: { dateKey?: string | null }) {
  const tracks = getDailyTrackGroup(resolveDateKey(options?.dateKey));
  const activeIndex = normalizeTrackIndex(tracks, activeTrackId);
  const orderedTracks = tracks.map((_, offset) => tracks[(activeIndex + offset) % tracks.length]);

  return {
    activeTrackId: orderedTracks[0].id,
    cards: orderedTracks.map((track) => ({
      kind: cardKinds[tracks.findIndex((item) => item.id === track.id)],
      track,
    })),
  };
}
```

- [ ] **Step 5: Re-run the targeted unit test and confirm pass**

Run: `npm run test:run -- tests/unit/home-song-deck.test.ts`  
Expected: PASS with stable same-day groups and changed next-day groups.

- [ ] **Step 6: Commit the data-model change**

```bash
git add tests/unit/home-song-deck.test.ts src/lib/home/daily-song-catalog.ts src/lib/home/song-deck.ts
git commit -m "feat: add daily homepage music deck"
```

### Task 2: API route support for daily rotation

**Files:**
- Modify: `src/app/api/home/song-deck/route.ts`
- Test: `tests/unit/home-song-deck.test.ts`

- [ ] **Step 1: Add a failing test that keeps rotation within the date-scoped three-track group**

```ts
it("keeps next and previous navigation inside the selected day group", () => {
  const deck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
  const nextDeck = advanceHomeSongDeck(deck.activeTrackId, "next", undefined, { dateKey: "2026-06-03" });

  expect(nextDeck.cards).toHaveLength(3);
  expect(nextDeck.cards.map((card) => card.track.id).sort()).toEqual(deck.cards.map((card) => card.track.id).sort());
});
```

- [ ] **Step 2: Run the targeted unit test and confirm failure**

Run: `npm run test:run -- tests/unit/home-song-deck.test.ts`  
Expected: FAIL because `advanceHomeSongDeck` does not yet accept date options.

- [ ] **Step 3: Update route handlers and deck helpers to pass a normalized date key**

```ts
function getRequestDateKey(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateKey = getRequestDateKey(request);
  return NextResponse.json(getHomeSongDeck(url.searchParams.get("activeTrackId"), { dateKey }));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    activeTrackId?: string;
    action?: HomeSongDeckAction;
    selectedTrackId?: string;
    dateKey?: string;
  };

  const dateKey = body.dateKey ?? new Date().toISOString().slice(0, 10);
  return NextResponse.json(advanceHomeSongDeck(body.activeTrackId, action, body.selectedTrackId, { dateKey }));
}
```

- [ ] **Step 4: Re-run the targeted unit test and confirm pass**

Run: `npm run test:run -- tests/unit/home-song-deck.test.ts`  
Expected: PASS with deck navigation limited to the three current daily tracks.

- [ ] **Step 5: Commit the API change**

```bash
git add src/app/api/home/song-deck/route.ts src/lib/home/song-deck.ts tests/unit/home-song-deck.test.ts
git commit -m "feat: scope homepage music api to daily decks"
```

### Task 3: Real audio playback and fallback behavior

**Files:**
- Modify: `src/components/home-song-card.tsx`

- [ ] **Step 1: Add a failing interaction check manually in the browser**

Run: `npm run dev`  
Expected before implementation: clicking the front music card only toggles the icon and no real audio request is made.

- [ ] **Step 2: Add client-side audio state and a reusable playback helper**

```ts
const audioRef = useRef<HTMLAudioElement | null>(null);
const fallbackAttemptedRef = useRef<string | null>(null);
const [playbackError, setPlaybackError] = useState<string | null>(null);

async function playTrack(track: HomeSongCardData["track"]) {
  const audio = audioRef.current ?? new Audio();
  audioRef.current = audio;

  if (audio.src !== track.audioUrl) {
    audio.src = track.audioUrl;
    audio.load();
  }

  try {
    await audio.play();
    setIsPlaying(true);
    setPlaybackError(null);
    fallbackAttemptedRef.current = null;
  } catch {
    if (track.fallbackAudioUrl && fallbackAttemptedRef.current !== track.id) {
      fallbackAttemptedRef.current = track.id;
      audio.src = track.fallbackAudioUrl;
      audio.load();
      await audio.play();
      setIsPlaying(true);
      setPlaybackError(null);
      return;
    }

    setIsPlaying(false);
    setPlaybackError("当前音源暂不可用");
  }
}
```

- [ ] **Step 3: Sync playback with deck changes and pause on unmount**

```ts
useEffect(() => {
  return () => {
    audioRef.current?.pause();
    audioRef.current = null;
  };
}, []);

useEffect(() => {
  if (!isPlaying) return;
  const activeTrack = deck.cards[0]?.track;
  if (!activeTrack) return;
  playTrack(activeTrack).catch(() => {
    setIsPlaying(false);
    setPlaybackError("当前音源暂不可用");
  });
}, [deck.activeTrackId, isPlaying]);
```

- [ ] **Step 4: Update click handling so front-card play really controls audio**

```ts
async function handleFrontClick() {
  if (hasDragged.current) {
    hasDragged.current = false;
    return;
  }

  const audio = audioRef.current;
  if (isPlaying && audio) {
    audio.pause();
    setIsPlaying(false);
    return;
  }

  await playTrack(deck.cards[0].track);
}
```

- [ ] **Step 5: Show a gentle playback status and keep source access visible**

```tsx
{playbackError ? (
  <p className="font-sans-soft mt-3 text-sm text-white/72">{playbackError}</p>
) : null}

<a
  className="font-sans-soft absolute bottom-6 right-6 inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/58"
  href={track.sourceUrl}
  rel="noreferrer"
  target="_blank"
>
  {track.sourceLabel}
  <ExternalLink className="size-3" />
</a>
```

- [ ] **Step 6: Manually verify playback behavior after implementation**

Run: `npm run dev`  
Expected: the first card starts real playback, switching cards changes the loaded song, and an invalid source shows a non-blocking error message.

- [ ] **Step 7: Commit the playback change**

```bash
git add src/components/home-song-card.tsx
git commit -m "feat: add homepage audio playback"
```

### Task 4: Opaque card styling and homepage copy

**Files:**
- Modify: `src/components/home-song-card.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/e2e/app.spec.ts`

- [ ] **Step 1: Update the E2E expectation for the new homepage heading**

```ts
test("home opens and shows primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /给今天的心事，留一间安静发光的房间。/ })).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E test and confirm failure**

Run: `npm run e2e`  
Expected: FAIL because the homepage still shows the old heading.

- [ ] **Step 3: Make the stacked cards fully opaque and reduce rear-card content bleed**

```tsx
<div className="relative h-full overflow-hidden rounded-[22px] border border-[#c9c6bc] bg-[#e6dece] p-9 text-[#3d3932] shadow-[0_24px_70px_rgba(34,31,25,0.12)]">
```

```tsx
className="group rounded-[26px] border border-[#d8d2c6] bg-[#fbf8f1] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_48px_rgba(34,31,25,0.09)]"
```

- [ ] **Step 4: Replace the homepage copy with the approved lines**

```tsx
<h1 className="mt-5 text-[2.8rem] font-semibold leading-tight tracking-[-0.04em]">
  给今天的心事，留一间安静发光的房间。
</h1>
<p className="font-sans-soft mt-5 text-base leading-8 text-[#5d574d]">
  从一件具体的小事写起，让情绪慢慢显影，也让你重新看见自己。
</p>
```

- [ ] **Step 5: Re-run the E2E test and confirm pass**

Run: `npm run e2e`  
Expected: PASS with the new heading visible and the page still loading normally.

- [ ] **Step 6: Commit the visual and copy update**

```bash
git add src/components/home-song-card.tsx src/app/page.tsx tests/e2e/app.spec.ts
git commit -m "style: refine homepage music cards and copy"
```

### Task 5: Final verification

**Files:**
- Modify: none expected

- [ ] **Step 1: Run the full unit suite**

Run: `npm run test:run`  
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 3: Run the homepage E2E flow one more time**

Run: `npm run e2e`  
Expected: PASS

- [ ] **Step 4: Review git diff for accidental scope creep**

Run: `git diff --stat HEAD~3..HEAD`  
Expected: only homepage music deck, homepage card UI, copy, and related tests changed.

- [ ] **Step 5: Prepare handoff summary**

```text
Summarize:
- how daily deck rotation works
- which audio source fields are used
- what fallback behavior users will see
- which homepage copy and card styling changed
```
