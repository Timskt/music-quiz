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
  27, 75798, 13, 384236, 246791, 12246, 1562681, 230, 4050205, 5575980,
  288166, 4495517, 5313805, 339209, 12778, 1188, 75491, 1133074, 119, 145,
  543, 292, 5080, 4412919, 9236132, 11247611, 399, 564, 1268, 268, 15166,
  429675, 8354140, 4210, 892, 301, 7757, 1518934, 163, 9635624, 4491972,
  1302232, 11110, 293585, 2589990, 449, 9799821, 68, 5479714, 1139,
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

function dedupeTracksByTitle(tracks: DeezerTrack[]): DeezerTrack[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = (t.title_short || t.title).toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchArtistDetail(artistId: number) {
  try {
    const res = await fetch(`https://api.deezer.com/artist/${artistId}`);
    const data = await res.json();
    if (data.error) return null;
    return {
      id: data.id as number,
      name: (data.name || "") as string,
      picture_medium: (data.picture_medium || "") as string,
    };
  } catch {
    return null;
  }
}

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

async function fetchTrackById(trackId: number): Promise<DeezerTrack | null> {
  try {
    const res = await fetch(`https://api.deezer.com/track/${trackId}`);
    const data = await res.json();
    if (data.error || !data.preview) return null;
    return data as DeezerTrack;
  } catch {
    return null;
  }
}

async function fetchFullArtistTracks(
  artistId: number
): Promise<{
  tracks: DeezerTrack[];
  artistInfo: { id: number; name: string; picture_medium: string };
}> {
  const artistDetail = await fetchArtistDetail(artistId);
  const artistInfo = artistDetail || {
    id: artistId,
    name: "",
    picture_medium: "",
  };

  const topTracks = await fetchArtistTopTracks(artistId);

  if (!artistInfo.name && topTracks.length > 0) {
    artistInfo.name = topTracks[0].artist.name;
    artistInfo.picture_medium = topTracks[0].artist.picture_medium;
  }

  const albums = await fetchArtistAlbums(artistId);
  const albumsToFetch = albums.slice(0, 15);
  const albumTrackResults = await Promise.all(
    albumsToFetch.map((album) => fetchAlbumTracks(album.id))
  );

  const allTracks: DeezerTrack[] = [];
  const existingIds = new Set<number>();

  for (const track of topTracks) {
    track.artist = {
      id: artistInfo.id,
      name: artistInfo.name,
      picture_medium: artistInfo.picture_medium,
    };
    allTracks.push(track);
    existingIds.add(track.id);
  }

  for (const albumTracks of albumTrackResults) {
    for (const track of albumTracks) {
      if (existingIds.has(track.id)) continue;
      const trackArtistId = track.artist?.id;
      const isMatch =
        trackArtistId === artistId || !trackArtistId || !track.artist?.name;
      if (isMatch) {
        track.artist = {
          id: artistInfo.id,
          name: artistInfo.name,
          picture_medium: artistInfo.picture_medium,
        };
        allTracks.push(track);
        existingIds.add(track.id);
      }
    }
  }

  return { tracks: dedupeTracksByTitle(allTracks), artistInfo };
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
  id: number
): Promise<{ name: string; picture_medium: string } | null> {
  const detail = await fetchArtistDetail(id);
  if (detail)
    return { name: t2s(detail.name), picture_medium: detail.picture_medium };
  return null;
}

async function fetchRandomTracks(count: number): Promise<DeezerTrack[]> {
  const shuffledArtists = shuffle(POPULAR_ARTIST_IDS);
  const artistCount = Math.min(
    Math.ceil(count * 2.5),
    shuffledArtists.length
  );
  const selectedArtists = shuffledArtists.slice(0, artistCount);

  const allTracks: DeezerTrack[] = [];

  const results = await Promise.all(
    selectedArtists.map(async (aId) => {
      try {
        const tracks = await fetchArtistTopTracks(aId);
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

function generateFanSongOptions(
  correctTitle: string,
  allArtistTitles: string[],
  chartTitles: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctTitle);

  const ownSongs = shuffle(
    allArtistTitles.filter((t) => t !== correctTitle)
  );
  for (const title of ownSongs) {
    if (options.size >= OPTION_COUNT) break;
    options.add(title);
  }

  if (options.size < OPTION_COUNT) {
    const fallbacks = shuffle(chartTitles.filter((t) => !options.has(t)));
    for (const title of fallbacks) {
      if (options.size >= OPTION_COUNT) break;
      options.add(title);
    }
  }

  return shuffle(Array.from(options));
}

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

// Generate options for custom mode: guess artist from options
function generateCustomArtistOptions(
  correctArtist: string,
  allArtistsInPlaylist: string[],
  chartArtists: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctArtist);

  // First use other artists from the user's playlist
  const playlistOthers = shuffle(
    allArtistsInPlaylist.filter((a) => a !== correctArtist)
  );
  for (const a of playlistOthers) {
    if (options.size >= OPTION_COUNT) break;
    options.add(a);
  }

  // Then chart artists as fallback
  const fallbacks = shuffle(
    chartArtists.filter((a) => !options.has(a))
  );
  for (const a of fallbacks) {
    if (options.size >= OPTION_COUNT) break;
    options.add(a);
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
  // Custom mode: comma-separated track IDs
  const trackIdsParam = searchParams.get("trackIds");

  try {
    // ========================
    // CUSTOM MODE
    // ========================
    if (mode === "custom" && trackIdsParam) {
      const trackIds = trackIdsParam
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id) && id > 0);

      if (trackIds.length === 0) {
        return NextResponse.json(
          { error: "请至少选择一首歌曲。" },
          { status: 400 }
        );
      }

      // Fetch all tracks in parallel, keeping order
      const trackResults = await Promise.all(
        trackIds.map((id) => fetchTrackById(id))
      );
      const validTracks = trackResults.filter(
        (t): t is DeezerTrack => t !== null
      );

      if (validTracks.length === 0) {
        return NextResponse.json(
          { error: "所有选择的歌曲均无法获取预览，请重新选择。" },
          { status: 404 }
        );
      }

      // Collect all artist names from the playlist for options
      const allPlaylistArtists = [
        ...new Set(validTracks.map((t) => t2s(t.artist.name))),
      ];

      // Fetch chart for extra artist names as fallback
      const chartTracks = await fetchChartTracks();
      const chartArtists = [
        ...new Set(chartTracks.map((t) => t2s(t.artist.name))),
      ];

      // Keep the user's chosen order
      const questions = validTracks.map((track) => {
        const artistName = t2s(track.artist.name);
        const songTitle = t2s(track.title_short || track.title);
        return {
          id: track.id,
          songTitle,
          previewUrl: track.preview,
          albumCover: track.album?.cover_medium || "",
          albumTitle: t2s(track.album?.title || ""),
          correctAnswer: artistName,
          artistName,
          artistImage: track.artist.picture_medium || "",
          options: generateCustomArtistOptions(
            artistName,
            allPlaylistArtists,
            chartArtists
          ),
        };
      });

      return NextResponse.json({
        questions,
        total: questions.length,
        requestedCount: trackIds.length,
      });
    }

    // ========================
    // FAN MODE
    // ========================
    if (mode === "fan" && artistId) {
      const { tracks, artistInfo } = await fetchFullArtistTracks(
        Number(artistId)
      );

      if (tracks.length === 0) {
        return NextResponse.json(
          { error: "未找到该歌手的歌曲，请换一位歌手试试。" },
          { status: 404 }
        );
      }

      const simplifiedArtistName = t2s(artistInfo.name);

      const allArtistTitles = [
        ...new Set(tracks.map((t) => t2s(t.title_short || t.title))),
      ];

      const chartTracks = await fetchChartTracks();
      const chartTitles = chartTracks
        .filter((t) => t.artist.id !== Number(artistId))
        .map((t) => t2s(t.title_short || t.title));

      const shuffled = shuffle(tracks);
      const actualCount = Math.min(count, shuffled.length);
      const selected = shuffled.slice(0, actualCount);

      const questions = selected.map((track) => {
        const songTitle = t2s(track.title_short || track.title);
        return {
          id: track.id,
          songTitle,
          previewUrl: track.preview,
          albumCover: track.album?.cover_medium || "",
          albumTitle: t2s(track.album?.title || ""),
          correctAnswer: songTitle,
          artistName: simplifiedArtistName,
          artistImage: artistInfo.picture_medium,
          options: generateFanSongOptions(
            songTitle,
            allArtistTitles,
            chartTitles
          ),
        };
      });

      return NextResponse.json({
        questions,
        total: questions.length,
        requestedCount: count,
        totalAvailable: tracks.length,
      });
    }

    // ========================
    // RANDOM MODE
    // ========================
    const tracks = await fetchRandomTracks(count);
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "获取歌曲失败，请重试。" },
        { status: 404 }
      );
    }

    const allArtistNames = [
      ...new Set(tracks.map((t) => t2s(t.artist.name))),
    ];

    const extraIds = shuffle(
      POPULAR_ARTIST_IDS.filter(
        (id) => !tracks.some((t) => t.artist.id === id)
      )
    ).slice(0, 12);

    const extraPromises = extraIds.map((id) => fetchArtistInfo(id));
    const extras = await Promise.all(extraPromises);
    const extraNames = extras.filter(Boolean).map((a) => t2s(a!.name));

    const questions = tracks.map((track) => {
      const artistName = t2s(track.artist.name);
      return {
        id: track.id,
        songTitle: t2s(track.title_short || track.title),
        previewUrl: track.preview,
        albumCover: track.album?.cover_medium || "",
        albumTitle: t2s(track.album?.title || ""),
        correctAnswer: artistName,
        artistName,
        artistImage: track.artist.picture_medium,
        options: generateArtistOptions(artistName, allArtistNames, extraNames),
      };
    });

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
