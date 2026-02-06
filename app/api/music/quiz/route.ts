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

// Expanded pool: 50 popular artists for richer random mode and option generation
const POPULAR_ARTIST_IDS = [
  27, 75798, 13, 384236, 246791, 12246, 1562681, 230,
  4050205, 5575980, 288166, 4495517, 5313805, 339209,
  12778, 1188, 75491, 1133074, 119, 145, 543, 292, 5080,
  4412919, 9236132, 11247611, 399, 564, 1268, 268,
  15166, 429675, 8354140, 4210, 892, 301, 7757, 1518934,
  163, 9635624, 4491972, 1302232, 11110, 293585, 2589990,
  449, 9799821, 68, 5479714, 1139,
];

// Fallback song titles pool for fan mode distractors
const FALLBACK_SONG_TITLES = [
  "Shape of You", "Blinding Lights", "Rolling in the Deep",
  "Bohemian Rhapsody", "Billie Jean", "Smells Like Teen Spirit",
  "Hotel California", "Imagine", "Yesterday", "Let It Be",
  "Wonderwall", "Stairway to Heaven", "Lose Yourself",
  "Someone Like You", "Uptown Funk", "Old Town Road",
  "Bad Guy", "Havana", "Shallow", "Perfect",
  "Despacito", "Sorry", "Closer", "Starboy",
  "Watermelon Sugar", "Levitating", "Stay", "Peaches",
  "drivers license", "Good 4 U", "Kiss Me More", "Montero",
  "As It Was", "Anti-Hero", "Flowers", "Cruel Summer",
  "Die For You", "Kill Bill", "Unholy", "Vampire",
];

// Fallback artist names pool for random mode distractors
const FALLBACK_ARTIST_NAMES = [
  "Adele", "Drake", "Taylor Swift", "Ed Sheeran",
  "Beyonce", "Eminem", "Rihanna", "Bruno Mars",
  "The Weeknd", "Ariana Grande", "Coldplay", "Lady Gaga",
  "Billie Eilish", "Post Malone", "Dua Lipa", "Justin Bieber",
  "Kanye West", "Kendrick Lamar", "Bad Bunny", "Harry Styles",
  "Olivia Rodrigo", "SZA", "Doja Cat", "Lil Nas X",
  "BTS", "BLACKPINK", "Travis Scott", "The Chainsmokers",
  "Imagine Dragons", "Maroon 5", "Sam Smith", "Shawn Mendes",
  "Miley Cyrus", "Selena Gomez", "Cardi B", "Megan Thee Stallion",
  "Lizzo", "Demi Lovato", "Halsey", "Lana Del Rey",
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

async function fetchArtistTracks(artistId: number, limit = 100): Promise<DeezerTrack[]> {
  const res = await fetch(
    `https://api.deezer.com/artist/${artistId}/top?limit=${limit}`
  );
  const data: DeezerResponse = await res.json();
  return (data.data || []).filter((t) => t.preview);
}

async function fetchChartTracks(): Promise<DeezerTrack[]> {
  try {
    const res = await fetch("https://api.deezer.com/chart/0/tracks?limit=100");
    const data: DeezerResponse = await res.json();
    return (data.data || []).filter((t) => t.preview);
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
      ? { name: data.name, picture_medium: data.picture_medium }
      : null;
  } catch {
    return null;
  }
}

async function fetchRandomTracks(count: number): Promise<DeezerTrack[]> {
  // Fetch from more artists to ensure we have enough unique tracks
  const shuffledArtists = shuffle(POPULAR_ARTIST_IDS);
  const artistCount = Math.min(Math.ceil(count * 2.5), shuffledArtists.length);
  const selectedArtists = shuffledArtists.slice(0, artistCount);

  const allTracks: DeezerTrack[] = [];

  const results = await Promise.all(
    selectedArtists.map(async (artistId) => {
      try {
        const tracks = await fetchArtistTracks(artistId, 30);
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

  // Also fetch chart tracks as backup
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

function generateSongTitleOptions(
  correctTitle: string,
  allTitles: string[],
  fallbackTitles: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctTitle);

  // First draw from the artist's other songs (shuffled)
  const others = shuffle(allTitles.filter((t) => t !== correctTitle));
  for (const title of others) {
    if (options.size >= OPTION_COUNT) break;
    options.add(title);
  }

  // If still not enough, draw from fallback pool (external distractors)
  const fallbacks = shuffle(
    fallbackTitles.filter((t) => t !== correctTitle && !options.has(t))
  );
  for (const title of fallbacks) {
    if (options.size >= OPTION_COUNT) break;
    options.add(title);
  }

  // Last resort: use the static pool
  const staticFallbacks = shuffle(
    FALLBACK_SONG_TITLES.filter((t) => t !== correctTitle && !options.has(t))
  );
  for (const title of staticFallbacks) {
    if (options.size >= OPTION_COUNT) break;
    options.add(title);
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

  // Draw from other artists in the quiz pool
  const others = shuffle(allArtists.filter((a) => a !== correctArtist));
  for (const artist of others) {
    if (options.size >= OPTION_COUNT) break;
    options.add(artist);
  }

  // Draw from extra artist names
  const extras = shuffle(
    extraArtists.filter((a) => a !== correctArtist && !options.has(a))
  );
  for (const artist of extras) {
    if (options.size >= OPTION_COUNT) break;
    options.add(artist);
  }

  // Last resort static pool
  const fallbacks = shuffle(
    FALLBACK_ARTIST_NAMES.filter((a) => a !== correctArtist && !options.has(a))
  );
  for (const artist of fallbacks) {
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
      // Fan mode: play songs from specific artist, guess song title
      const tracks = await fetchArtistTracks(Number(artistId), 100);
      if (tracks.length === 0) {
        return NextResponse.json(
          { error: "未找到该歌手的歌曲，请换一位歌手试试。" },
          { status: 404 }
        );
      }

      // Fetch chart tracks for distractor song titles
      const chartTracks = await fetchChartTracks();
      const chartTitles = chartTracks
        .filter((t) => t.artist.id !== Number(artistId))
        .map((t) => t.title_short || t.title);

      const shuffled = shuffle(tracks);
      // Ensure we don't exceed available track count
      const actualCount = Math.min(count, shuffled.length);
      const selected = shuffled.slice(0, actualCount);
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
        options: generateSongTitleOptions(
          track.title_short || track.title,
          allTitles,
          chartTitles
        ),
      }));

      return NextResponse.json({
        questions,
        total: questions.length,
        requestedCount: count,
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

    const allArtistNames = [...new Set(tracks.map((t) => t.artist.name))];

    // Fetch extra artist names for diverse distractors
    const extraIds = shuffle(
      POPULAR_ARTIST_IDS.filter(
        (id) => !tracks.some((t) => t.artist.id === id)
      )
    ).slice(0, 12);

    const extraPromises = extraIds.map((id) => fetchArtistInfo(id));
    const extras = await Promise.all(extraPromises);
    const extraNames = extras.filter(Boolean).map((a) => a!.name);

    const questions = tracks.map((track) => ({
      id: track.id,
      songTitle: track.title_short || track.title,
      previewUrl: track.preview,
      albumCover: track.album.cover_medium,
      albumTitle: track.album.title,
      correctAnswer: track.artist.name,
      artistName: track.artist.name,
      artistImage: track.artist.picture_medium,
      options: generateArtistOptions(track.artist.name, allArtistNames, extraNames),
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
