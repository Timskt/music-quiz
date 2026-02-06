"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Shuffle, Search, Loader2, Minus, Plus, X } from "lucide-react";
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

  // Debounce timer and abort controller refs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const doSearch = useCallback(async (query: string) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (!controller.signal.aborted) {
        setSearchResults(data.data || []);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }
      if (!controller.signal.aborted) {
        setSearchResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      // If artist is selected, clear it when user types again
      if (selectedArtist) {
        setSelectedArtist(null);
      }

      // Debounce 350ms
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(value);
      }, 350);
    },
    [doSearch, selectedArtist]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedArtist(null);
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const adjustCount = (delta: number) => {
    setQuestionCount((c) => Math.min(20, Math.max(5, c + delta)));
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
          {"听歌猜猜猜"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
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
            "group flex flex-col items-center gap-2.5 sm:gap-3 rounded-xl border-2 p-3.5 sm:p-6 text-center transition-all cursor-pointer",
            selectedMode === "fan"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors",
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
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {"选择歌手，听歌猜歌名"}
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
            "group flex flex-col items-center gap-2.5 sm:gap-3 rounded-xl border-2 p-3.5 sm:p-6 text-center transition-all cursor-pointer",
            selectedMode === "random"
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-accent/30"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors",
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
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {"随机热门歌曲，听歌猜歌手"}
            </p>
          </div>
        </button>
      </div>

      {/* Question count */}
      {selectedMode && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 animate-slide-up">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="输入歌手名称搜索..."
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all"
            />
            {/* Clear / spinner icon */}
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="清除搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && !selectedArtist && (
            <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-1.5 max-h-60 overflow-y-auto animate-slide-up">
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

          {/* No results hint */}
          {searchQuery.trim().length >= 1 &&
            !isSearching &&
            searchResults.length === 0 &&
            !selectedArtist && (
              <p className="text-center text-xs text-muted-foreground py-2 animate-slide-up">
                {"未找到相关歌手，请尝试其他关键词"}
              </p>
            )}

          {/* Selected artist card */}
          {selectedArtist && (
            <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-slide-up">
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
                onClick={clearSearch}
                className="shrink-0 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
              className="rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] animate-slide-up"
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
          className="rounded-xl bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98] animate-slide-up"
        >
          {"开始挑战"}
        </button>
      )}
    </div>
  );
}
