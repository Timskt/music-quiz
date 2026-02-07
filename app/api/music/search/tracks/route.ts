import { NextRequest, NextResponse } from "next/server";
import { t2s } from "@/lib/t2s";

interface DeezerTrackResult {
  id: number;
  title: string;
  title_short: string;
  preview: string;
  artist: {
    id: number;
    name: string;
    picture_medium: string;
  };
  album: {
    id: number;
    title: string;
    cover_small: string;
    cover_medium: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=15`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    const tracks = (data.data || [])
      .filter((t: DeezerTrackResult) => t.preview)
      .map((t: DeezerTrackResult) => ({
        id: t.id,
        title: t2s(t.title_short || t.title),
        artistName: t2s(t.artist.name),
        artistId: t.artist.id,
        albumCover: t.album?.cover_small || t.album?.cover_medium || "",
        preview: t.preview,
      }));

    return NextResponse.json({ data: tracks });
  } catch {
    return NextResponse.json(
      { error: "Failed to search tracks" },
      { status: 500 }
    );
  }
}
