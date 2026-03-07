"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { getStudentProfile, getWeakSubjects, getTopErrors, formatErrorType, type StudentProfile } from "@/lib/services/student-profile-service";
import { getSessionStats } from "@/lib/services/learning-session-service";
import { getRemediationAdvice } from "@/lib/services/error-tracking-service";
import { useAuth } from "@/lib/services/auth-context";
import StreakWidget from "@/components/learn/StreakWidget";
import { getDueCount } from "@/lib/services/srs-service";

/* ─── Subject config ─── */

const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢", color: "var(--learn-math)" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖", color: "var(--learn-vietnamese)" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍", color: "var(--learn-english)" },
    { id: "science", label: "Khoa học", emoji: "🔬", color: "var(--learn-science)" },
    { id: "geography", label: "Địa lý", emoji: "🗺️", color: "var(--learn-geography)" },
    { id: "history", label: "Lịch sử", emoji: "📜", color: "var(--learn-history)" },
];

/* ─── Animation variants ─── */
const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ─── Progress Wheel Component ─── */
function ProgressWheel({ value, size = 64, stroke = 6, color }: { value: number; size?: number; stroke?: number; color: string }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;

    return (
        <div className="learn-progress-wheel" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--learn-border)" strokeWidth={stroke} fill="none" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={stroke} fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, delay: 0.3 }}
                    strokeDasharray={circumference}
                />
            </svg>
            <span className="learn-progress-wheel-text" style={{ fontSize: size * 0.24 }}>
                {value}%
            </span>
        </div>
    );
}

