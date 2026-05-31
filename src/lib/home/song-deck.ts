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
  bars: number[];
};

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

export const homeSongTracks: HomeSongTrack[] = [
  {
    id: "w-01",
    code: "W - 01",
    title: "云烟成雨",
    artist: "房东的猫",
    subtitle: "一首适合慢慢放下防备的中文民谣。",
    mood: "柔软",
    time: "04:00",
    frequency: "44.1 kHz",
    accent: "#ff4f55",
    sourceLabel: "网易云音乐",
    sourceUrl: "https://music.163.com/#/search/m/?s=%E6%88%BF%E4%B8%9C%E7%9A%84%E7%8C%AB%20%E4%BA%91%E7%83%9F%E6%88%90%E9%9B%A8",
    bars: [38, 45, 52, 66, 72, 84, 92, 96, 88, 74, 58, 44, 39, 47, 61, 80, 93, 100, 85, 69, 54, 43],
  },
  {
    id: "w-02",
    code: "W - 02",
    title: "小半",
    artist: "陈粒",
    subtitle: "轻柔但有一点独处感，适合夜晚整理心绪。",
    mood: "回声",
    time: "04:57",
    frequency: "44.1 kHz",
    accent: "#f3bf4d",
    sourceLabel: "网易云音乐",
    sourceUrl: "https://music.163.com/#/search/m/?s=%E9%99%88%E7%B2%92%20%E5%B0%8F%E5%8D%8A",
    bars: [58, 42, 36, 45, 64, 82, 91, 76, 61, 48, 41, 53, 73, 89, 98, 86, 67, 49, 40, 44, 57, 71],
  },
  {
    id: "w-03",
    code: "W - 03",
    title: "Come Away With Me",
    artist: "Norah Jones",
    subtitle: "温柔、低速、带一点深夜爵士的安定感。",
    mood: "安放",
    time: "03:18",
    frequency: "44.1 kHz",
    accent: "#9bb48d",
    sourceLabel: "Spotify",
    sourceUrl: "https://open.spotify.com/search/Come%20Away%20With%20Me%20Norah%20Jones",
    bars: [46, 54, 68, 83, 94, 87, 74, 62, 55, 51, 59, 72, 91, 96, 80, 63, 49, 44, 52, 66, 78, 70],
  },
];

const cardKinds: HomeSongCardKind[] = ["player", "rust", "receipt"];

function normalizeTrackIndex(trackId?: string | null) {
  const index = homeSongTracks.findIndex((track) => track.id === trackId);
  return index >= 0 ? index : 0;
}

export function getHomeSongDeck(activeTrackId?: string | null): HomeSongDeck {
  const activeIndex = normalizeTrackIndex(activeTrackId);
  const orderedTracks = homeSongTracks.map((_, offset) => homeSongTracks[(activeIndex + offset) % homeSongTracks.length]);

  return {
    activeTrackId: orderedTracks[0].id,
    cards: orderedTracks.map((track) => ({
      kind: cardKinds[homeSongTracks.findIndex((item) => item.id === track.id)],
      track,
    })),
  };
}

export function advanceHomeSongDeck(
  activeTrackId: string | null | undefined,
  action: HomeSongDeckAction,
  selectedTrackId?: string | null,
): HomeSongDeck {
  const activeIndex = normalizeTrackIndex(activeTrackId);

  if (action === "select" && selectedTrackId) {
    return getHomeSongDeck(selectedTrackId);
  }

  if (action === "previous") {
    const previousIndex = (activeIndex - 1 + homeSongTracks.length) % homeSongTracks.length;
    return getHomeSongDeck(homeSongTracks[previousIndex].id);
  }

  const nextIndex = (activeIndex + 1) % homeSongTracks.length;
  return getHomeSongDeck(homeSongTracks[nextIndex].id);
}
