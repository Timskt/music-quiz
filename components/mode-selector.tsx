"use client";

import { useState, useCallback } from "react";
import { Music, Shuffle, Search, Loader2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string;
  nb_fan: number;
}

interface ModeSelectorProps {
  onStartQuiz: (
    mode: "fan" | "random",
    count: number,
    artistId?: number,
    artistName?: string
  ) => void;
}

export function ModeSelector({ onStartQuiz }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<"fan" | "random" | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DeezerArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<DeezerArtist | null>(
    null
  );
  const [questionCount, setQuestionCount] = useState(10);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const adjustCount = (delta: number) => {
    setQuestionCount((c) => Math.min(20, Math.max(5, c + delta)));
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
          {"听歌猜猜猜"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {"听一段旋律，猜出歌手或歌曲名"}
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid gap-3 grid-cols-2">
        {/* Fan Mode */}
        <button
          type="button"
          onClick={() => {
            setSelectedMode("fan");
            setSelectedArtist(null);
            setSearchQuery("");
            setSearchResults([]);
          }}
          className={cn(
            "group flex flex-col items-center gap-3 rounded-xl border-2 p-4 sm:p-6 text-center transition-all cursor-pointer",
            selectedMode === "fan"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              selectedMode === "fan"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}
          >
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              {"粉丝专场"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {"选择你喜欢的歌手，听歌猜歌名"}
            </p>
          </div>
        </button>

        {/* Random Mode */}
        <button
          type="button"
          onClick={() => {
            setSelectedMode("random");
            setSelectedArtist(null);
          }}
          className={cn(
            "group flex flex-col items-center gap-3 rounded-xl border-2 p-4 sm:p-6 text-center transition-all cursor-pointer",
            selectedMode === "random"
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-accent/30"
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              selectedMode === "random"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"
            )}
          >
            <Shuffle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              {"随机专场"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {"随机播放热门歌曲，听歌猜歌手"}
            </p>
          </div>
        </button>
      </div>

      {/* Question count */}
      {selectedMode && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 animate-slide-up">
          <span className="text-sm text-muted-foreground">{"题目数量"}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustCount(-1)}
              disabled={questionCount <= 5}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-mono text-lg font-bold text-foreground">
              {questionCount}
            </span>
            <button
              type="button"
              onClick={() => adjustCount(1)}
              disabled={questionCount >= 20}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Fan mode: artist search */}
      {selectedMode === "fan" && (
        <div className="flex flex-col gap-3 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索歌手名称..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && !selectedArtist && (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2 max-h-56 overflow-y-auto">
              {searchResults.map((artist) => (
                <button
                  type="button"
                  key={artist.id}
                  onClick={() => {
                    setSelectedArtist(artist);
                    setSearchResults([]);
                    setSearchQuery(artist.name);
                  }}
                  className="flex items-center gap-3 rounded-lg p-2.5 text-left transition-all cursor-pointer hover:bg-secondary"
                >
                  <img
                    src={artist.picture_medium || "/placeholder.svg"}
                    alt={artist.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm text-foreground">
                      {artist.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {artist.nb_fan?.toLocaleString()}
                      {" 粉丝"}
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
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {selectedArtist.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedArtist.nb_fan?.toLocaleString()}
                  {" 粉丝"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedArtist(null);
                  setSearchQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {"更换"}
              </button>
            </div>
          )}

          {selectedArtist && (
            <button
              type="button"
              onClick={() =>
                onStartQuiz(
                  "fan",
                  questionCount,
                  selectedArtist.id,
                  selectedArtist.name
                )
              }
              className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] animate-slide-up"
            >
              {"开始挑战"}
            </button>
          )}
        </div>
      )}

      {/* Random mode: start button */}
      {selectedMode === "random" && (
        <button
          type="button"
          onClick={() => onStartQuiz("random", questionCount)}
          className="rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98] animate-slide-up"
        >
          {"开始挑战"}
        </button>
      )}
    </div>
  );
}
