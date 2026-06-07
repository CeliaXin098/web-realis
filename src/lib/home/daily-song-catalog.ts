export type DailySongCatalogEntry = {
  id: string;
  neteaseSongId?: string;
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
  {
    id: "w-01",
    neteaseSongId: "513360721",
    code: "W - 01",
    title: "云烟成雨",
    artist: "房东的猫",
    subtitle: "一首适合把心慢慢放软下来的安静民谣。",
    mood: "soft",
    time: "04:12",
    frequency: "44.1 kHz",
    accent: "#ff8b6b",
    sourceLabel: "NetEase Music",
    sourceUrl: "https://music.163.com/#/song?id=513360721",
    audioUrl: "",
    isPlayable: false,
    bars: [38, 45, 52, 66, 72, 84, 92, 96, 88, 74, 58, 44, 39, 47, 61, 80, 93, 100, 85, 69, 54, 43],
  },
  {
    id: "w-02",
    neteaseSongId: "421423806",
    code: "W - 02",
    title: "小半",
    artist: "陈粒",
    subtitle: "轻一点、慢一点，适合夜里收拢心绪。",
    mood: "hush",
    time: "04:57",
    frequency: "44.1 kHz",
    accent: "#f3bf4d",
    sourceLabel: "NetEase Music",
    sourceUrl: "https://music.163.com/#/song?id=421423806",
    audioUrl: "",
    isPlayable: false,
    bars: [58, 42, 36, 45, 64, 82, 91, 76, 61, 48, 41, 53, 73, 89, 98, 86, 67, 49, 40, 44, 57, 71],
  },
  {
    id: "w-03",
    neteaseSongId: "1475804241",
    code: "W - 03",
    title: "Come Away With Me",
    artist: "Norah Jones",
    subtitle: "A familiar late-night calm with a little glow.",
    mood: "settle",
    time: "03:18",
    frequency: "44.1 kHz",
    accent: "#9bb48d",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=1475804241",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/77/ff/fd/77fffdbc-43b6-7d8d-9cc1-b2e957004506/mzaf_1709548897510029754.plus.aac.p.m4a",
    isPlayable: true,
    bars: [46, 54, 68, 83, 94, 87, 74, 62, 55, 51, 59, 72, 91, 96, 80, 63, 49, 44, 52, 66, 78, 70],
  },
  {
    id: "w-07",
    neteaseSongId: "27848769",
    code: "W - 07",
    title: "Bloom",
    artist: "The Paper Kites",
    subtitle: "Light acoustic air for a gentler heartbeat.",
    mood: "breathe",
    time: "03:31",
    frequency: "44.1 kHz",
    accent: "#d78c73",
    sourceLabel: "NetEase Music",
    sourceUrl: "https://music.163.com/#/song?id=27848769",
    audioUrl: "",
    isPlayable: false,
    bars: [42, 48, 56, 61, 68, 79, 86, 90, 88, 79, 70, 62, 58, 64, 73, 82, 89, 94, 87, 77, 65, 52],
  },
  {
    id: "w-08",
    neteaseSongId: "1958557540",
    code: "W - 08",
    title: "Golden Hour",
    artist: "JVKE",
    subtitle: "A warmer chorus that still feels private.",
    mood: "glow",
    time: "03:29",
    frequency: "44.1 kHz",
    accent: "#e7ba72",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=1958557540",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/30/02/8c/30028c8a-a125-5466-bcc6-27a83b1c0135/mzaf_16911571635366913039.plus.aac.p.m4a",
    isPlayable: true,
    bars: [49, 53, 60, 66, 74, 88, 95, 92, 85, 77, 68, 59, 55, 61, 70, 80, 93, 99, 90, 78, 66, 57],
  },
  {
    id: "w-09",
    neteaseSongId: "16649909",
    code: "W - 09",
    title: "Holocene",
    artist: "Bon Iver",
    subtitle: "Quiet, open, and a little like standing in weather.",
    mood: "open",
    time: "05:36",
    frequency: "44.1 kHz",
    accent: "#97a785",
    sourceLabel: "NetEase Music",
    sourceUrl: "https://music.163.com/#/song?id=16649909",
    audioUrl: "",
    isPlayable: false,
    bars: [35, 40, 47, 55, 60, 68, 76, 82, 88, 85, 79, 73, 66, 61, 58, 63, 70, 78, 84, 80, 72, 64],
  },
  {
    id: "w-04",
    neteaseSongId: "480769623",
    code: "W - 04",
    title: "Anchor",
    artist: "Novo Amor",
    subtitle: "Delicate strings for the afterthoughts that linger.",
    mood: "drift",
    time: "04:17",
    frequency: "44.1 kHz",
    accent: "#8f95b8",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=480769623",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/36/2f/c8/362fc812-1ab6-e7b7-ba85-03697ceb8246/mzaf_14649291434556829701.plus.aac.p.m4a",
    isPlayable: true,
    bars: [44, 47, 50, 56, 63, 71, 78, 83, 87, 84, 79, 73, 67, 60, 55, 58, 66, 75, 82, 86, 80, 69],
  },
  {
    id: "w-05",
    neteaseSongId: "1294066180",
    code: "W - 05",
    title: "Riverside",
    artist: "Agnes Obel",
    subtitle: "Steady and reflective, with room to think.",
    mood: "reflect",
    time: "03:49",
    frequency: "44.1 kHz",
    accent: "#889e9a",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=1294066180",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/99/f2/40/99f240b0-7e81-1994-268d-7cca7707b97d/mzaf_1754484487101780579.plus.aac.p.m4a",
    isPlayable: true,
    bars: [40, 46, 53, 59, 67, 74, 81, 88, 91, 84, 76, 68, 61, 56, 52, 57, 65, 73, 81, 86, 80, 71],
  },
  {
    id: "w-06",
    neteaseSongId: "470601663",
    code: "W - 06",
    title: "Saturn",
    artist: "Sleeping At Last",
    subtitle: "A slower lift for nights that need perspective.",
    mood: "orbit",
    time: "04:49",
    frequency: "44.1 kHz",
    accent: "#c88d9f",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=470601663",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e0/04/1c/e0041c11-91fa-3e33-a5ae-fa3e218279f3/mzaf_9370605378961075137.plus.aac.p.m4a",
    isPlayable: true,
    bars: [37, 42, 48, 54, 62, 70, 79, 87, 93, 90, 84, 76, 68, 59, 52, 56, 64, 73, 82, 88, 83, 74],
  },
  {
    id: "w-10",
    neteaseSongId: "17100426",
    code: "W - 10",
    title: "Sea of Love",
    artist: "Cat Power",
    subtitle: "A low, tender cover for quieter evenings.",
    mood: "tender",
    time: "02:20",
    frequency: "44.1 kHz",
    accent: "#7f9db0",
    sourceLabel: "Verified Preview",
    sourceUrl: "https://music.163.com/#/song?id=17100426",
    audioUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/2b/6d/d0/2b6dd015-e970-46a7-0873-59208ddfe1a6/mzaf_17426022878316684938.plus.aac.p.m4a",
    isPlayable: true,
    bars: [41, 45, 50, 57, 63, 69, 76, 82, 86, 83, 78, 72, 66, 60, 55, 58, 64, 71, 79, 84, 80, 74],
  },
];

