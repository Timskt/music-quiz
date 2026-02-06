"use client";

import { useState } from "react";
import { AudioPlayer } from "./audio-player";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  songTitle: string;
  previewUrl: string;
  albumCover: string;
  options: string[];
  correctArtist: string;
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
  correctArtist,
  onAnswer,
  onNext,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    onAnswer(option === correctArtist);
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {"第 "}{questionNumber}{" / "}{totalQuestions}{" 题"}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
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

      {/* Song info */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <img
            src={albumCover || "/placeholder.svg"}
            alt="Album cover"
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              !answered && "blur-sm scale-110"
            )}
          />
          {!answered && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/60 text-foreground">
              <span className="text-2xl font-bold">?</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-foreground text-balance">
            {answered ? songTitle : "???"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {answered ? "Answer revealed!" : "Listen and guess the artist"}
          </p>
        </div>
      </div>

      {/* Audio player */}
      <AudioPlayer src={previewUrl} autoPlay />

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrect = option === correctArtist;
          const isSelected = option === selected;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-secondary/50",
                !answered && "border-border bg-card cursor-pointer",
                answered && isCorrect && "border-accent bg-accent/10",
                answered && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                answered && !isCorrect && !isSelected && "border-border bg-card opacity-50"
              )}
            >
              <div className="flex-1">
                <span
                  className={cn(
                    "font-medium",
                    answered && isCorrect && "text-accent",
                    answered && isSelected && !isCorrect && "text-destructive"
                  )}
                >
                  {option}
                </span>
              </div>
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
          onClick={onNext}
          className="mx-auto rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 animate-slide-up"
        >
          {questionNumber < totalQuestions ? "Next" : "See Results"}
        </button>
      )}
    </div>
  );
}
