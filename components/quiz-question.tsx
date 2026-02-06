"use client";

import { useState } from "react";
import { AudioPlayer } from "./audio-player";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Music2, User } from "lucide-react";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  songTitle: string;
  previewUrl: string;
  albumCover: string;
  options: string[];
  correctAnswer: string;
  mode: "fan" | "random";
  artistName: string;
  artistImage: string;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizQuestion({
  questionNumber,
  totalQuestions,
  songTitle,
  previewUrl,
  albumCover,
  options,
  correctAnswer,
  mode,
  artistName,
  artistImage,
  onAnswer,
  onNext,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    onAnswer(option === correctAnswer);
  };

  const isFanMode = mode === "fan";

  return (
    <div className="flex flex-col gap-4 sm:gap-5 animate-slide-up">
      {/* Progress */}
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs sm:text-sm font-medium text-muted-foreground">
          {"第 "}
          <span className="text-foreground font-mono">{questionNumber}</span>
          {" / "}
          {totalQuestions}
          {" 题"}
        </span>
        <div className="flex flex-1 justify-end gap-0.5 overflow-hidden">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                totalQuestions > 10 ? "w-2" : "w-4 sm:w-5",
                i < questionNumber - 1
                  ? "bg-primary"
                  : i === questionNumber - 1
                    ? "bg-accent"
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Context card - shows what we know */}
      <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-card border border-border p-3 sm:p-4">
        {/* Album art / Artist image */}
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg">
          {isFanMode ? (
            // Fan mode: show artist image (we know the artist)
            <img
              src={artistImage || "/placeholder.svg"}
              alt={artistName}
              className="h-full w-full object-cover"
            />
          ) : (
            // Random mode: show blurred album cover
            <>
              <img
                src={albumCover || "/placeholder.svg"}
                alt="Album cover"
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  !answered && "blur-sm scale-110"
                )}
              />
              {!answered && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/60">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {"?"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {isFanMode ? (
            <>
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">{"歌手"}</p>
              </div>
              <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                {artistName}
              </p>
              <p className="text-xs text-muted-foreground">
                {answered ? (
                  <>
                    <Music2 className="inline h-3 w-3 mr-1" />
                    {songTitle}
                  </>
                ) : (
                  "听旋律，猜这是哪首歌"
                )}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Music2 className="h-3 w-3 text-accent shrink-0" />
                <p className="text-xs text-muted-foreground">{"曲目"}</p>
              </div>
              <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                {answered ? songTitle : "???"}
              </p>
              <p className="text-xs text-muted-foreground">
                {answered ? `歌手: ${artistName}` : "听旋律，猜这是谁唱的"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Audio player */}
      <AudioPlayer src={previewUrl} autoPlay />

      {/* Prompt */}
      <p className="text-center text-xs text-muted-foreground">
        {isFanMode ? "请选择正确的歌曲名" : "请选择正确的歌手"}
      </p>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {options.map((option, idx) => {
          const isCorrect = option === correctAnswer;
          const isSelected = option === selected;
          const labels = ["A", "B", "C", "D"];

          return (
            <button
              type="button"
              key={option}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-3 sm:p-4 text-left transition-all",
                !answered &&
                  "border-border bg-card cursor-pointer hover:border-primary/40 hover:bg-secondary/50 active:scale-[0.98]",
                answered &&
                  isCorrect &&
                  "border-accent bg-accent/10",
                answered &&
                  isSelected &&
                  !isCorrect &&
                  "border-destructive bg-destructive/10",
                answered &&
                  !isCorrect &&
                  !isSelected &&
                  "border-border bg-card opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  !answered && "bg-secondary text-muted-foreground",
                  answered && isCorrect && "bg-accent/20 text-accent",
                  answered &&
                    isSelected &&
                    !isCorrect &&
                    "bg-destructive/20 text-destructive",
                  answered &&
                    !isCorrect &&
                    !isSelected &&
                    "bg-secondary text-muted-foreground"
                )}
              >
                {labels[idx]}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium truncate",
                  !answered && "text-foreground",
                  answered && isCorrect && "text-accent",
                  answered && isSelected && !isCorrect && "text-destructive",
                  answered && !isCorrect && !isSelected && "text-muted-foreground"
                )}
              >
                {option}
              </span>
              {answered && isCorrect && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
              )}
              {answered && isSelected && !isCorrect && (
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      {answered && (
        <button
          type="button"
          onClick={onNext}
          className="mx-auto rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] animate-slide-up"
        >
          {questionNumber < totalQuestions ? "下一题" : "查看结果"}
        </button>
      )}
    </div>
  );
}
