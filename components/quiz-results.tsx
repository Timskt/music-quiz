"use client";

import React from "react"

import { cn } from "@/lib/utils";
import { Trophy, Star, Heart, Flame, Zap, RotateCcw, Home } from "lucide-react";

interface QuizResultsProps {
  correctCount: number;
  totalQuestions: number;
  mode: "fan" | "random";
  artistName?: string;
  onRestart: () => void;
  onHome: () => void;
}

interface FanLevel {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function getFanLevel(accuracy: number, mode: "fan" | "random"): FanLevel {
  if (mode === "fan") {
    if (accuracy >= 90) return {
      title: "Super Fan",
      description: "You know everything about this artist!",
      icon: <Flame className="h-8 w-8" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    };
    if (accuracy >= 70) return {
      title: "Hardcore Fan",
      description: "Impressive! You really know your music.",
      icon: <Heart className="h-8 w-8" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    };
    if (accuracy >= 50) return {
      title: "Casual Listener",
      description: "Not bad, but there's room to grow.",
      icon: <Star className="h-8 w-8" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    };
    if (accuracy >= 30) return {
      title: "Just Started",
      description: "Listen to more songs!",
      icon: <Zap className="h-8 w-8" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    };
    return {
      title: "Newcomer",
      description: "Time to start exploring this artist's music!",
      icon: <Star className="h-8 w-8" />,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  }

  // Random mode levels
  if (accuracy >= 90) return {
    title: "Music Encyclopedia",
    description: "Your music knowledge is unmatched!",
    icon: <Trophy className="h-8 w-8" />,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  };
  if (accuracy >= 70) return {
    title: "Music Expert",
    description: "You have excellent taste and knowledge!",
    icon: <Flame className="h-8 w-8" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
  };
  if (accuracy >= 50) return {
    title: "Music Enthusiast",
    description: "You know your way around the charts.",
    icon: <Heart className="h-8 w-8" />,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  };
  if (accuracy >= 30) return {
    title: "Casual Listener",
    description: "Keep listening and you'll get there!",
    icon: <Star className="h-8 w-8" />,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  };
  return {
    title: "Music Newbie",
    description: "The journey of music discovery begins here!",
    icon: <Star className="h-8 w-8" />,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  };
}

export function QuizResults({
  correctCount,
  totalQuestions,
  mode,
  artistName,
  onRestart,
  onHome,
}: QuizResultsProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const level = getFanLevel(accuracy, mode);

  return (
    <div className="flex flex-col items-center gap-8 animate-slide-up">
      {/* Level badge */}
      <div className={cn("flex flex-col items-center gap-3 rounded-2xl p-8", level.bgColor)}>
        <div className={cn(level.color)}>{level.icon}</div>
        <h2 className={cn("text-2xl font-bold", level.color)}>{level.title}</h2>
        <p className="text-center text-sm text-muted-foreground">{level.description}</p>
      </div>

      {/* Stats */}
      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-card p-4 border border-border">
          <span className="text-3xl font-bold font-mono text-foreground">
            {correctCount}/{totalQuestions}
          </span>
          <span className="text-xs text-muted-foreground">Correct Answers</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-card p-4 border border-border">
          <span className={cn("text-3xl font-bold font-mono", accuracy >= 70 ? "text-accent" : accuracy >= 40 ? "text-chart-3" : "text-destructive")}>
            {accuracy}%
          </span>
          <span className="text-xs text-muted-foreground">Accuracy</span>
        </div>
      </div>

      {/* Mode info */}
      {mode === "fan" && artistName && (
        <p className="text-sm text-muted-foreground">
          {"Fan Session: "}<span className="font-semibold text-foreground">{artistName}</span>
        </p>
      )}

      {/* Accuracy bar */}
      <div className="w-full max-w-sm">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Fan Stickiness</span>
          <span>{accuracy}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              accuracy >= 70 ? "bg-accent" : accuracy >= 40 ? "bg-chart-3" : "bg-destructive"
            )}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </button>
        <button
          onClick={onHome}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-semibold text-foreground transition-all hover:bg-secondary"
        >
          <Home className="h-4 w-4" />
          Home
        </button>
      </div>
    </div>
  );
}
