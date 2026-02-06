import { NextRequest, NextResponse } from "next/server";
import { t2s } from "@/lib/t2s";

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string;
  nb_fan: number;
  nb_album: number;
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
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=10`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    // Convert artist names from Traditional to Simplified Chinese
    if (data.data) {
      data.data = data.data.map((artist: DeezerArtist) => ({
        ...artist,
        name: t2s(artist.name),
      }));
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}
