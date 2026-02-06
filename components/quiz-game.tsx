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
  correctArtist: string;
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
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(
    async (quizMode: "fan" | "random", artistId?: number, name?: string) => {
      setGameState("loading");
      setMode(quizMode);
      setArtistName(name || "");
      setCurrentIndex(0);
      setCorrectCount(0);
      setError(null);

      try {
        const params = new URLSearchParams({ mode: quizMode });
        if (artistId) params.set("artistId", String(artistId));

        const res = await fetch(`/api/music/quiz?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.questions || data.questions.length === 0) {
          setError(data.error || "No songs found. Please try again.");
          setGameState("menu");
          return;
        }

        setQuestions(data.questions);
        setGameState("playing");
      } catch {
        setError("Network error. Please check your connection and try again.");
        setGameState("menu");
      }
    },
    []
  );

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setGameState("results");
    }
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setGameState("loading");
    // Re-fetch questions
    const params = new URLSearchParams({ mode });
    if (mode === "fan" && questions[0]) {
      // We need to refetch, but we don't have artistId stored separately
      // So go back to menu for fan mode
      setGameState("menu");
      return;
    }
    fetch(`/api/music/quiz?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setGameState("playing");
        } else {
          setGameState("menu");
        }
      })
      .catch(() => setGameState("menu"));
  }, [mode, questions]);

  const handleHome = useCallback(() => {
    setGameState("menu");
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setError(null);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-slide-up">
            {error}
          </div>
        )}

        {/* Menu */}
        {gameState === "menu" && <ModeSelector onStartQuiz={startQuiz} />}

        {/* Loading */}
        {gameState === "loading" && (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading songs...</span>
            </div>
          </div>
        )}

        {/* Playing */}
        {gameState === "playing" && questions[currentIndex] && (
          <QuizQuestion
            key={questions[currentIndex].id}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            songTitle={questions[currentIndex].songTitle}
            previewUrl={questions[currentIndex].previewUrl}
            albumCover={questions[currentIndex].albumCover}
            options={questions[currentIndex].options}
            correctArtist={questions[currentIndex].correctArtist}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        )}

        {/* Results */}
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
