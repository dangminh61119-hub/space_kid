"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
export interface QuizQuestion {
    id: string;
    question: string;
    correctAnswer: string;
    wrongAnswers: string[];  // 3 wrong answers
    subject: string;
    bloomLevel?: number;
    explanation?: string;
    skillTag?: string;
}

interface SmartQuizProps {
    questions: QuizQuestion[];
    timePerQuestion?: number; // seconds, 0 = no timer
    onComplete: (results: {
        correct: number;
        incorrect: number;
        answers: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean; timeMs: number }>;
    }) => void;
    onExit: () => void;
}

/* ─── Helpers ─── */
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/* ─── Component ─── */
export default function SmartQuiz({ questions, timePerQuestion = 0, onComplete, onExit }: SmartQuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean; timeMs: number }>>([]);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(timePerQuestion);
    const startTimeRef = useRef(Date.now());
    const [streak, setStreak] = useState(0);

    const currentQ = questions[currentIndex];
    const progress = (currentIndex / questions.length) * 100;
    const isFinished = currentIndex >= questions.length;
    const correctCount = answers.filter(a => a.isCorrect).length;

    // Shuffle options when question changes
    useEffect(() => {
        if (currentQ) {
            setShuffledOptions(shuffleArray([currentQ.correctAnswer, ...currentQ.wrongAnswers]));
            startTimeRef.current = Date.now();
            setTimeLeft(timePerQuestion);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    }, [currentIndex, currentQ, timePerQuestion]);

    // Timer
    useEffect(() => {
        if (timePerQuestion <= 0 || showResult || isFinished) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleAnswer("__timeout__");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, showResult, timePerQuestion, isFinished]);

    const handleAnswer = useCallback((answer: string) => {
        if (showResult) return;

        const timeMs = Date.now() - startTimeRef.current;
        const isCorrect = answer === currentQ.correctAnswer;

        setSelectedAnswer(answer);
        setShowResult(true);
        setStreak(prev => isCorrect ? prev + 1 : 0);

        setAnswers(prev => [...prev, {
            questionId: currentQ.id,
            selectedAnswer: answer,
            isCorrect,
            timeMs,
        }]);
    }, [showResult, currentQ]);

    const handleNext = useCallback(() => {
        if (currentIndex + 1 >= questions.length) {
            onComplete({
                correct: answers.filter(a => a.isCorrect).length + (selectedAnswer === currentQ?.correctAnswer ? 1 : 0),
                incorrect: answers.filter(a => !a.isCorrect).length + (selectedAnswer !== currentQ?.correctAnswer ? 1 : 0),
                answers: [...answers],
            });
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, questions.length, answers, onComplete, selectedAnswer, currentQ]);

    if (isFinished) {
        const totalCorrect = answers.filter(a => a.isCorrect).length;
        const accuracy = Math.round((totalCorrect / questions.length) * 100);

        return (
            <motion.div
                className="quiz-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div style={{ fontSize: 64, marginBottom: 12 }}>
                    {accuracy >= 80 ? "🌟" : accuracy >= 50 ? "👍" : "💪"}
                </div>
                <h2 className="learn-card-title">Kết quả Quiz</h2>
                <div className="quiz-score-circle">
                    <span className="quiz-score-value">{accuracy}%</span>
                    <span className="quiz-score-label">Chính xác</span>
                </div>
                <div className="quiz-results-row">
                    <div className="quiz-result-item">
                        <span>✅</span> {totalCorrect} đúng
                    </div>
                    <div className="quiz-result-item">
                        <span>❌</span> {questions.length - totalCorrect} sai
                    </div>
                </div>
                {accuracy < 60 && (
                    <p style={{ fontSize: 14, color: "var(--learn-text-secondary)", marginTop: 12 }}>
                        🦉 Cú Mèo tin bạn sẽ làm tốt hơn lần sau!
                    </p>
                )}
                <button className="learn-btn learn-btn-primary" onClick={onExit} style={{ marginTop: 20 }}>
                    Quay lại
                </button>
            </motion.div>
        );
    }

    return (
        <div className="quiz-container">
            {/* Progress & Timer */}
            <div className="quiz-header">
                <div className="quiz-progress-bar">
                    <motion.div
                        className="quiz-progress-fill"
                        animate={{ width: `${progress}%` }}
                    />
                </div>
                <div className="quiz-header-info">
                    <span className="quiz-counter">{currentIndex + 1} / {questions.length}</span>
                    {streak >= 3 && (
                        <motion.span
                            className="quiz-streak"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            🔥 {streak} streak!
                        </motion.span>
                    )}
                    {timePerQuestion > 0 && (
                        <span className={`quiz-timer ${timeLeft <= 5 ? "quiz-timer-urgent" : ""}`}>
                            ⏱️ {timeLeft}s
                        </span>
                    )}
                    <span className="quiz-score-mini">✅ {correctCount}</span>
                </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    className="learn-card quiz-question-card"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                >
                    {currentQ.bloomLevel && (
                        <div className="quiz-bloom-badge">
                            Bloom {currentQ.bloomLevel}
                        </div>
                    )}
                    <h2 className="quiz-question-text">{currentQ.question}</h2>
                </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div className="quiz-options">
                {shuffledOptions.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectAnswer = option === currentQ.correctAnswer;
                    let optionClass = "quiz-option";

                    if (showResult) {
                        if (isCorrectAnswer) optionClass += " quiz-option-correct";
                        else if (isSelected && !isCorrectAnswer) optionClass += " quiz-option-wrong";
                        else optionClass += " quiz-option-dimmed";
                    }

                    return (
                        <motion.button
                            key={`${currentIndex}-${idx}`}
                            className={optionClass}
                            onClick={() => handleAnswer(option)}
                            disabled={showResult}
                            whileHover={!showResult ? { scale: 1.02 } : {}}
                            whileTap={!showResult ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <span className="quiz-option-letter">
                                {["A", "B", "C", "D"][idx]}
                            </span>
                            <span className="quiz-option-text">{option}</span>
                            {showResult && isCorrectAnswer && <span className="quiz-option-icon">✅</span>}
                            {showResult && isSelected && !isCorrectAnswer && <span className="quiz-option-icon">❌</span>}
                        </motion.button>
                    );
                })}
            </div>

            {/* Explanation + Next */}
            {showResult && (
                <motion.div
                    className="quiz-explanation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {selectedAnswer === currentQ.correctAnswer ? (
                        <p className="quiz-feedback-correct">🎉 Chính xác! Giỏi lắm!</p>
                    ) : (
                        <p className="quiz-feedback-wrong">
                            😊 Đáp án đúng là: <strong>{currentQ.correctAnswer}</strong>
                        </p>
                    )}
                    {currentQ.explanation && (
                        <p className="quiz-explanation-text">💡 {currentQ.explanation}</p>
                    )}
                    <button className="learn-btn learn-btn-primary" onClick={handleNext} style={{ marginTop: 12 }}>
                        {currentIndex + 1 < questions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                    </button>
                </motion.div>
            )}

            <style jsx>{`
        .quiz-container { max-width: 600px; margin: 0 auto; }

        .quiz-header { margin-bottom: 20px; }
        .quiz-progress-bar {
          height: 6px; background: var(--learn-border); border-radius: 3px;
          margin-bottom: 10px; overflow: hidden;
        }
        .quiz-progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--learn-accent), var(--learn-success));
          border-radius: 3px;
        }
        .quiz-header-info {
          display: flex; align-items: center; gap: 12px; font-size: 13px;
          color: var(--learn-text-secondary); font-weight: 600;
        }
        .quiz-counter { flex: 1; }
        .quiz-streak { color: var(--learn-streak); }
        .quiz-timer { color: var(--learn-accent); }
        .quiz-timer-urgent { color: var(--learn-error); animation: pulse 0.5s ease infinite; }
        .quiz-score-mini { color: var(--learn-success); }

        .quiz-question-card { padding: 28px 24px; margin-bottom: 16px; text-align: center; }
        .quiz-bloom-badge {
          display: inline-block; padding: 3px 10px; border-radius: 99px;
          background: var(--learn-accent-light); color: var(--learn-accent);
          font-size: 11px; font-weight: 700; margin-bottom: 12px;
        }
        .quiz-question-text {
          font-family: var(--font-heading); font-size: 20px; font-weight: 700;
          color: var(--learn-text); line-height: 1.4;
        }

        .quiz-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }

        .quiz-option {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-radius: 14px;
          background: var(--learn-card); border: 2px solid var(--learn-border);
          cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
          font-size: 15px; font-weight: 600; color: var(--learn-text);
        }
        .quiz-option:hover:not(:disabled) { border-color: var(--learn-accent-light); background: var(--learn-card-hover); }

        .quiz-option-correct { border-color: var(--learn-success) !important; background: var(--learn-success-bg) !important; }
        .quiz-option-wrong { border-color: var(--learn-error) !important; background: var(--learn-error-bg) !important; }
        .quiz-option-dimmed { opacity: 0.5; }

        .quiz-option-letter {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--learn-bg-alt); display: flex; align-items: center;
          justify-content: center; font-weight: 800; font-size: 14px;
          color: var(--learn-accent); flex-shrink: 0;
        }
        .quiz-option-text { flex: 1; }
        .quiz-option-icon { font-size: 18px; }

        .quiz-explanation {
          background: var(--learn-card); border: 1px solid var(--learn-border);
          border-radius: 16px; padding: 16px 20px; text-align: center;
        }
        .quiz-feedback-correct { font-weight: 700; font-size: 16px; color: #065F46; }
        .quiz-feedback-wrong { font-weight: 600; font-size: 15px; color: #991B1B; }
        .quiz-explanation-text {
          font-size: 13px; color: var(--learn-text-secondary); margin-top: 8px; line-height: 1.5;
        }

        .quiz-complete { text-align: center; padding: 40px 20px; }
        .quiz-score-circle {
          width: 120px; height: 120px; border-radius: 50%;
          background: linear-gradient(135deg, var(--learn-accent), #4F46E5);
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; margin: 20px auto;
          box-shadow: 0 8px 24px rgba(99,102,241,0.25);
        }
        .quiz-score-value { font-family: var(--font-heading); font-size: 32px; font-weight: 800; color: white; }
        .quiz-score-label { font-size: 12px; color: rgba(255,255,255,0.8); font-weight: 600; }
        .quiz-results-row { display: flex; gap: 24px; justify-content: center; margin-top: 16px; }
        .quiz-result-item { font-weight: 700; font-size: 15px; display: flex; gap: 6px; align-items: center; }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        @media (max-width: 768px) {
          .quiz-question-text { font-size: 17px; }
          .quiz-option { padding: 12px 14px; font-size: 14px; }
        }
      `}</style>
        </div>
    );
}
