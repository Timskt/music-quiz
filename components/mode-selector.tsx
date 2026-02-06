"use client";

import { useState, useCallback } from "react";
import { Music, Shuffle, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string;
  nb_fan: number;
}

interface ModeSelectorProps {
  onStartQuiz: (mode: "fan" | "random", artistId?: number, artistName?: string) => void;
}

export function ModeSelector({ onStartQuiz }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<"fan" | "random" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DeezerArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<DeezerArtist | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleStartFanMode = () => {
    if (selectedArtist) {
      onStartQuiz("fan", selectedArtist.id, selectedArtist.name);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground text-balance">MusicQ</h1>
        <p className="text-muted-foreground">
          Listen to the song, guess the artist!
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Fan Mode */}
        <button
          onClick={() => {
            setSelectedMode("fan");
            setSelectedArtist(null);
            setSearchQuery("");
            setSearchResults([]);
          }}
          className={cn(
            "group flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all cursor-pointer",
            selectedMode === "fan"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            selectedMode === "fan" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Fan Session</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Search for an artist and test your knowledge about their songs
            </p>
          </div>
        </button>

        {/* Random Mode */}
        <button
          onClick={() => {
            setSelectedMode("random");
            setSelectedArtist(null);
          }}
          className={cn(
            "group flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all cursor-pointer",
            selectedMode === "random"
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-accent/30"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            selectedMode === "random" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"
          )}>
            <Shuffle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Random Session</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Random songs from various artists, test your general music knowledge
            </p>
          </div>
        </button>
      </div>

      {/* Fan mode: artist search */}
      {selectedMode === "fan" && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for an artist..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2 max-h-64 overflow-y-auto">
              {searchResults.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => {
                    setSelectedArtist(artist);
                    setSearchResults([]);
                    setSearchQuery(artist.name);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 text-left transition-all cursor-pointer",
                    "hover:bg-secondary",
                    selectedArtist?.id === artist.id && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <img
                    src={artist.picture_medium || "/placeholder.svg"}
                    alt={artist.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {artist.nb_fan?.toLocaleString()} fans
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected artist */}
          {selectedArtist && (
            <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4 animate-slide-up">
              <img
                src={selectedArtist.picture_medium || "/placeholder.svg"}
                alt={selectedArtist.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary"
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{selectedArtist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedArtist.nb_fan?.toLocaleString()} fans
                </p>
              </div>
            </div>
          )}

          {selectedArtist && (
            <button
              onClick={handleStartFanMode}
              className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 animate-slide-up"
            >
              Start Fan Session
            </button>
          )}
        </div>
      )}

      {/* Random mode: start button */}
      {selectedMode === "random" && (
        <button
          onClick={() => onStartQuiz("random")}
          className="rounded-lg bg-accent px-8 py-3 font-semibold text-accent-foreground transition-all hover:bg-accent/90 animate-slide-up"
        >
          Start Random Session
        </button>
      )}
    </div>
  );
}
