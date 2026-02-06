"use client";

import { useState, useCallback } from "react";
import { ModeSelector } from "./mode-selector";
import { QuizQuestion } from "./quiz-question";
import { QuizResults } from "./quiz-results";
import { Loader2, Music } from "lucide-react";

interface Question {
  id: number;
  songTitle: string;
  previewUrl: string;
  albumCover: string;
  albumTitle: string;
  correctAnswer: string;
  artistName: string;
  artistImage: string;
  options: string[];
}

type GameState = "menu" | "loading" | "playing" | "results";

export function QuizGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mode, setMode] = useState<"fan" | "random">("random");
  const [artistName, setArtistName] = useState<string>("");
  const [artistId, setArtistId] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const fetchQuiz = useCallback(
    async (quizMode: "fan" | "random", count: number, artId?: number) => {
      const params = new URLSearchParams({
        mode: quizMode,
        count: String(count),
      });
      if (artId) params.set("artistId", String(artId));

      const res = await fetch(`/api/music/quiz?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || "获取题目失败，请重试。");
      }

      let infoMsg: string | null = null;
      if (data.questions.length < count) {
        infoMsg = `该歌手可用歌曲共 ${data.totalAvailable || data.questions.length} 首，本轮出题 ${data.questions.length} 道`;
      }

      return { questions: data.questions as Question[], info: infoMsg };
    },
    []
  );

  const startQuiz = useCallback(
    async (
      quizMode: "fan" | "random",
      count: number,
      artId?: number,
      name?: string
    ) => {
      setGameState("loading");
      setMode(quizMode);
      setArtistName(name || "");
      setArtistId(artId || null);
      setQuestionCount(count);
      setCurrentIndex(0);
      setCorrectCount(0);
      setError(null);
      setInfo(null);

      try {
        const result = await fetchQuiz(quizMode, count, artId);
        setQuestions(result.questions);
        setInfo(result.info);
        setGameState("playing");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "网络错误，请检查网络后重试。"
        );
        setGameState("menu");
      }
    },
    [fetchQuiz]
  );

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) setCorrectCount((c) => c + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setGameState("results");
    }
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(async () => {
    setGameState("loading");
    setCurrentIndex(0);
    setCorrectCount(0);
    setInfo(null);

    try {
      const result = await fetchQuiz(
        mode,
        questionCount,
        artistId || undefined
      );
      setQuestions(result.questions);
      setInfo(result.info);
      setGameState("playing");
    } catch {
      setGameState("menu");
    }
  }, [mode, questionCount, artistId, fetchQuiz]);

  const handleHome = useCallback(() => {
    setGameState("menu");
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setError(null);
    setInfo(null);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-lg">
        {/* Error */}
        {error && gameState === "menu" && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive animate-slide-up">
            {error}
          </div>
        )}

        {/* Info banner during play */}
        {info && gameState === "playing" && currentIndex === 0 && (
          <div className="mb-3 rounded-xl border border-chart-3/30 bg-chart-3/10 p-2.5 text-xs text-chart-3 animate-slide-up">
            {info}
          </div>
        )}

        {gameState === "menu" && <ModeSelector onStartQuiz={startQuiz} />}

        {gameState === "loading" && (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" />
            </div>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{"正在准备题目..."}</span>
              </div>
              <span className="text-xs text-muted-foreground/60">
                {"正在获取歌手完整曲库，请稍候"}
              </span>
            </div>
          </div>
        )}

        {gameState === "playing" && questions[currentIndex] && (
          <QuizQuestion
            key={questions[currentIndex].id}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            songTitle={questions[currentIndex].songTitle}
            previewUrl={questions[currentIndex].previewUrl}
            albumCover={questions[currentIndex].albumCover}
            options={questions[currentIndex].options}
            correctAnswer={questions[currentIndex].correctAnswer}
            mode={mode}
            artistName={questions[currentIndex].artistName}
            artistImage={questions[currentIndex].artistImage}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        )}

        {gameState === "results" && (
          <QuizResults
            correctCount={correctCount}
            totalQuestions={questions.length}
            mode={mode}
            artistName={artistName}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </div>
    </main>
  );
}
