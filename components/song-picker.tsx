"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  X,
  GripVertical,
  Trash2,
  Music2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickedSong {
  id: number;
  title: string;
  artistName: string;
  artistId: number;
  albumCover: string;
  preview: string;
}

interface SongPickerProps {
  songs: PickedSong[];
  onSongsChange: (songs: PickedSong[]) => void;
}

interface TrackResult {
  id: number;
  title: string;
  artistName: string;
  artistId: number;
  albumCover: string;
  preview: string;
}

export function SongPicker({ songs, onSongsChange }: SongPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (abortRef.current) abortRef.current.abort();

    if (query.trim().length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const res = await fetch(
        `/api/music/search/tracks?q=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (!controller.signal.aborted) {
        setSearchResults(data.data || []);
        setShowResults(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(value);
      }, 350);
    },
    [doSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const addSong = useCallback(
    (track: TrackResult) => {
      // Prevent duplicates
      if (songs.some((s) => s.id === track.id)) return;
      onSongsChange([...songs, track]);
      // Keep search open for adding more
    },
    [songs, onSongsChange]
  );

  const removeSong = useCallback(
    (id: number) => {
      onSongsChange(songs.filter((s) => s.id !== id));
    },
    [songs, onSongsChange]
  );

  const moveSong = useCallback(
    (index: number, direction: "up" | "down") => {
      const newSongs = [...songs];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= newSongs.length) return;
      [newSongs[index], newSongs[target]] = [newSongs[target], newSongs[index]];
      onSongsChange(newSongs);
    },
    [songs, onSongsChange]
  );

  const clearAll = useCallback(() => {
    onSongsChange([]);
  }, [onSongsChange]);

  const alreadyAdded = new Set(songs.map((s) => s.id));

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="搜索歌曲添加到列表..."
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowResults(true);
          }}
          className="w-full rounded-xl border border-input bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-chart-4/60 focus:border-chart-4 transition-all"
        />
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

      {/* Search results */}
      {showResults && searchResults.length > 0 && (
        <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-1.5 max-h-52 overflow-y-auto animate-slide-up">
          {searchResults.map((track) => {
            const isAdded = alreadyAdded.has(track.id);
            return (
              <button
                type="button"
                key={track.id}
                onClick={() => !isAdded && addSong(track)}
                disabled={isAdded}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2 text-left transition-all",
                  isAdded
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:bg-secondary"
                )}
              >
                {track.albumCover ? (
                  <img
                    src={track.albumCover || "/placeholder.svg"}
                    alt={track.title}
                    className="h-9 w-9 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-secondary shrink-0">
                    <Music2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm text-foreground">
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artistName}
                  </p>
                </div>
                {isAdded && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {"已添加"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {showResults &&
        searchQuery.trim().length >= 1 &&
        !isSearching &&
        searchResults.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-2 animate-slide-up">
            {"未找到相关歌曲，请尝试其他关键词"}
          </p>
        )}

      {/* Song list header */}
      {songs.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {"已选择 "}
            <span className="text-foreground font-mono font-semibold">
              {songs.length}
            </span>
            {" 首歌曲"}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-destructive/70 hover:text-destructive transition-colors"
          >
            {"清空列表"}
          </button>
        </div>
      )}

      {/* Selected songs list */}
      {songs.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-1.5 max-h-64 overflow-y-auto">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2 group"
            >
              {/* Order number */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-chart-4/20 text-chart-4">
                {index + 1}
              </span>

              {/* Drag handle / reorder */}
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => moveSong(index, "up")}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  aria-label="上移"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSong(index, "down")}
                  disabled={index === songs.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  aria-label="下移"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Song info */}
              {song.albumCover ? (
                <img
                  src={song.albumCover || "/placeholder.svg"}
                  alt={song.title}
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary shrink-0">
                  <Music2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {song.title}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {song.artistName}
                </p>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeSong(song.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-50 group-hover:opacity-100"
                aria-label="移除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {songs.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <Music2 className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {"搜索并添加歌曲，题目将按选择顺序出题"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {"每道题听歌猜歌手，正确答案按你选的歌曲顺序排列"}
          </p>
        </div>
      )}
    </div>
  );
}