export default function LearnHomePage() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [stats, setStats] = useState<{
        totalSessions: number;
        totalMinutes: number;
        totalQuestions: number;
        totalCorrect: number;
        averageAccuracy: number;
        sessionsThisWeek: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const playerId = playerDbId || "local";
                const [p, s] = await Promise.all([
                    getStudentProfile(playerId),
                    getSessionStats(playerId),
                ]);
                setProfile(p);
                setStats(s);
            } catch (e) {
                console.error("Failed to load learn data:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [playerDbId]);

    const weakSubjects = useMemo(() => profile ? getWeakSubjects(profile) : [], [profile]);
    const topErrors = useMemo(() => profile ? getTopErrors(profile, 3) : [], [profile]);

    // Mascot greeting based on profile
    const greeting = useMemo(() => {
        if (!profile || profile.totalSessions === 0) {
            return `Chào ${player.name}! 🦉 Cú Mèo rất vui được đồng hành cùng bạn trong hành trình học tập!`;
        }
        if (weakSubjects.length > 0) {
            const weakLabel = SUBJECTS.find(s => s.id === weakSubjects[0])?.label || weakSubjects[0];
            return `Chào ${player.name}! Hôm nay mình cùng luyện thêm ${weakLabel} nhé? Cú Mèo tin bạn sẽ tiến bộ! 🌟`;
        }
        return `Tuyệt vời ${player.name}! Bạn đang học rất giỏi. Tiếp tục phát huy nhé! 🚀`;
    }, [profile, player.name, weakSubjects]);

    if (loading) {
        return (
            <div className="learn-loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: 48 }}
                >
                    🦉
                </motion.div>
                <p style={{ color: "var(--learn-text-secondary)", marginTop: 12 }}>Đang tải...</p>
            </div>
        );
    }

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible">
            {/* Header */}
            <motion.div variants={fadeUp}>
                <h1 className="learn-page-title">
                    {player.mascot === "cat" ? "🐱" : player.mascot === "dog" ? "🐶" : "👋"} Xin chào, {player.name}!
                </h1>
                <p className="learn-page-subtitle">Lớp {player.grade} • Level {player.level}</p>
            </motion.div>

            {/* Cú Mèo Greeting Card */}
            <motion.div variants={fadeUp} className="learn-card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 40, flexShrink: 0 }}>🦉</div>
                <div>
                    <p style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>{greeting}</p>
                </div>
            </motion.div>

            {/* Quick Stats Row */}
            <motion.div variants={fadeUp} className="learn-stats-row">
                <div className="learn-stat-card">
                    <span className="learn-stat-icon">🔥</span>
                    <span className="learn-stat-value">{player.streak}</span>
                    <span className="learn-stat-label">Streak</span>
                </div>
                <div className="learn-stat-card">
                    <span className="learn-stat-icon">📝</span>
                    <span className="learn-stat-value">{stats?.totalQuestions || 0}</span>
                    <span className="learn-stat-label">Câu đã làm</span>
                </div>
                <div className="learn-stat-card">
                    <span className="learn-stat-icon">🎯</span>
                    <span className="learn-stat-value">{stats?.averageAccuracy || 0}%</span>
                    <span className="learn-stat-label">Chính xác</span>
                </div>
                <div className="learn-stat-card">
                    <span className="learn-stat-icon">⏱️</span>
                    <span className="learn-stat-value">{stats?.totalMinutes || 0}</span>
                    <span className="learn-stat-label">Phút học</span>
                </div>
            </motion.div>

            {/* Two-Column Layout */}
            <div className="learn-two-col">
                {/* Left: Subject Progress */}
                <motion.div variants={fadeUp}>
                    <h2 className="learn-card-title" style={{ marginBottom: 12 }}>📊 Tiến trình các môn</h2>
                    <div className="learn-subjects-grid">
                        {SUBJECTS.map((subject) => {
                            const mastery = profile?.subjectStrengths[subject.id] ?? 0;
                            const isWeak = weakSubjects.includes(subject.id);
                            return (
                                <Link href={`/learn/practice?subject=${subject.id}`} key={subject.id} style={{ textDecoration: "none" }}>
                                    <motion.div
                                        className="learn-card learn-subject-card"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <ProgressWheel value={mastery} size={52} color={subject.color} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--learn-text)" }}>
                                                    {subject.emoji} {subject.label}
                                                </div>
                                                {isWeak ? (
                                                    <span className="learn-badge learn-badge-warning">⚠️ Cần luyện thêm</span>
                                                ) : mastery >= 70 ? (
                                                    <span className="learn-badge learn-badge-success">✅ Nắm vững</span>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>Đang học</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Right: Error Focus + Quick Actions */}
                <div>
                    {/* Error Focus */}
                    {topErrors.length > 0 && (
                        <motion.div variants={fadeUp}>
                            <h2 className="learn-card-title" style={{ marginBottom: 12 }}>🎯 Lỗi cần khắc phục</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {topErrors.map(({ type, pattern }) => {
                                    const advice = getRemediationAdvice(type);
                                    return (
                                        <div key={type} className="learn-card" style={{ borderLeft: "4px solid var(--learn-warning)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>{formatErrorType(type)}</span>
                                                <span className="learn-badge learn-badge-error">Sai {pattern.count} lần</span>
                                            </div>
                                            <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 8 }}>
                                                {advice.tips[0]}
                                            </p>
                                            <Link href={`/learn/practice?focus=${type}`}>
                                                <button className="learn-btn learn-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
                                                    Luyện ngay →
                                                </button>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Streak Widget */}
                    <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                        <StreakWidget currentStreak={player.streak} />
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
                        <h2 className="learn-card-title" style={{ marginBottom: 12 }}>⚡ Hành động nhanh</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <Link href="/learn/review" style={{ textDecoration: "none" }}>
                                <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderLeft: "4px solid var(--learn-accent)" }}>
                                    <span style={{ fontSize: 28 }}>🔄</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Ôn tập SRS</div>
                                        <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>Spaced Repetition — nhớ lâu hơn</div>
                                    </div>
                                </motion.div>
                            </Link>
                            <Link href="/learn/practice" style={{ textDecoration: "none" }}>
                                <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                    <span style={{ fontSize: 28 }}>📝</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Luyện tập ngay</div>
                                        <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>Flashcard, Quiz, Error Drill</div>
                                    </div>
                                </motion.div>
                            </Link>
                            <Link href="/learn/lessons" style={{ textDecoration: "none" }}>
                                <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                    <span style={{ fontSize: 28 }}>📺</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Xem bài giảng</div>
                                        <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>Video bài giảng theo chương trình SGK</div>
                                    </div>
                                </motion.div>
                            </Link>
                            <Link href="/learn/tutor" style={{ textDecoration: "none" }}>
                                <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                                    <span style={{ fontSize: 28 }}>🤖</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Hỏi Cú Mèo</div>
                                        <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>AI Tutor cá nhân hoá</div>
                                    </div>
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scoped styles */}
            <style jsx>{`
        .learn-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .learn-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }

        .learn-stat-card {
          background: var(--learn-card);
          border: 1px solid var(--learn-border);
          border-radius: 14px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }
        .learn-stat-icon { font-size: 22px; }
        .learn-stat-value { font-family: var(--font-heading); font-weight: 800; font-size: 22px; color: var(--learn-text); }
        .learn-stat-label { font-size: 11px; color: var(--learn-text-secondary); font-weight: 600; }

        .learn-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .learn-subjects-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .learn-subject-card {
          padding: 14px 16px;
        }

        @media (max-width: 768px) {
          .learn-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .learn-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </motion.div>
    );
}
