import { NextResponse } from "next/server";
import { advanceResolvedHomeSongDeck, getResolvedHomeSongDeck, type HomeSongDeckAction } from "@/lib/home/song-deck";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(await getResolvedHomeSongDeck(url.searchParams.get("activeTrackId")));
}

export async function POST(request: Request) {
  const parsedBody = await request.json().catch(() => ({}));
  const body = (parsedBody && typeof parsedBody === "object" ? parsedBody : {}) as {
    activeTrackId?: string;
    action?: HomeSongDeckAction;
    selectedTrackId?: string;
  };

  const action: HomeSongDeckAction =
    body.action === "previous" || body.action === "select" ? body.action : "next";

  return NextResponse.json(await advanceResolvedHomeSongDeck(body.activeTrackId, action, body.selectedTrackId));
}
