import { NextRequest, NextResponse } from "next/server";
import { t2s } from "@/lib/t2s";

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
    id: number;
    title: string;
    cover_medium: string;
  };
}

interface DeezerAlbum {
  id: number;
  title: string;
}

const POPULAR_ARTIST_IDS = [
  27, 75798, 13, 384236, 246791, 12246, 1562681, 230,
  4050205, 5575980, 288166, 4495517, 5313805, 339209,
  12778, 1188, 75491, 1133074, 119, 145, 543, 292, 5080,
  4412919, 9236132, 11247611, 399, 564, 1268, 268,
  15166, 429675, 8354140, 4210, 892, 301, 7757, 1518934,
  163, 9635624, 4491972, 1302232, 11110, 293585, 2589990,
  449, 9799821, 68, 5479714, 1139,
];

const OPTION_COUNT = 6;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Deduplicate tracks by title (case-insensitive, trimmed)
function dedupeTracksByTitle(tracks: DeezerTrack[]): DeezerTrack[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = (t.title_short || t.title).toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fetch top tracks of an artist
async function fetchArtistTopTracks(artistId: number): Promise<DeezerTrack[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/artist/${artistId}/top?limit=100`
    );
    const data = await res.json();
    return (data.data || []).filter((t: DeezerTrack) => t.preview);
  } catch {
    return [];
  }
}

// Fetch all albums of an artist
async function fetchArtistAlbums(artistId: number): Promise<DeezerAlbum[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/artist/${artistId}/albums?limit=50`
    );
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

// Fetch tracks from a specific album
async function fetchAlbumTracks(albumId: number): Promise<DeezerTrack[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/album/${albumId}/tracks?limit=50`
    );
    const data = await res.json();
    return (data.data || []).filter((t: DeezerTrack) => t.preview);
  } catch {
    return [];
  }
}

// Get the FULL discography of an artist: top tracks + all album tracks
async function fetchFullArtistTracks(artistId: number): Promise<DeezerTrack[]> {
  // Step 1: get top tracks
  const topTracks = await fetchArtistTopTracks(artistId);

  // Step 2: get all albums
  const albums = await fetchArtistAlbums(artistId);

  // Step 3: fetch tracks from each album in parallel (max 15 albums to stay fast)
  const albumsToFetch = albums.slice(0, 15);
  const albumTrackResults = await Promise.all(
    albumsToFetch.map((album) => fetchAlbumTracks(album.id))
  );

  // Step 4: merge and enrich album tracks with artist info from top tracks
  const allTracks: DeezerTrack[] = [...topTracks];
  const existingIds = new Set(topTracks.map((t) => t.id));

  // We need artist info for album tracks (album endpoint doesn't always include full artist info)
  const artistInfo = topTracks.length > 0
    ? topTracks[0].artist
    : { id: artistId, name: "", picture_medium: "" };

  for (const albumTracks of albumTrackResults) {
    for (const track of albumTracks) {
      if (!existingIds.has(track.id)) {
        // Ensure artist info is present
        if (!track.artist || !track.artist.name) {
          track.artist = artistInfo;
        }
        allTracks.push(track);
        existingIds.add(track.id);
      }
    }
  }

  return dedupeTracksByTitle(allTracks);
}

async function fetchChartTracks(): Promise<DeezerTrack[]> {
  try {
    const res = await fetch("https://api.deezer.com/chart/0/tracks?limit=100");
    const data = await res.json();
    return (data.data || []).filter((t: DeezerTrack) => t.preview);
  } catch {
    return [];
  }
}

async function fetchArtistInfo(
  artistId: number
): Promise<{ name: string; picture_medium: string } | null> {
  try {
    const res = await fetch(`https://api.deezer.com/artist/${artistId}`);
    const data = await res.json();
    return data.name
      ? { name: t2s(data.name), picture_medium: data.picture_medium }
      : null;
  } catch {
    return null;
  }
}

async function fetchRandomTracks(count: number): Promise<DeezerTrack[]> {
  const shuffledArtists = shuffle(POPULAR_ARTIST_IDS);
  const artistCount = Math.min(Math.ceil(count * 2.5), shuffledArtists.length);
  const selectedArtists = shuffledArtists.slice(0, artistCount);

  const allTracks: DeezerTrack[] = [];

  const results = await Promise.all(
    selectedArtists.map(async (artistId) => {
      try {
        const tracks = await fetchArtistTopTracks(artistId);
        if (tracks.length > 0) {
          return shuffle(tracks).slice(0, 3);
        }
      } catch {
        /* skip */
      }
      return [];
    })
  );

  for (const tracks of results) {
    allTracks.push(...tracks);
  }

  if (allTracks.length < count) {
    const chartTracks = await fetchChartTracks();
    const existing = new Set(allTracks.map((t) => t.id));
    for (const t of shuffle(chartTracks)) {
      if (!existing.has(t.id)) {
        allTracks.push(t);
        existing.add(t.id);
      }
    }
  }

  return shuffle(allTracks).slice(0, count);
}

