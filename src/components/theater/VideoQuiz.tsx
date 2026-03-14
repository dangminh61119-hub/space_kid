"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type VideoQuizQuestion, calculateSkipCost } from "@/lib/services/video-theater-service";

interface VideoQuizProps {
    questions: VideoQuizQuestion[];
    skipCount: number;
    playerCoins: number;
    onPass: () => void;
    onSkip: (cost: number) => void;
}

export default function VideoQuiz({ questions, skipCount, playerCoins, onPass, onSkip }: VideoQuizProps) {
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
    const [showResult, setShowResult] = useState(false);
    const [allCorrect, setAllCorrect] = useState(false);
    const [wrongIndexes, setWrongIndexes] = useState<number[]>([]);

    const skipCost = calculateSkipCost(skipCount);
    const canAffordSkip = playerCoins >= skipCost;

    function selectAnswer(qIndex: number, optIndex: number) {
        if (showResult) return;
        const newAnswers = [...answers];
        newAnswers[qIndex] = optIndex;
        setAnswers(newAnswers);
    }

    function submitAll() {
        const wrong: number[] = [];
        for (let i = 0; i < questions.length; i++) {
            if (answers[i] !== questions[i].correctIndex) {
                wrong.push(i);
            }
        }
        setWrongIndexes(wrong);
        setShowResult(true);
        if (wrong.length === 0) {
            setAllCorrect(true);
            setTimeout(() => onPass(), 1500);
        }
    }

    function retry() {
        setAnswers(new Array(questions.length).fill(-1));
        setShowResult(false);
        setAllCorrect(false);
        setWrongIndexes([]);
        setCurrentQ(0);
    }

    const q = questions[currentQ];
    const allAnswered = answers.every(a => a >= 0);

    return (
        <div className="vq-root">
            <AnimatePresence mode="wait">
                {allCorrect ? (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="vq-success"
                    >
                        <div className="vq-success-icon">🎉</div>
                        <h3>Xuất sắc!</h3>
                        <p>Bạn đã trả lời đúng hết! Tập tiếp theo đã mở khóa!</p>
                    </motion.div>
                ) : showResult ? (
                    <motion.div
                        key="failed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="vq-failed"
                    >
                        <div className="vq-failed-icon">😓</div>
                        <h3>Chưa đúng hết!</h3>
                        <p>Bạn sai {wrongIndexes.length}/{questions.length} câu. Hãy thử lại hoặc đổi coins để bỏ qua.</p>

                        <div className="vq-failed-actions">
                            <button className="vq-btn vq-btn-retry" onClick={retry}>
                                🔄 Thử lại
                            </button>
                            <button
                                className={`vq-btn vq-btn-skip ${!canAffordSkip ? "disabled" : ""}`}
                                onClick={() => canAffordSkip && onSkip(skipCost)}
                                disabled={!canAffordSkip}
                            >
                                🪙 Bỏ qua ({skipCost} coins)
                            </button>
                        </div>
                        {!canAffordSkip && (
                            <p className="vq-not-enough">Không đủ coins! Cần {skipCost} 🪙</p>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key={`q-${currentQ}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="vq-question"
                    >
                        {/* Progress dots */}
                        <div className="vq-dots">
                            {questions.map((_, i) => (
                                <button
                                    key={i}
                                    className={`vq-dot ${i === currentQ ? "active" : ""} ${answers[i] >= 0 ? "answered" : ""}`}
                                    onClick={() => setCurrentQ(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <h3 className="vq-qtext">{q.questionText}</h3>

                        <div className="vq-options">
                            {q.options.map((opt, oi) => (
                                <motion.button
                                    key={oi}
                                    className={`vq-option ${answers[currentQ] === oi ? "selected" : ""}`}
                                    onClick={() => selectAnswer(currentQ, oi)}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <span className="vq-option-letter">
                                        {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className="vq-option-text">{opt}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="vq-nav">
                            {currentQ > 0 && (
                                <button className="vq-btn vq-btn-nav" onClick={() => setCurrentQ(currentQ - 1)}>
                                    ← Trước
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            {currentQ < questions.length - 1 ? (
                                <button
                                    className="vq-btn vq-btn-nav"
                                    onClick={() => setCurrentQ(currentQ + 1)}
                                    disabled={answers[currentQ] < 0}
                                >
                                    Tiếp →
                                </button>
                            ) : (
                                <button
                                    className="vq-btn vq-btn-submit"
                                    onClick={submitAll}
                                    disabled={!allAnswered}
                                >
                                    ✅ Nộp bài
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .vq-root {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(139,92,246,0.15);
                    border-radius: 24px;
                    padding: 28px;
                    backdrop-filter: blur(12px);
                }

                /* Progress dots */
                .vq-dots {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                .vq-dot {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.4);
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: var(--font-heading);
                }
                .vq-dot.active {
                    border-color: #8B5CF6;
                    color: #c084fc;
                    background: rgba(139,92,246,0.15);
                    box-shadow: 0 0 12px rgba(139,92,246,0.3);
                }
                .vq-dot.answered {
                    border-color: rgba(52,211,153,0.4);
                    color: #34D399;
                    background: rgba(52,211,153,0.08);
                }

                /* Question */
                .vq-qtext {
                    font-family: var(--font-heading);
                    font-size: 18px;
                    font-weight: 800;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }

                /* Options */
                .vq-options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 24px;
                }
                .vq-option {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.8);
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.25s;
                    text-align: left;
                    width: 100%;
                }
                .vq-option:hover {
                    background: rgba(139,92,246,0.06);
                    border-color: rgba(139,92,246,0.2);
                }
                .vq-option.selected {
                    background: rgba(139,92,246,0.12);
                    border-color: rgba(139,92,246,0.4);
                    color: #fff;
                    box-shadow: 0 0 16px rgba(139,92,246,0.1);
                }
                .vq-option-letter {
                    width: 30px; height: 30px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.06);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 13px;
                    font-family: var(--font-heading);
                    color: rgba(255,255,255,0.5);
                    flex-shrink: 0;
                }
                .vq-option.selected .vq-option-letter {
                    background: #8B5CF6;
                    color: #fff;
                }
                .vq-option-text {
                    flex: 1;
                    font-weight: 600;
                }

                /* Navigation */
                .vq-nav {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .vq-btn {
                    padding: 12px 24px;
                    border-radius: 14px;
                    border: none;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .vq-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .vq-btn-nav {
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.6);
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .vq-btn-nav:hover:not(:disabled) {
                    background: rgba(139,92,246,0.08);
                    color: #c084fc;
                }
                .vq-btn-submit {
                    background: linear-gradient(135deg, #8B5CF6, #6366F1);
                    color: #fff;
                    box-shadow: 0 4px 16px rgba(139,92,246,0.3);
                }
                .vq-btn-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(139,92,246,0.4);
                }

                /* Success */
                .vq-success {
                    text-align: center;
                    padding: 32px 0;
                }
                .vq-success-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    animation: bounce 1s infinite;
                }
                .vq-success h3 {
                    font-family: var(--font-heading);
                    font-size: 24px;
                    font-weight: 900;
                    color: #34D399;
                    margin-bottom: 8px;
                }
                .vq-success p {
                    color: rgba(255,255,255,0.6);
                    font-size: 14px;
                }

                /* Failed */
                .vq-failed {
                    text-align: center;
                    padding: 24px 0;
                }
                .vq-failed-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .vq-failed h3 {
                    font-family: var(--font-heading);
                    font-size: 20px;
                    font-weight: 900;
                    color: #F59E0B;
                    margin-bottom: 8px;
                }
                .vq-failed p {
                    color: rgba(255,255,255,0.5);
                    font-size: 14px;
                    margin-bottom: 20px;
                }
                .vq-failed-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .vq-btn-retry {
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .vq-btn-retry:hover { background: rgba(255,255,255,0.08); color: #fff; }
                .vq-btn-skip {
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    color: #000;
                    box-shadow: 0 4px 12px rgba(245,158,11,0.3);
                }
                .vq-btn-skip:hover:not(.disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.4); }
                .vq-btn-skip.disabled { opacity: 0.3; cursor: not-allowed; }
                .vq-not-enough {
                    margin-top: 12px;
                    font-size: 12px;
                    color: #EF4444;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