const DAILY_GROUP_SIZE = 3;
const DAILY_TRACK_ORDER = ["w-04", "w-10", "w-05", "w-06", "w-03", "w-08", "w-07", "w-09", "w-01", "w-02"];
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatShanghaiDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: SHANGHAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function getCurrentShanghaiDateKey() {
  return formatShanghaiDateKey(new Date());
}

export function resolveShanghaiDateKey(dateKey?: string | null) {
  return dateKey ?? getCurrentShanghaiDateKey();
}

function getDateOrdinal(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return 0;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  return Math.floor(Date.UTC(year, monthIndex, day) / DAY_IN_MS);
}

export function getDailyTrackGroups(catalog: DailySongCatalogEntry[] = dailySongCatalog) {
  if (catalog.length === 0) {
    return [];
  }

  const order = new Map(DAILY_TRACK_ORDER.map((id, index) => [id, index]));
  const orderedCatalog = [...catalog].sort((left, right) => {
    const leftOrder = order.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
  const groupCount = Math.ceil(orderedCatalog.length / DAILY_GROUP_SIZE);

  return Array.from({ length: groupCount }, (_, groupIndex) =>
    Array.from({ length: DAILY_GROUP_SIZE }, (_, offset) => {
      return orderedCatalog[(groupIndex * DAILY_GROUP_SIZE + offset) % orderedCatalog.length];
    }),
  );
}

export function getDailyTrackGroup(dateKey?: string | null) {
  const groups = getDailyTrackGroups();

  if (groups.length === 0) {
    return [];
  }

  const normalizedDateKey = resolveShanghaiDateKey(dateKey);
  const groupIndex = ((getDateOrdinal(normalizedDateKey) % groups.length) + groups.length) % groups.length;

  return groups[groupIndex];
}