// Fan mode: options are primarily from the artist's own discography
function generateFanSongOptions(
  correctTitle: string,
  allArtistTitles: string[],
  chartTitles: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctTitle);

  // Priority 1: use OTHER songs from the same artist (shuffled for randomness)
  const ownSongs = shuffle(
    allArtistTitles.filter((t) => t !== correctTitle)
  );
  for (const title of ownSongs) {
    if (options.size >= OPTION_COUNT) break;
    options.add(title);
  }

  // Priority 2: if artist doesn't have enough songs, use chart songs as fallback
  if (options.size < OPTION_COUNT) {
    const fallbacks = shuffle(
      chartTitles.filter((t) => !options.has(t))
    );
    for (const title of fallbacks) {
      if (options.size >= OPTION_COUNT) break;
      options.add(title);
    }
  }

  return shuffle(Array.from(options));
}

// Random mode: options are artist names
function generateArtistOptions(
  correctArtist: string,
  allArtists: string[],
  extraArtists: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctArtist);

  const others = shuffle(allArtists.filter((a) => a !== correctArtist));
  for (const artist of others) {
    if (options.size >= OPTION_COUNT) break;
    options.add(artist);
  }

  const extras = shuffle(
    extraArtists.filter((a) => a !== correctArtist && !options.has(a))
  );
  for (const artist of extras) {
    if (options.size >= OPTION_COUNT) break;
    options.add(artist);
  }

  return shuffle(Array.from(options));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode") || "random";
  const artistId = searchParams.get("artistId");
  const count = Math.min(
    Math.max(Number(searchParams.get("count")) || 10, 5),
    20
  );

  try {
    if (mode === "fan" && artistId) {
      // Fan mode: fetch FULL discography (top tracks + album tracks)
      const tracks = await fetchFullArtistTracks(Number(artistId));
      if (tracks.length === 0) {
        return NextResponse.json(
          { error: "未找到该歌手的歌曲，请换一位歌手试试。" },
          { status: 404 }
        );
      }

      // All unique song titles from this artist for option generation (simplified)
      const allArtistTitles = [
        ...new Set(tracks.map((t) => t2s(t.title_short || t.title))),
      ];

      // Fetch chart tracks as extra fallback for options only (simplified)
      const chartTracks = await fetchChartTracks();
      const chartTitles = chartTracks
        .filter((t) => t.artist.id !== Number(artistId))
        .map((t) => t2s(t.title_short || t.title));

      const shuffled = shuffle(tracks);
      const actualCount = Math.min(count, shuffled.length);
      const selected = shuffled.slice(0, actualCount);

      const questions = selected.map((track) => ({
        id: track.id,
        songTitle: t2s(track.title_short || track.title),
        previewUrl: track.preview,
        albumCover: track.album?.cover_medium || "",
        albumTitle: t2s(track.album?.title || ""),
        correctAnswer: t2s(track.title_short || track.title),
        artistName: t2s(track.artist.name),
        artistImage: track.artist.picture_medium,
        options: generateFanSongOptions(
          t2s(track.title_short || track.title),
          allArtistTitles,
          chartTitles
        ),
      }));

      return NextResponse.json({
        questions,
        total: questions.length,
        requestedCount: count,
        totalAvailable: tracks.length,
      });
    }

    // Random mode: play random songs, guess artist
    const tracks = await fetchRandomTracks(count);
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "获取歌曲失败，请重试。" },
        { status: 404 }
      );
    }

    const allArtistNames = [...new Set(tracks.map((t) => t2s(t.artist.name)))];

    const extraIds = shuffle(
      POPULAR_ARTIST_IDS.filter(
        (id) => !tracks.some((t) => t.artist.id === id)
      )
    ).slice(0, 12);

    const extraPromises = extraIds.map((id) => fetchArtistInfo(id));
    const extras = await Promise.all(extraPromises);
    const extraNames = extras.filter(Boolean).map((a) => t2s(a!.name));

    const questions = tracks.map((track) => ({
      id: track.id,
      songTitle: t2s(track.title_short || track.title),
      previewUrl: track.preview,
      albumCover: track.album?.cover_medium || "",
      albumTitle: t2s(track.album?.title || ""),
      correctAnswer: t2s(track.artist.name),
      artistName: t2s(track.artist.name),
      artistImage: track.artist.picture_medium,
      options: generateArtistOptions(
        t2s(track.artist.name),
        allArtistNames,
        extraNames
      ),
    }));

    return NextResponse.json({
      questions,
      total: questions.length,
      requestedCount: count,
    });
  } catch {
    return NextResponse.json(
      { error: "获取题目失败，请稍后重试。" },
      { status: 500 }
    );
  }
}
