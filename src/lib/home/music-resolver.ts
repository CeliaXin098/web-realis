import {
  getCurrentShanghaiDateKey,
  getDailyTrackGroup,
  resolveShanghaiDateKey,
  type DailySongCatalogEntry,
} from "@/lib/home/daily-song-catalog";
import { unstable_cache } from "next/cache";

const DEFAULT_NETEASE_API_BASE_URL = "https://api-music.imsyy.com";
const NETEASE_SONG_PAGE_BASE_URL = "https://music.163.com/#/song?id=";
const REQUEST_TIMEOUT_MS = 4_000;
const RESOLVED_GROUP_REVALIDATE_SECONDS = 60 * 60 * 24;

type MusicResolverOptions = {
  baseUrl?: string | null;
  dateKey?: string | null;
};

const resolvedTrackGroupCache = new Map<string, Promise<DailySongCatalogEntry[]>>();

function normalizeBaseUrl(baseUrl?: string | null) {
  const value = (baseUrl ?? process.env.NETEASE_API_BASE_URL ?? DEFAULT_NETEASE_API_BASE_URL).trim();
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchPlayableSongUrl(songId: string, baseUrl: string) {
  const songUrl = `${baseUrl}/song/url/v1?id=${encodeURIComponent(songId)}&level=exhigh`;
  const songResponse = await fetchJson(songUrl);
  const data = Array.isArray(songResponse?.data) ? songResponse.data : [];
  const firstEntry = data[0] as { url?: string | null } | undefined;
  return typeof firstEntry?.url === "string" && firstEntry.url ? firstEntry.url : null;
}

async function resolveTrack(track: DailySongCatalogEntry, baseUrl: string): Promise<DailySongCatalogEntry> {
  if (!track.neteaseSongId) {
    return track;
  }

  const songId = track.neteaseSongId;
  const resolvedMetadata = {
    sourceLabel: "NetEase Music",
    sourceUrl: `${NETEASE_SONG_PAGE_BASE_URL}${songId}`,
  };
  const playableUrl = await fetchPlayableSongUrl(songId, baseUrl);

  if (!playableUrl) {
    if (track.audioUrl && track.isPlayable) {
      return {
        ...track,
        fallbackAudioUrl: undefined,
        isPlayable: true,
      };
    }

    return {
      ...track,
      ...resolvedMetadata,
      audioUrl: "",
      fallbackAudioUrl: undefined,
      isPlayable: false,
    };
  }

  return {
    ...track,
    ...resolvedMetadata,
    audioUrl: playableUrl,
    fallbackAudioUrl: undefined,
    isPlayable: true,
  };
}

const getCachedResolvedDailyTrackGroup = unstable_cache(
  async (dateKey: string, baseUrl: string) => {
    const group = getDailyTrackGroup(dateKey);
    return Promise.all(group.map((track) => resolveTrack(track, baseUrl))).catch(() => group);
  },
  ["resolved-home-song-deck"],
  { revalidate: RESOLVED_GROUP_REVALIDATE_SECONDS },
);

export async function getResolvedDailyTrackGroup(options?: MusicResolverOptions) {
  const dateKey = resolveShanghaiDateKey(options?.dateKey);
  const baseUrl = normalizeBaseUrl(options?.baseUrl);

  if (process.env.NODE_ENV === "test") {
    const cacheKey = `${dateKey}:${baseUrl}`;
    const cachedGroup = resolvedTrackGroupCache.get(cacheKey);

    if (cachedGroup) {
      return cachedGroup;
    }

    const group = getDailyTrackGroup(dateKey);
    const pendingGroup = Promise.all(group.map((track) => resolveTrack(track, baseUrl))).catch(() => group);
    resolvedTrackGroupCache.set(cacheKey, pendingGroup);
    return pendingGroup;
  }

  return getCachedResolvedDailyTrackGroup(dateKey, baseUrl);
}

export function resetResolvedDailyTrackGroupCache() {
  resolvedTrackGroupCache.clear();
}

export { getCurrentShanghaiDateKey };
