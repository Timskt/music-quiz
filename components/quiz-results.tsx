"use client";

import React from "react";
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
    if (accuracy >= 90)
      return {
        title: "超级粉丝",
        description: "你对这位歌手的了解简直无人能及！",
        icon: <Flame className="h-8 w-8" />,
        color: "text-primary",
        bgColor: "bg-primary/10",
      };
    if (accuracy >= 70)
      return {
        title: "硬核粉丝",
        description: "太厉害了，你真的很了解这位歌手！",
        icon: <Heart className="h-8 w-8" />,
        color: "text-primary",
        bgColor: "bg-primary/10",
      };
    if (accuracy >= 50)
      return {
        title: "忠实听众",
        description: "不错哦，继续多听一些歌曲吧！",
        icon: <Star className="h-8 w-8" />,
        color: "text-chart-3",
        bgColor: "bg-chart-3/10",
      };
    if (accuracy >= 30)
      return {
        title: "路人听众",
        description: "刚开始入坑，多听听这位歌手的作品吧！",
        icon: <Zap className="h-8 w-8" />,
        color: "text-chart-4",
        bgColor: "bg-chart-4/10",
      };
    return {
      title: "初来乍到",
      description: "是时候去探索这位歌手的音乐世界了！",
      icon: <Star className="h-8 w-8" />,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  }

  // Random mode
  if (accuracy >= 90)
    return {
      title: "音乐百科全书",
      description: "你的音乐知识无人能敌！",
      icon: <Trophy className="h-8 w-8" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    };
  if (accuracy >= 70)
    return {
      title: "音乐达人",
      description: "你有超棒的音乐品味和丰富的知识！",
      icon: <Flame className="h-8 w-8" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    };
  if (accuracy >= 50)
    return {
      title: "音乐爱好者",
      description: "你对音乐有不错的了解，继续加油！",
      icon: <Heart className="h-8 w-8" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    };
  if (accuracy >= 30)
    return {
      title: "随便听听",
      description: "多听不同风格的音乐，你会进步很快！",
      icon: <Star className="h-8 w-8" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    };
  return {
    title: "音乐小白",
    description: "音乐探索之旅从这里开始！",
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
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const level = getFanLevel(accuracy, mode);

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 animate-slide-up">
      {/* Mode badge */}
      {mode === "fan" && artistName && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <span className="text-xs text-primary font-medium">
            {"粉丝专场"}
          </span>
          <span className="text-xs text-foreground font-semibold">
            {artistName}
          </span>
        </div>
      )}
      {mode === "random" && (
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5">
          <span className="text-xs text-accent font-medium">
            {"随机专场"}
          </span>
        </div>
      )}

      {/* Level badge */}
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl p-6 sm:p-8 w-full max-w-xs",
          level.bgColor
        )}
      >
        <div className={cn(level.color)}>{level.icon}</div>
        <h2 className={cn("text-xl sm:text-2xl font-bold", level.color)}>
          {level.title}
        </h2>
        <p className="text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {level.description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-card p-3 sm:p-4 border border-border">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {correctCount}
            <span className="text-base text-muted-foreground">
              /{totalQuestions}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{"答对题数"}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-card p-3 sm:p-4 border border-border">
          <span
            className={cn(
              "text-2xl sm:text-3xl font-bold font-mono",
              accuracy >= 70
                ? "text-accent"
                : accuracy >= 40
                  ? "text-chart-3"
                  : "text-destructive"
            )}
          >
            {accuracy}
            <span className="text-base">%</span>
          </span>
          <span className="text-xs text-muted-foreground">{"准确率"}</span>
        </div>
      </div>

      {/* Accuracy bar */}
      <div className="w-full max-w-xs">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>{"粉丝粘度"}</span>
          <span>{accuracy}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              accuracy >= 70
                ? "bg-accent"
                : accuracy >= 40
                  ? "bg-chart-3"
                  : "bg-destructive"
            )}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onRestart}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          {"再来一局"}
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          {"返回首页"}
        </button>
      </div>
    </div>
  );
}
