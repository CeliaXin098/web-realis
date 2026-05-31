import { describe, expect, it } from "vitest";
import { advanceHomeSongDeck, getHomeSongDeck } from "@/lib/home/song-deck";

describe("home song deck", () => {
  it("returns black, rust, and receipt cards in the initial stack", () => {
    const deck = getHomeSongDeck();

    expect(deck.activeTrackId).toBe("w-01");
    expect(deck.cards.map((card) => card.kind)).toEqual(["player", "rust", "receipt"]);
    expect(deck.cards.map((card) => card.track.id)).toEqual(["w-01", "w-02", "w-03"]);
    expect(deck.cards.map((card) => card.track.title)).toEqual(["云烟成雨", "小半", "Come Away With Me"]);
    expect(deck.cards.map((card) => card.track.artist)).toEqual(["房东的猫", "陈粒", "Norah Jones"]);
  });

  it("cycles card positions when advancing to the next track", () => {
    const deck = advanceHomeSongDeck("w-01", "next");

    expect(deck.activeTrackId).toBe("w-02");
    expect(deck.cards.map((card) => card.kind)).toEqual(["rust", "receipt", "player"]);
    expect(deck.cards.map((card) => card.track.id)).toEqual(["w-02", "w-03", "w-01"]);
  });

  it("can bring a specific backing card to the front", () => {
    const deck = advanceHomeSongDeck("w-01", "select", "w-03");

    expect(deck.activeTrackId).toBe("w-03");
    expect(deck.cards.map((card) => card.kind)).toEqual(["receipt", "player", "rust"]);
    expect(deck.cards.map((card) => card.track.id)).toEqual(["w-03", "w-01", "w-02"]);
  });

  it("falls back to the first track when given an unknown active id", () => {
    const deck = advanceHomeSongDeck("missing", "previous");

    expect(deck.activeTrackId).toBe("w-03");
    expect(deck.cards.map((card) => card.track.id)).toEqual(["w-03", "w-01", "w-02"]);
  });
});
