"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
export interface FlashcardItem {
    id: string;
    front: string;       // Question or term
    back: string;        // Answer or definition
    subject: string;
    hint?: string;
    emoji?: string;
}

interface FlashcardProps {
    cards: FlashcardItem[];
    onComplete: (results: { correct: number; incorrect: number; skipped: number }) => void;
    onExit: () => void;
}

/* ─── Component ─── */
export default function Flashcard({ cards, onComplete, onExit }: FlashcardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [results, setResults] = useState({ correct: 0, incorrect: 0, skipped: 0 });
    const [exitAnimation, setExitAnimation] = useState<"left" | "right" | null>(null);

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;
    const isFinished = currentIndex >= cards.length;

    const handleNext = useCallback((result: "correct" | "incorrect" | "skipped") => {
        setResults(prev => ({ ...prev, [result]: prev[result] + 1 }));
        setExitAnimation(result === "correct" ? "right" : "left");

        setTimeout(() => {
            setIsFlipped(false);
            setExitAnimation(null);
            if (currentIndex + 1 >= cards.length) {
                const finalResults = {
                    ...results,
                    [result]: results[result] + 1,
                };
                onComplete(finalResults);
            } else {
                setCurrentIndex(prev => prev + 1);
            }
        }, 300);
    }, [currentIndex, cards.length, results, onComplete]);

    if (isFinished) {
        return (
            <motion.div
                className="flashcard-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 className="learn-card-title">Hoàn thành!</h2>
                <div className="flashcard-results">
                    <div className="flashcard-result-item">
                        <span className="flashcard-result-emoji">✅</span>
                        <span className="flashcard-result-count">{results.correct}</span>
                        <span className="flashcard-result-label">Đúng</span>
                    </div>
                    <div className="flashcard-result-item">
                        <span className="flashcard-result-emoji">❌</span>
                        <span className="flashcard-result-count">{results.incorrect}</span>
                        <span className="flashcard-result-label">Sai</span>
                    </div>
                    <div className="flashcard-result-item">
                        <span className="flashcard-result-emoji">⏭️</span>
                        <span className="flashcard-result-count">{results.skipped}</span>
                        <span className="flashcard-result-label">Bỏ qua</span>
                    </div>
                </div>
                <button className="learn-btn learn-btn-primary" onClick={onExit} style={{ marginTop: 20 }}>
                    Quay lại
                </button>
            </motion.div>
        );
    }

    return (
        <div className="flashcard-container">
            {/* Progress Bar */}
            <div className="flashcard-progress-bar">
                <motion.div
                    className="flashcard-progress-fill"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <div className="flashcard-counter">
                {currentIndex + 1} / {cards.length}
            </div>

            {/* Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    className="flashcard-card-wrapper"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{
                        opacity: exitAnimation ? 0 : 1,
                        x: exitAnimation === "right" ? 200 : exitAnimation === "left" ? -200 : 0,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Front */}
                        <div className="flashcard-face flashcard-front">
                            {currentCard.emoji && (
                                <div style={{ fontSize: 40, marginBottom: 12 }}>{currentCard.emoji}</div>
                            )}
                            <p className="flashcard-text">{currentCard.front}</p>
                            <span className="flashcard-tap-hint">Chạm để lật thẻ 👆</span>
                        </div>

                        {/* Back */}
                        <div className="flashcard-face flashcard-back">
                            <p className="flashcard-text flashcard-answer">{currentCard.back}</p>
                            {currentCard.hint && (
                                <p className="flashcard-hint">💡 {currentCard.hint}</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flashcard-actions">
                <button
                    className="flashcard-action-btn flashcard-btn-wrong"
                    onClick={() => handleNext("incorrect")}
                >
                    <span>❌</span> Chưa biết
                </button>
                <button
                    className="flashcard-action-btn flashcard-btn-skip"
                    onClick={() => handleNext("skipped")}
                >
                    <span>⏭️</span> Bỏ qua
                </button>
                <button
                    className="flashcard-action-btn flashcard-btn-correct"
                    onClick={() => handleNext("correct")}
                >
                    <span>✅</span> Biết rồi
                </button>
            </div>

            <style jsx>{`
        .flashcard-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .flashcard-progress-bar {
          height: 6px;
          background: var(--learn-border);
          border-radius: 3px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .flashcard-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--learn-accent), var(--learn-success));
          border-radius: 3px;
        }
        .flashcard-counter {
          text-align: center;
          font-size: 13px;
          color: var(--learn-text-secondary);
          font-weight: 600;
          margin-bottom: 20px;
        }

        .flashcard-card-wrapper {
          perspective: 1000px;
          margin-bottom: 24px;
        }

        .flashcard-card {
          position: relative;
          width: 100%;
          min-height: 280px;
          cursor: pointer;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 20px;
        }
        .flashcard-card.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          border-radius: 20px;
          text-align: center;
        }

        .flashcard-front {
          background: linear-gradient(135deg, #FFFFFF, #F0F2FF);
          border: 2px solid var(--learn-border);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.08);
        }

        .flashcard-back {
          background: linear-gradient(135deg, var(--learn-accent), #4F46E5);
          color: white;
          transform: rotateY(180deg);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
        }

        .flashcard-text {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 700;
          line-height: 1.4;
        }
        .flashcard-answer { color: white; }

        .flashcard-tap-hint {
          position: absolute;
          bottom: 16px;
          font-size: 12px;
          color: var(--learn-text-secondary);
          opacity: 0.7;
        }

        .flashcard-hint {
          font-size: 14px;
          margin-top: 12px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .flashcard-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .flashcard-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 20px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-heading);
        }
        .flashcard-action-btn:hover { transform: translateY(-2px); }

        .flashcard-btn-wrong {
          background: var(--learn-error-bg);
          color: #991B1B;
          border-color: var(--learn-error);
        }
        .flashcard-btn-skip {
          background: var(--learn-warning-bg);
          color: #92400E;
          border-color: var(--learn-warning);
        }
        .flashcard-btn-correct {
          background: var(--learn-success-bg);
          color: #065F46;
          border-color: var(--learn-success);
        }

        .flashcard-complete {
          text-align: center;
          padding: 40px 20px;
        }
        .flashcard-results {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 20px;
        }
        .flashcard-result-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .flashcard-result-emoji { font-size: 28px; }
        .flashcard-result-count {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 800;
          color: var(--learn-text);
        }
        .flashcard-result-label {
          font-size: 12px;
          color: var(--learn-text-secondary);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .flashcard-card { min-height: 240px; }
          .flashcard-text { font-size: 18px; }
          .flashcard-action-btn { padding: 10px 14px; font-size: 13px; }
        }
      `}</style>
        </div>
    );
}
