import { getDailyTrackGroup, type DailySongCatalogEntry } from "@/lib/home/daily-song-catalog";
import { getResolvedDailyTrackGroup, resetResolvedDailyTrackGroupCache } from "@/lib/home/music-resolver";

export type HomeSongTrack = DailySongCatalogEntry;

export type HomeSongCardKind = "player" | "rust" | "receipt";

export type HomeSongCard = {
  kind: HomeSongCardKind;
  track: HomeSongTrack;
};

export type HomeSongDeck = {
  activeTrackId: string;
  cards: HomeSongCard[];
};

export type HomeSongDeckAction = "next" | "previous" | "select";

export type HomeSongDeckOptions = {
  dateKey?: string | null;
};

const cardKinds: HomeSongCardKind[] = ["player", "rust", "receipt"];

function resolveDeckTracks(options?: HomeSongDeckOptions) {
  return getDailyTrackGroup(options?.dateKey);
}

async function resolveResolvedDeckTracks(options?: HomeSongDeckOptions) {
  return getResolvedDailyTrackGroup(options);
}

function normalizeTrackIndex(tracks: HomeSongTrack[], trackId?: string | null) {
  const index = tracks.findIndex((track) => track.id === trackId);
  return index >= 0 ? index : 0;
}

function buildHomeSongDeck(tracks: HomeSongTrack[], activeTrackId?: string | null): HomeSongDeck {
  if (tracks.length === 0) {
    return {
      activeTrackId: "",
      cards: [],
    };
  }

  const activeIndex = normalizeTrackIndex(tracks, activeTrackId);
  const orderedIndexes = tracks.map((_, offset) => (activeIndex + offset) % tracks.length);

  return {
    activeTrackId: tracks[orderedIndexes[0]]?.id ?? "",
    cards: orderedIndexes.map((trackIndex) => ({
      kind: cardKinds[trackIndex] ?? "player",
      track: tracks[trackIndex],
    })),
  };
}

export function getHomeSongDeck(activeTrackId?: string | null, options?: HomeSongDeckOptions): HomeSongDeck {
  return buildHomeSongDeck(resolveDeckTracks(options), activeTrackId);
}

export async function getResolvedHomeSongDeck(
  activeTrackId?: string | null,
  options?: HomeSongDeckOptions,
): Promise<HomeSongDeck> {
  return buildHomeSongDeck(await resolveResolvedDeckTracks(options), activeTrackId);
}

export function advanceHomeSongDeck(
  activeTrackId: string | null | undefined,
  action: HomeSongDeckAction,
  selectedTrackId?: string | null,
  options?: HomeSongDeckOptions,
): HomeSongDeck {
  const tracks = resolveDeckTracks(options);

  if (tracks.length === 0) {
    return getHomeSongDeck(undefined, options);
  }

  const activeIndex = normalizeTrackIndex(tracks, activeTrackId);

  if (action === "select" && selectedTrackId && tracks.some((track) => track.id === selectedTrackId)) {
    return getHomeSongDeck(selectedTrackId, options);
  }

  if (action === "select") {
    return getHomeSongDeck(activeTrackId, options);
  }

  if (action === "previous") {
    const previousIndex = (activeIndex - 1 + tracks.length) % tracks.length;
    return getHomeSongDeck(tracks[previousIndex]?.id, options);
  }

  const nextIndex = (activeIndex + 1) % tracks.length;
  return getHomeSongDeck(tracks[nextIndex]?.id, options);
}

export async function advanceResolvedHomeSongDeck(
  activeTrackId: string | null | undefined,
  action: HomeSongDeckAction,
  selectedTrackId?: string | null,
  options?: HomeSongDeckOptions,
): Promise<HomeSongDeck> {
  const tracks = await resolveResolvedDeckTracks(options);

  if (tracks.length === 0) {
    return getResolvedHomeSongDeck(undefined, options);
  }

  const activeIndex = normalizeTrackIndex(tracks, activeTrackId);

  if (action === "select" && selectedTrackId && tracks.some((track) => track.id === selectedTrackId)) {
    return getResolvedHomeSongDeck(selectedTrackId, options);
  }

  if (action === "select") {
    return getResolvedHomeSongDeck(activeTrackId, options);
  }

  if (action === "previous") {
    const previousIndex = (activeIndex - 1 + tracks.length) % tracks.length;
    return getResolvedHomeSongDeck(tracks[previousIndex]?.id, options);
  }

  const nextIndex = (activeIndex + 1) % tracks.length;
  return getResolvedHomeSongDeck(tracks[nextIndex]?.id, options);
}

export const resetResolvedHomeSongDeckCache = resetResolvedDailyTrackGroupCache;
