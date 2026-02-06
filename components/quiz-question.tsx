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

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

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
    <div className="flex flex-col gap-3 sm:gap-4 animate-slide-up">
      {/* Progress bar */}
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs sm:text-sm font-medium text-muted-foreground">
          {"第 "}
          <span className="text-foreground font-mono">{questionNumber}</span>
          {" / "}
          {totalQuestions}
          {" 题"}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Context card */}
      <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 sm:p-4">
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg">
          {isFanMode ? (
            <img
              src={artistImage || "/placeholder.svg"}
              alt={artistName}
              className="h-full w-full object-cover"
            />
          ) : (
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
                  <span className="text-lg sm:text-xl font-bold text-foreground">
                    {"?"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {isFanMode ? (
            <>
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary shrink-0" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {"歌手"}
                </p>
              </div>
              <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                {artistName}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
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
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {"曲目"}
                </p>
              </div>
              <p className="font-semibold text-foreground truncate text-sm sm:text-base">
                {answered ? songTitle : "???"}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
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
        {isFanMode
          ? "请从以下选项中选择正确的歌曲名"
          : "请从以下选项中选择正确的歌手"}
      </p>

      {/* 6 Options - 2 columns on all screens */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((option, idx) => {
          const isCorrect = option === correctAnswer;
          const isSelected = option === selected;
          const label = OPTION_LABELS[idx] || String(idx + 1);

          return (
            <button
              type="button"
              key={`${option}-${idx}`}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 p-2.5 sm:p-3 text-left transition-all",
                !answered &&
                  "border-border bg-card cursor-pointer hover:border-primary/40 hover:bg-secondary/50 active:scale-[0.97]",
                answered && isCorrect && "border-accent bg-accent/10",
                answered &&
                  isSelected &&
                  !isCorrect &&
                  "border-destructive bg-destructive/10",
                answered &&
                  !isCorrect &&
                  !isSelected &&
                  "border-border bg-card opacity-35"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] sm:text-xs font-bold",
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
                {label}
              </span>
              <span
                className={cn(
                  "flex-1 text-xs sm:text-sm font-medium leading-tight",
                  "line-clamp-2 break-all",
                  !answered && "text-foreground",
                  answered && isCorrect && "text-accent",
                  answered &&
                    isSelected &&
                    !isCorrect &&
                    "text-destructive",
                  answered &&
                    !isCorrect &&
                    !isSelected &&
                    "text-muted-foreground"
                )}
              >
                {option}
              </span>
              {answered && isCorrect && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
              )}
              {answered && isSelected && !isCorrect && (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
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
          className="mx-auto rounded-lg bg-primary px-8 py-2.5 sm:py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] animate-slide-up"
        >
          {questionNumber < totalQuestions ? "下一题" : "查看结果"}
        </button>
      )}
    </div>
  );
}
