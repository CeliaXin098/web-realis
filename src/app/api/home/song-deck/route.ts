import { NextResponse } from "next/server";
import { advanceHomeSongDeck, getHomeSongDeck, type HomeSongDeckAction } from "@/lib/home/song-deck";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(getHomeSongDeck(url.searchParams.get("activeTrackId")));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    activeTrackId?: string;
    action?: HomeSongDeckAction;
    selectedTrackId?: string;
  };

  const action: HomeSongDeckAction =
    body.action === "previous" || body.action === "select" ? body.action : "next";

  return NextResponse.json(advanceHomeSongDeck(body.activeTrackId, action, body.selectedTrackId));
}
