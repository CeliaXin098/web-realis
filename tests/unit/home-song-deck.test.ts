import { afterEach, describe, expect, it, vi } from "vitest";
import { dailySongCatalog, getDailyTrackGroups } from "@/lib/home/daily-song-catalog";
import {
  advanceHomeSongDeck,
  advanceResolvedHomeSongDeck,
  getHomeSongDeck,
  getResolvedHomeSongDeck,
  resetResolvedHomeSongDeckCache,
} from "@/lib/home/song-deck";

describe("home song deck", () => {
  afterEach(() => {
    resetResolvedHomeSongDeckCache();
    vi.restoreAllMocks();
    delete process.env.NETEASE_API_BASE_URL;
  });

  it("returns exactly three cards with stable player stack kinds", () => {
    const deck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    expect(deck.cards).toHaveLength(3);
    expect(deck.cards.map((card) => card.kind)).toEqual(["player", "rust", "receipt"]);
    expect(deck.activeTrackId).toBe(deck.cards[0]?.track.id);
  });

  it("cycles card positions when advancing to the next track", () => {
    const initialDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const deck = advanceHomeSongDeck(initialDeck.activeTrackId, "next", undefined, { dateKey: "2026-06-03" });

    expect(deck.activeTrackId).toBe(initialDeck.cards[1]?.track.id);
    expect(deck.cards.map((card) => card.kind)).toEqual(["rust", "receipt", "player"]);
    expect(deck.cards.map((card) => card.track.id)).toEqual([
      initialDeck.cards[1]?.track.id,
      initialDeck.cards[2]?.track.id,
      initialDeck.cards[0]?.track.id,
    ]);
  });

  it("can bring a specific backing card to the front", () => {
    const initialDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const selectedTrackId = initialDeck.cards[2]?.track.id;
    const deck = advanceHomeSongDeck(initialDeck.activeTrackId, "select", selectedTrackId, { dateKey: "2026-06-03" });

    expect(deck.activeTrackId).toBe(selectedTrackId);
    expect(deck.cards.map((card) => card.kind)).toEqual(["receipt", "player", "rust"]);
    expect(deck.cards.map((card) => card.track.id)).toEqual([
      initialDeck.cards[2]?.track.id,
      initialDeck.cards[0]?.track.id,
      initialDeck.cards[1]?.track.id,
    ]);
  });

  it("falls back to the last track in the current group when given an unknown active id and moving previous", () => {
    const initialDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const deck = advanceHomeSongDeck("missing", "previous", undefined, { dateKey: "2026-06-03" });

    expect(deck.activeTrackId).toBe(initialDeck.cards[2]?.track.id);
    expect(deck.cards.map((card) => card.track.id)).toEqual([
      initialDeck.cards[2]?.track.id,
      initialDeck.cards[0]?.track.id,
      initialDeck.cards[1]?.track.id,
    ]);
  });

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

  it("rotates among stable three-track groups instead of sliding windows", () => {
    const groups = getDailyTrackGroups().map((group) => group.map((track) => track.id));
    const deck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    expect(groups).toContainEqual(deck.cards.map((card) => card.track.id));
  });

  it("uses the current Shanghai local date by default when no dateKey is provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T16:30:00.000Z"));

    const defaultDeck = getHomeSongDeck();
    const datedDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    expect(defaultDeck.cards.map((card) => card.track.id)).toEqual(datedDeck.cards.map((card) => card.track.id));

    vi.useRealTimers();
  });

  it("includes playable metadata on homepage tracks", () => {
    const deck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });

    for (const card of deck.cards) {
      expect(typeof card.track.audioUrl).toBe("string");
      expect(card.track.sourceUrl).toBeTruthy();
      expect(typeof card.track.isPlayable).toBe("boolean");
    }
  });

  it("keeps stale selected track ids from resetting the current daily deck", () => {
    const initialDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const deck = advanceHomeSongDeck(initialDeck.activeTrackId, "select", "missing", { dateKey: "2026-06-03" });

    expect(deck.activeTrackId).toBe(initialDeck.activeTrackId);
    expect(deck.cards.map((card) => card.track.id)).toEqual(initialDeck.cards.map((card) => card.track.id));
  });

  it("makes every catalog song reachable across daily rotation", () => {
    const reachableTrackIds = new Set<string>();

    for (let day = 1; day <= getDailyTrackGroups().length; day += 1) {
      const dateKey = `2026-06-${String(day).padStart(2, "0")}`;
      const deck = getHomeSongDeck(undefined, { dateKey });

      for (const card of deck.cards) {
        reachableTrackIds.add(card.track.id);
      }
    }

    expect(reachableTrackIds).toEqual(new Set(dailySongCatalog.map((track) => track.id)));
  });

  it("maps 2026-06-03 and 2026-06-12 to different groups without hash collisions", () => {
    const firstDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const secondDeck = getHomeSongDeck(undefined, { dateKey: "2026-06-12" });

    expect(firstDeck.cards.map((card) => card.track.id)).not.toEqual(secondDeck.cards.map((card) => card.track.id));
  });

  it("resolves NetEase-compatible playable URLs when the NetEase API succeeds", async () => {
    const seededTrack = getHomeSongDeck(undefined, { dateKey: "2026-06-01" }).cards[0]?.track;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("/search?") || requestUrl.includes("itunes.apple.com")) {
        throw new Error("runtime search should not be used for homepage song audio");
      }

      if (requestUrl === `https://api-music.imsyy.com/song/url/v1?id=${seededTrack?.neteaseSongId}&level=exhigh`) {
        return new Response(
          JSON.stringify({
            data: [{ id: seededTrack?.neteaseSongId, url: "https://cdn.example.com/track.mp3" }],
          }),
        );
      }

      return new Response(JSON.stringify({ data: [{ id: 0, url: null }] }));
    });

    vi.stubGlobal("fetch", fetchMock);

    const deck = await getResolvedHomeSongDeck(undefined, { dateKey: "2026-06-01" });
    const track = deck.cards[0]?.track;

    expect(track?.sourceLabel).toBe("NetEase Music");
    expect(track?.sourceUrl).toBe(`https://music.163.com/#/song?id=${seededTrack?.neteaseSongId}`);
    expect(track?.audioUrl).toBe("https://cdn.example.com/track.mp3");
    expect(track?.fallbackAudioUrl).toBeUndefined();
    expect(track?.isPlayable).toBe(true);
  });

  it("marks a resolved song unavailable when no playable URL is returned", async () => {
    process.env.NETEASE_API_BASE_URL = "https://music-api.example.com";
    const seededTrack = getHomeSongDeck(undefined, { dateKey: "2026-06-03" }).cards[0]?.track;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("/search?") || requestUrl.includes("itunes.apple.com")) {
        throw new Error("runtime search should not be used for homepage song audio");
      }

      if (requestUrl === `https://music-api.example.com/song/url/v1?id=${seededTrack?.neteaseSongId}&level=exhigh`) {
        return new Response(
          JSON.stringify({
            data: [{ id: seededTrack?.neteaseSongId, url: null }],
          }),
        );
      }

      return new Response(JSON.stringify({ data: [{ id: 0, url: null }] }));
    });

    vi.stubGlobal("fetch", fetchMock);

    const deck = await getResolvedHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const track = deck.cards[0]?.track;

    expect(track?.sourceLabel).toBe("NetEase Music");
    expect(track?.sourceUrl).toBe(`https://music.163.com/#/song?id=${seededTrack?.neteaseSongId}`);
    expect(track?.audioUrl).toBe("");
    expect(track?.fallbackAudioUrl).toBeUndefined();
    expect(track?.isPlayable).toBe(false);
  });

  it("uses a verified whitelist preview when NetEase has no playable URL", async () => {
    const seededTrack = getHomeSongDeck(undefined, { dateKey: "2026-06-04" }).cards[0]?.track;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const requestUrl = String(input);

      if (requestUrl.includes("/song/url/v1?")) {
        return new Response(JSON.stringify({ data: [{ id: seededTrack?.neteaseSongId, url: null }] }));
      }

      if (requestUrl.includes("/search?") || requestUrl.includes("itunes.apple.com")) {
        throw new Error("runtime search should not be used for homepage song audio");
      }

      return new Response(JSON.stringify({}));
    });

    vi.stubGlobal("fetch", fetchMock);

    const deck = await getResolvedHomeSongDeck(undefined, { dateKey: "2026-06-04" });
    const track = deck.cards[0]?.track;

    expect(track?.audioUrl).toBe(seededTrack?.audioUrl);
    expect(track?.sourceLabel).toBe("Verified Preview");
    expect(track?.sourceUrl).toBe(seededTrack?.sourceUrl);
    expect(track?.isPlayable).toBe(true);
  });

  it("keeps unresolved seeded tracks unchanged instead of replacing them with search results", async () => {
    const seededTrack = getHomeSongDeck(undefined, { dateKey: "2026-06-03" }).cards[1]?.track;
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 17100426, url: null }] })));

    vi.stubGlobal("fetch", fetchMock);

    const deck = await getResolvedHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const unresolvedTrack = deck.cards.find((card) => card.track.id === seededTrack?.id)?.track;

    expect(unresolvedTrack?.title).toBe(seededTrack?.title);
    expect(unresolvedTrack?.artist).toBe(seededTrack?.artist);
    expect(unresolvedTrack?.sourceUrl).toBe(seededTrack?.sourceUrl);
    expect(fetchMock.mock.calls.every(([input]) => !String(input).includes("/search?") && !String(input).includes("itunes.apple.com"))).toBe(true);
  });

  it("keeps deck navigation inside the same resolved daily group", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 0, url: null }] }))));

    const initialDeck = await getResolvedHomeSongDeck(undefined, { dateKey: "2026-06-03" });
    const nextDeck = await advanceResolvedHomeSongDeck(initialDeck.activeTrackId, "next", undefined, { dateKey: "2026-06-03" });

    expect(nextDeck.cards).toHaveLength(3);
    expect(nextDeck.cards.map((card) => card.track.id).sort()).toEqual(initialDeck.cards.map((card) => card.track.id).sort());
  });

  it("treats a JSON null POST body as an empty request body", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 0, url: null }] }))));

    const { POST } = await import("@/app/api/home/song-deck/route");
    const response = await POST(
      new Request("http://localhost/api/home/song-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "null",
      }),
    );

    const deck = (await response.json()) as { activeTrackId?: string; cards?: Array<{ track?: { id?: string } }> };

    expect(response.status).toBe(200);
    expect(deck.activeTrackId).toBeTruthy();
    expect(deck.cards).toHaveLength(3);
  });
});
