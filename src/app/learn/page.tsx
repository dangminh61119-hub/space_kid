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
import SmartRecommendations from "@/components/learn/SmartRecommendations";
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

/* ─── Time ago helper ─── */
function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}

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
    const { playerDbId, session } = useAuth();
    const token = session?.access_token;
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
    const [recentStudy, setRecentStudy] = useState<Array<{
        id: string; query: string; subject: string | null;
        practiced: boolean; created_at: string;
    }>>([]);
    const srsCount = getDueCount();

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

                // Fetch recent study sessions from DB
                if (playerDbId && token) {
                    try {
                        const sessRes = await fetch(`/api/study-sessions?player_id=${playerDbId}&mode=recent`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const sessData = await sessRes.json();
                        if (sessData.sessions) setRecentStudy(sessData.sessions.slice(0, 3));
                    } catch { /* silent */ }
                }
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
            {/* Gamified Hero Banner */}
            <motion.div variants={fadeUp} className="learn-hero-banner">
                <div style={{ flex: 1 }}>
                    <h1 className="learn-hero-title">
                        {player.mascot === "cat" ? "🐱" : player.mascot === "dog" ? "🐶" : "👋"} Xin chào, {player.name}!
                    </h1>
                    <p className="learn-hero-subtitle">
                        <span className="learn-badge" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Lớp {player.grade}</span>
                        <span className="learn-badge" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Level {player.level}</span>
                    </p>
                    <div className="learn-hero-speech">
                        <span style={{ fontSize: 24, marginRight: 8 }}>🦉</span>
                        <span>{greeting}</span>
                    </div>
                </div>
                <div className="learn-hero-graphic">
                    🚀
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

            {/* Tiếp tục học — from recent báo bài */}
            {recentStudy.length > 0 && (
                <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                    <h2 className="learn-card-title" style={{ marginBottom: 12 }}>📋 Tiếp tục học</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {recentStudy.map((s) => {
                            const subjectInfo = SUBJECTS.find(sub => sub.id === s.subject);
                            const ago = getTimeAgo(s.created_at);
                            return (
                                <div key={s.id} className="learn-card" style={{ borderLeft: `4px solid ${subjectInfo?.color || "var(--learn-accent)"}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                                            {subjectInfo?.emoji || "📚"} {s.query}
                                        </div>
                                        <span style={{ fontSize: 11, color: "var(--learn-text-secondary)" }}>{ago}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Link href={`/learn/tutor?topic=${encodeURIComponent(s.query)}&subject=${s.subject || ""}&from=bao-bai`} style={{ textDecoration: "none" }}>
                                            <button className="learn-btn learn-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
                                                🦉 Gia sư
                                            </button>
                                        </Link>
                                        {!s.practiced && (
                                            <Link href={`/learn/practice?topic=${encodeURIComponent(s.query)}&subject=${s.subject || ""}&from=bao-bai&session=${s.id}`} style={{ textDecoration: "none" }}>
                                                <button className="learn-btn learn-btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }}>
                                                    📝 Luyện tập
                                                </button>
                                            </Link>
                                        )}
                                        {s.practiced && (
                                            <span className="learn-badge learn-badge-success">✅ Đã luyện</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Gợi ý khi chưa có báo bài */}
            {recentStudy.length === 0 && (
                <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                    <Link href="/learn/bao-bai" style={{ textDecoration: "none" }}>
                        <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ borderLeft: "4px solid var(--learn-accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                            <span style={{ fontSize: 36 }}>📋</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Hôm nay em học gì?</div>
                                <div style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>
                                    Cho Cú Mèo biết bài tập về nhà → AI tìm bài học + tạo bài tập từ SGK
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>
            )}

            {/* Smart Recommendations from Curriculum */}
            {playerDbId && (
                <motion.div variants={fadeUp}>
                    <SmartRecommendations
                        playerId={playerDbId}
                        grade={player.grade}
                        token={token}
                    />
                </motion.div>
            )}

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
                                    {srsCount > 0 && (
                                        <span className="learn-badge learn-badge-warning">{srsCount} thẻ</span>
                                    )}
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

        .learn-hero-banner {
          background: linear-gradient(135deg, var(--learn-accent), #4F46E5);
          border-radius: 28px;
          padding: 32px 36px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.25), inset 0 2px 0 rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
        }

        .learn-hero-banner::after {
          content: '';
          position: absolute;
          top: -50%; right: -10%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
        }

        .learn-hero-title {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 12px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.15);
          letter-spacing: -0.5px;
        }

        .learn-hero-subtitle {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .learn-hero-speech {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 12px 20px;
          border-radius: 20px 20px 20px 4px;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .learn-hero-graphic {
          font-size: 120px;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
          animation: float-slow 6s ease-in-out infinite;
          margin-right: 20px;
        }

        .learn-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .learn-stat-card {
          background: var(--learn-card);
          padding: 20px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 2px solid white;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.05), inset 0 0 0 1px var(--learn-border);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .learn-stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(124, 58, 237, 0.1); }

        .learn-stat-icon {
          font-size: 32px;
          margin-bottom: 8px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .learn-stat-value {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 900;
          color: var(--learn-text);
          line-height: 1;
          margin-bottom: 4px;
        }

        .learn-stat-label {
          font-size: 13px;
          color: var(--learn-text-secondary);
          font-weight: 700;
        }

        .learn-two-col {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .learn-subjects-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .learn-subject-card {
          cursor: pointer;
          border-width: 2px;
        }

        @media (max-width: 1024px) {
          .learn-two-col { grid-template-columns: 1fr; }
          .learn-hero-title { font-size: 28px; }
          .learn-hero-graphic { font-size: 80px; }
        }

        @media (max-width: 768px) {
          .learn-stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .learn-subjects-grid { grid-template-columns: 1fr; }
          .learn-hero-banner { flex-direction: column; text-align: center; padding: 24px; gap: 24px; }
          .learn-hero-subtitle { justify-content: center; }
          .learn-hero-speech { border-radius: 20px; }
          .learn-hero-graphic { margin-right: 0; display: none; }
        }
      `}</style>
        </motion.div>
    );
}
