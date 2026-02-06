import { NextRequest, NextResponse } from "next/server";

interface DeezerTrack {
  id: number;
  title: string;
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

// Popular artist IDs from Deezer for random mode
const POPULAR_ARTIST_IDS = [
  27, // Daft Punk
  75798, // Eminem
  13, // Rihanna
  1, // The Corrs
  384236, // Ed Sheeran
  246791, // Taylor Swift
  12246, // Coldplay
  1562681, // Bruno Mars
  230, // Kanye West
  4050205, // The Weeknd
  5575980, // Adele
  288166, // Ariana Grande
  4495517, // Post Malone
  5313805, // Billie Eilish
  339209, // Lady Gaga
  12778, // Maroon 5
  1188, // Jay-Z
  75491, // Imagine Dragons
  1133074, // Drake
  119, // Queen
  145, // Linkin Park
  543, // Michael Jackson
  1, // The Corrs
  292, // Beyonce
  5080, // Shakira
];

async function fetchArtistTracks(artistId: number): Promise<DeezerTrack[]> {
  const res = await fetch(
    `https://api.deezer.com/artist/${artistId}/top?limit=50`
  );
  const data: DeezerResponse = await res.json();
  // Only return tracks that have preview URLs
  return (data.data || []).filter((t) => t.preview);
}

async function fetchRandomTracks(): Promise<DeezerTrack[]> {
  // Pick 8 random artists from our list
  const shuffled = [...POPULAR_ARTIST_IDS].sort(() => Math.random() - 0.5);
  const selectedArtists = shuffled.slice(0, 8);

  const allTracks: DeezerTrack[] = [];
  const fetchPromises = selectedArtists.map(async (artistId) => {
    try {
      const tracks = await fetchArtistTracks(artistId);
      if (tracks.length > 0) {
        // Pick 1-2 random tracks from each artist
        const count = Math.min(2, tracks.length);
        const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
        return shuffledTracks.slice(0, count);
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

  return allTracks.sort(() => Math.random() - 0.5).slice(0, 10);
}

function generateOptions(
  correctArtist: string,
  allArtists: string[]
): string[] {
  const options = new Set<string>();
  options.add(correctArtist);

  const others = allArtists.filter((a) => a !== correctArtist);
  const shuffledOthers = others.sort(() => Math.random() - 0.5);

  for (const artist of shuffledOthers) {
    if (options.size >= 4) break;
    options.add(artist);
  }

  // If we don't have enough options, add some fallback artists
  const fallbackArtists = [
    "Adele", "Drake", "Taylor Swift", "Ed Sheeran",
    "Beyonce", "Eminem", "Rihanna", "Bruno Mars",
    "The Weeknd", "Ariana Grande", "Coldplay", "Lady Gaga",
  ];
  for (const artist of fallbackArtists) {
    if (options.size >= 4) break;
    if (artist !== correctArtist) {
      options.add(artist);
    }
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode") || "random";
  const artistId = searchParams.get("artistId");

  try {
    let tracks: DeezerTrack[];

    if (mode === "fan" && artistId) {
      tracks = await fetchArtistTracks(Number(artistId));
      // For fan mode, we need tracks from the same artist
      // Shuffle and pick 10
      tracks = tracks.sort(() => Math.random() - 0.5).slice(0, 10);
    } else {
      tracks = await fetchRandomTracks();
    }

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "No tracks found. Please try again." },
        { status: 404 }
      );
    }

    // Collect all unique artist names for generating options
    const allArtistNames = [...new Set(tracks.map((t) => t.artist.name))];

    // For fan mode, we need fake options from other popular artists
    let optionPool = allArtistNames;
    if (mode === "fan") {
      // Fetch some other artists for fake options
      const otherArtistIds = POPULAR_ARTIST_IDS.filter(
        (id) => id !== Number(artistId)
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const otherArtistNames: string[] = [];
      for (const id of otherArtistIds) {
        try {
          const res = await fetch(`https://api.deezer.com/artist/${id}`);
          const data = await res.json();
          if (data.name) otherArtistNames.push(data.name);
        } catch {
          // skip
        }
      }
      optionPool = [...allArtistNames, ...otherArtistNames];
    }

    const questions = tracks.map((track) => ({
      id: track.id,
      songTitle: track.title,
      previewUrl: track.preview,
      albumCover: track.album.cover_medium,
      albumTitle: track.album.title,
      correctArtist: track.artist.name,
      artistImage: track.artist.picture_medium,
      options: generateOptions(track.artist.name, optionPool),
    }));

    return NextResponse.json({ questions, total: questions.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quiz data" },
      { status: 500 }
    );
  }
}
