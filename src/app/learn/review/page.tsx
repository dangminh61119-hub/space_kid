"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import {
    getSRSDeck, getDueCards, reviewCard, getSRSStats, getReviewForecast, getGradeDeck,
    type SRSCard, type RecallQuality,
} from "@/lib/services/srs-service";

/* ─── Quality buttons config ─── */
const QUALITY_OPTIONS: Array<{ quality: RecallQuality; label: string; emoji: string; color: string; bg: string }> = [
    { quality: "again", label: "Lại", emoji: "🔁", color: "#991B1B", bg: "var(--learn-error-bg)" },
    { quality: "hard", label: "Khó", emoji: "😰", color: "#92400E", bg: "var(--learn-warning-bg)" },
    { quality: "good", label: "Tốt", emoji: "👍", color: "#065F46", bg: "var(--learn-success-bg)" },
    { quality: "easy", label: "Dễ!", emoji: "⚡", color: "#312E81", bg: "#EEF2FF" },
];

export default function LearnReviewPage() {
    const { player } = useGame();
    const [deck, setDeck] = useState<SRSCard[]>([]);
    const [dueCards, setDueCards] = useState<SRSCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [sessionResults, setSessionResults] = useState<Array<{ cardId: string; quality: RecallQuality }>>([]);
    const [sessionComplete, setSessionComplete] = useState(false);

    useEffect(() => {
        const d = getGradeDeck(player.grade);
        setDeck(d);
        setDueCards(getDueCards(d, player.grade));
    }, [player.grade]);

    const stats = useMemo(() => getSRSStats(deck), [deck]);
    const forecast = useMemo(() => getReviewForecast(deck), [deck]);
    const currentCard = dueCards[currentIndex];

    const handleReview = useCallback((quality: RecallQuality) => {
        if (!currentCard) return;

        const updatedDeck = reviewCard(currentCard.id, quality);
        setDeck(updatedDeck);
        setSessionResults(prev => [...prev, { cardId: currentCard.id, quality }]);
        setIsFlipped(false);

        if (currentIndex + 1 >= dueCards.length) {
            setSessionComplete(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentCard, currentIndex, dueCards.length]);

    const startReview = useCallback(() => {
        setReviewing(true);
        setCurrentIndex(0);
        setSessionResults([]);
        setSessionComplete(false);
        setIsFlipped(false);
    }, []);

    const resetSession = useCallback(() => {
        const d = getGradeDeck(player.grade);
        setDeck(d);
        setDueCards(getDueCards(d, player.grade));
        setReviewing(false);
        setSessionComplete(false);
        setCurrentIndex(0);
        setSessionResults([]);
    }, [player.grade]);

    // ─── Session Complete ───
    if (sessionComplete) {
        const correctCount = sessionResults.filter(r => r.quality === "good" || r.quality === "easy").length;
        const accuracy = Math.round((correctCount / sessionResults.length) * 100);

        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>
                    {accuracy >= 80 ? "🌟" : accuracy >= 50 ? "👍" : "💪"}
                </div>
                <h2 className="learn-card-title">Ôn tập xong!</h2>
                <p style={{ color: "var(--learn-text-secondary)", marginBottom: 20 }}>
                    {player.name} đã ôn {sessionResults.length} thẻ
                </p>

                <div className="learn-card" style={{ display: "inline-flex", gap: 24, padding: "16px 32px", marginBottom: 20 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-success)" }}>{correctCount}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Tốt/Dễ</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-warning)" }}>{sessionResults.filter(r => r.quality === "hard").length}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Khó</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-error)" }}>{sessionResults.filter(r => r.quality === "again").length}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Lại</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="learn-btn learn-btn-primary" onClick={resetSession}>Quay lại</button>
                </div>
            </motion.div>
        );
    }

    // ─── Active Review ───
    if (reviewing && currentCard) {
        const progress = (currentIndex / dueCards.length) * 100;

        return (
            <div className="review-session">
                {/* Progress */}
                <div className="review-progress-bar">
                    <motion.div className="review-progress-fill" animate={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 13, color: "var(--learn-text-secondary)", fontWeight: 600 }}>
                    <span>{currentIndex + 1} / {dueCards.length}</span>
                    <span>✅ {sessionResults.filter(r => r.quality !== "again").length}</span>
                </div>

                {/* Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                    >
                        <div
                            className={`review-card ${isFlipped ? "flipped" : ""}`}
                            onClick={() => setIsFlipped(true)}
                        >
                            <div className="review-face review-front">
                                {currentCard.emoji && <span style={{ fontSize: 36, marginBottom: 8 }}>{currentCard.emoji}</span>}
                                <p className="review-card-text">{currentCard.front}</p>
                                {!isFlipped && <span className="review-tap">Chạm để xem đáp án 👆</span>}
                            </div>
                            <div className="review-face review-back">
                                <p className="review-card-text review-answer">{currentCard.back}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Quality buttons - show after flip */}
                {isFlipped && (
                    <motion.div
                        className="review-quality-row"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", textAlign: "center", marginBottom: 10, fontWeight: 600 }}>
                            Bạn nhớ tốt không?
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                            {QUALITY_OPTIONS.map(opt => (
                                <motion.button
                                    key={opt.quality}
                                    className="review-quality-btn"
                                    style={{ background: opt.bg, color: opt.color }}
                                    onClick={() => handleReview(opt.quality)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span>{opt.emoji}</span>
                                    <span>{opt.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <style jsx>{`
          .review-session { max-width: 500px; margin: 0 auto; }
          .review-progress-bar { height: 6px; background: var(--learn-border); border-radius: 3px; margin-bottom: 8px; overflow: hidden; }
          .review-progress-fill { height: 100%; background: linear-gradient(90deg, var(--learn-accent), var(--learn-success)); border-radius: 3px; }

          .review-card {
            position: relative; width: 100%; min-height: 260px; cursor: pointer;
            transform-style: preserve-3d; transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
            border-radius: 20px; margin-bottom: 20px;
          }
          .review-card.flipped { transform: rotateY(180deg); }

          .review-face {
            position: absolute; inset: 0; backface-visibility: hidden;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 32px 24px; border-radius: 20px; text-align: center;
          }
          .review-front {
            background: linear-gradient(135deg, #FFFFFF, #F0F2FF);
            border: 2px solid var(--learn-border);
            box-shadow: 0 8px 32px rgba(99,102,241,0.08);
          }
          .review-back {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white; transform: rotateY(180deg);
            box-shadow: 0 8px 32px rgba(16,185,129,0.2);
          }
          .review-card-text { font-family: var(--font-heading); font-size: 22px; font-weight: 700; line-height: 1.4; }
          .review-answer { color: white; }
          .review-tap { position: absolute; bottom: 16px; font-size: 12px; color: var(--learn-text-secondary); opacity: 0.7; }

          .review-quality-row { margin-top: 4px; }
          .review-quality-btn {
            flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
            padding: 10px 8px; border-radius: 12px; border: none;
            cursor: pointer; font-weight: 700; font-size: 12px;
            font-family: var(--font-heading); transition: all 0.2s;
          }

          @media (max-width: 768px) {
            .review-card { min-height: 220px; }
            .review-card-text { font-size: 18px; }
          }
        `}</style>
            </div>
        );
    }

    // ─── Dashboard View ───
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="learn-page-title">🔄 Ôn Tập</h1>
            <p className="learn-page-subtitle">Spaced Repetition — nhớ lâu hơn, học ít hơn</p>

            {/* Stats */}
            <div className="learn-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, textAlign: "center" }}>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: dueCards.length > 0 ? "var(--learn-error)" : "var(--learn-success)" }}>
                            {dueCards.length}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Cần ôn</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-accent)" }}>{stats.total}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Tổng thẻ</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-text)" }}>{stats.learned}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Đã học</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--learn-success)" }}>{stats.mastered}⭐</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--learn-text-secondary)" }}>Thành thạo</div>
                    </div>
                </div>
            </div>

            {/* Start Review CTA */}
            {dueCards.length > 0 ? (
                <motion.div className="learn-card" style={{ textAlign: "center", padding: 24, marginBottom: 16 }} whileHover={{ scale: 1.01 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🦉</div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                        Có {dueCards.length} thẻ cần ôn hôm nay!
                    </p>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 16 }}>
                        Ôn tập đúng lúc giúp nhớ lâu gấp 3 lần
                    </p>
                    <button className="learn-btn learn-btn-primary" onClick={startReview} style={{ fontSize: 16, padding: "14px 32px" }}>
                        🚀 Bắt đầu ôn tập
                    </button>
                </motion.div>
            ) : (
                <div className="learn-card" style={{ textAlign: "center", padding: 24, marginBottom: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Tuyệt vời!</p>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>
                        {player.name} đã ôn xong tất cả. Quay lại sau nhé! 🌟
                    </p>
                </div>
            )}

            {/* 7-day forecast */}
            <div className="learn-card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📅 Lịch ôn 7 ngày tới</h3>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
                    {forecast.map((day, i) => {
                        const maxCount = Math.max(...forecast.map(d => d.count), 1);
                        const height = Math.max(8, (day.count / maxCount) * 60);
                        return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: day.count > 0 ? "var(--learn-accent)" : "var(--learn-text-secondary)" }}>
                                    {day.count}
                                </span>
                                <div style={{
                                    width: "100%", height, borderRadius: 6,
                                    background: i === 0 ? "var(--learn-accent)" : day.count > 0 ? "var(--learn-accent-light)" : "var(--learn-border)",
                                    transition: "height 0.3s",
                                }} />
                                <span style={{ fontSize: 10, color: "var(--learn-text-secondary)", fontWeight: 600 }}>{day.date}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How SRS works */}
            <div className="learn-card" style={{ padding: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>💡 Spaced Repetition là gì?</h3>
                <div style={{ fontSize: 13, color: "var(--learn-text-secondary)", lineHeight: 1.6 }}>
                    <p>Thay vì ôn tất cả mỗi ngày, hệ thống chỉ cho em ôn những thẻ <strong>sắp quên</strong>.</p>
                    <p style={{ marginTop: 6 }}>• Thẻ <strong>dễ</strong> → ôn sau nhiều ngày</p>
                    <p>• Thẻ <strong>khó</strong> → ôn lại sớm hơn</p>
                    <p>• Kết quả: nhớ <strong>lâu hơn</strong>, học <strong>ít hơn</strong> ⚡</p>
                </div>
            </div>
        </motion.div>
    );
}
