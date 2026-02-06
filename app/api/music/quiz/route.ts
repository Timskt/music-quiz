import { NextRequest, NextResponse } from "next/server";

interface DeezerTrack {
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
    title: string;
    cover_medium: string;
  };
}

interface DeezerResponse {
  data: DeezerTrack[];
  total: number;
}

const POPULAR_ARTIST_IDS = [
  27, 75798, 13, 384236, 246791, 12246, 1562681, 230,
  4050205, 5575980, 288166, 4495517, 5313805, 339209,
  12778, 1188, 75491, 1133074, 119, 145, 543, 292, 5080,
  4412919, 9236132, 11247611, 399, 564, 1268, 268,
];

async function fetchArtistTracks(artistId: number): Promise<DeezerTrack[]> {
  const res = await fetch(
    `https://api.deezer.com/artist/${artistId}/top?limit=50`
  );
  const data: DeezerResponse = await res.json();
  return (data.data || []).filter((t) => t.preview);
}

async function fetchArtistInfo(artistId: number): Promise<{ name: string; picture_medium: string } | null> {
  try {
    const res = await fetch(`https://api.deezer.com/artist/${artistId}`);
    const data = await res.json();
    return data.name ? { name: data.name, picture_medium: data.picture_medium } : null;
  } catch {
    return null;
  }
}

async function fetchRandomTracks(count: number): Promise<DeezerTrack[]> {
  const shuffled = [...POPULAR_ARTIST_IDS].sort(() => Math.random() - 0.5);
  const artistCount = Math.min(Math.ceil(count * 1.5), shuffled.length);
  const selectedArtists = shuffled.slice(0, artistCount);

  const allTracks: DeezerTrack[] = [];
  const fetchPromises = selectedArtists.map(async (artistId) => {
    try {
      const tracks = await fetchArtistTracks(artistId);
      if (tracks.length > 0) {
        const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
        return shuffledTracks.slice(0, 2);
      }
    } catch {
      return [];
    }
    return [];
  });

  const results = await Promise.all(fetchPromises);
  for (const tracks of results) {
    allTracks.push(...tracks);
  }

  return allTracks.sort(() => Math.random() - 0.5).slice(0, count);
}

function generateArtistOptions(correctArtist: string, allArtists: string[]): string[] {
  const options = new Set<string>();
  options.add(correctArtist);

  const others = allArtists.filter((a) => a !== correctArtist).sort(() => Math.random() - 0.5);
  for (const artist of others) {
    if (options.size >= 4) break;
    options.add(artist);
  }

  const fallbackArtists = [
    "Adele", "Drake", "Taylor Swift", "Ed Sheeran",
    "Beyonce", "Eminem", "Rihanna", "Bruno Mars",
    "The Weeknd", "Ariana Grande", "Coldplay", "Lady Gaga",
  ];
  for (const artist of fallbackArtists) {
    if (options.size >= 4) break;
    if (artist !== correctArtist) options.add(artist);
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

function generateSongTitleOptions(correctTitle: string, allTitles: string[]): string[] {
  const options = new Set<string>();
  options.add(correctTitle);

  const others = allTitles.filter((t) => t !== correctTitle).sort(() => Math.random() - 0.5);
  for (const title of others) {
    if (options.size >= 4) break;
    options.add(title);
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode") || "random";
  const artistId = searchParams.get("artistId");
  const count = Math.min(Math.max(Number(searchParams.get("count")) || 10, 5), 20);

  try {
    if (mode === "fan" && artistId) {
      // Fan mode: play songs from specific artist, guess song title
      const tracks = await fetchArtistTracks(Number(artistId));
      if (tracks.length === 0) {
        return NextResponse.json({ error: "未找到该歌手的歌曲，请换一位歌手试试。" }, { status: 404 });
      }

      const shuffled = tracks.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));
      const allTitles = tracks.map((t) => t.title_short || t.title);

      const questions = selected.map((track) => ({
        id: track.id,
        songTitle: track.title_short || track.title,
        previewUrl: track.preview,
        albumCover: track.album.cover_medium,
        albumTitle: track.album.title,
        correctAnswer: track.title_short || track.title,
        artistName: track.artist.name,
        artistImage: track.artist.picture_medium,
        options: generateSongTitleOptions(track.title_short || track.title, allTitles),
      }));

      return NextResponse.json({ questions, total: questions.length });
    }

    // Random mode: play random songs, guess artist
    const tracks = await fetchRandomTracks(count);
    if (tracks.length === 0) {
      return NextResponse.json({ error: "获取歌曲失败，请重试。" }, { status: 404 });
    }

    const allArtistNames = [...new Set(tracks.map((t) => t.artist.name))];

    // If not enough unique artists for options, fetch more names
    let optionPool = allArtistNames;
    if (allArtistNames.length < 6) {
      const extraIds = POPULAR_ARTIST_IDS
        .filter((id) => !tracks.some((t) => t.artist.id === id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);

      const extraPromises = extraIds.map((id) => fetchArtistInfo(id));
      const extras = await Promise.all(extraPromises);
      const extraNames = extras.filter(Boolean).map((a) => a!.name);
      optionPool = [...allArtistNames, ...extraNames];
    }

    const questions = tracks.map((track) => ({
      id: track.id,
      songTitle: track.title_short || track.title,
      previewUrl: track.preview,
      albumCover: track.album.cover_medium,
      albumTitle: track.album.title,
      correctAnswer: track.artist.name,
      artistName: track.artist.name,
      artistImage: track.artist.picture_medium,
      options: generateArtistOptions(track.artist.name, optionPool),
    }));

    return NextResponse.json({ questions, total: questions.length });
  } catch {
    return NextResponse.json({ error: "获取题目失败，请稍后重试。" }, { status: 500 });
  }
}
