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
                    style={value >= 70 ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
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
        <motion.div variants={stagger} initial="hidden" animate="visible" className="learn-bento-grid">
            {/* ─── Hero Banner (spans 8) ─── */}
            <motion.div variants={fadeUp} className="learn-bento-item learn-bento-hero">
                <div className="learn-hero-banner">
                    <div className="learn-hero-mesh-1" />
                    <div className="learn-hero-mesh-2" />
                    <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
                        <h1 className="learn-hero-title">
                            {player.mascot === "cat" ? "🐱" : player.mascot === "dog" ? "🐶" : "👋"} Xin chào, {player.name}!
                        </h1>
                        <p className="learn-hero-subtitle">
                            <span className="learn-hero-badge">Lớp {player.grade}</span>
                            <span className="learn-hero-badge">Level {player.level}</span>
                        </p>
                        <div className="learn-hero-speech">
                            <span style={{ fontSize: 24, marginRight: 10 }}>🦉</span>
                            <span>{greeting}</span>
                        </div>
                    </div>
                    <div className="learn-hero-graphic">🚀</div>
                </div>
            </motion.div>

            {/* ─── Stats Mini-Grid (spans 4) ─── */}
            <motion.div variants={fadeUp} className="learn-bento-item learn-bento-stats">
                <div className="learn-stats-grid">
                    <div className="learn-stat-card learn-stat-streak">
                        <div className="learn-stat-icon-wrap"><span className="learn-stat-icon">🔥</span></div>
                        <span className="learn-stat-value">{player.streak}</span>
                        <span className="learn-stat-label">Streak</span>
                    </div>
                    <div className="learn-stat-card learn-stat-questions">
                        <div className="learn-stat-icon-wrap"><span className="learn-stat-icon">📝</span></div>
                        <span className="learn-stat-value">{stats?.totalQuestions || 0}</span>
                        <span className="learn-stat-label">Câu đã làm</span>
                    </div>
                    <div className="learn-stat-card learn-stat-accuracy">
                        <div className="learn-stat-icon-wrap"><span className="learn-stat-icon">🎯</span></div>
                        <span className="learn-stat-value">{stats?.averageAccuracy || 0}%</span>
                        <span className="learn-stat-label">Chính xác</span>
                    </div>
                    <div className="learn-stat-card learn-stat-time">
                        <div className="learn-stat-icon-wrap"><span className="learn-stat-icon">⏱️</span></div>
                        <span className="learn-stat-value">{stats?.totalMinutes || 0}</span>
                        <span className="learn-stat-label">Phút học</span>
                    </div>
                </div>
            </motion.div>

            {/* ─── Main Column (spans 8) ─── */}
            <div className="learn-bento-item learn-bento-main">
                {/* Tiệp tục học / Gợi ý */}
                {recentStudy.length > 0 ? (
                    <motion.div variants={fadeUp}>
                        <h2 className="learn-card-title" style={{ marginBottom: 12 }}>📋 Tiếp tục học</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {recentStudy.map((s) => {
                                const subjectInfo = SUBJECTS.find(sub => sub.id === s.subject);
                                const ago = getTimeAgo(s.created_at);
                                return (
                                    <div key={s.id} className="learn-card" style={{ borderLeft: `6px solid ${subjectInfo?.color || "var(--learn-accent)"}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                            <div style={{ fontWeight: 800, fontSize: 16 }}>
                                                {subjectInfo?.emoji || "📚"} {s.query}
                                            </div>
                                            <span style={{ fontSize: 12, color: "var(--learn-text-secondary)", fontWeight: 600 }}>{ago}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Link href={`/learn/tutor?topic=${encodeURIComponent(s.query)}&subject=${s.subject || ""}&from=bao-bai`} style={{ textDecoration: "none" }}>
                                                <button className="learn-btn learn-btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
                                                    🦉 Gia sư
                                                </button>
                                            </Link>
                                            {!s.practiced && (
                                                <Link href={`/learn/practice?topic=${encodeURIComponent(s.query)}&subject=${s.subject || ""}&from=bao-bai&session=${s.id}`} style={{ textDecoration: "none" }}>
                                                    <button className="learn-btn learn-btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>
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
                ) : (
                    <motion.div variants={fadeUp}>
                        <Link href="/learn/bao-bai" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card" whileHover={{ scale: 1.01 }} style={{ borderLeft: "6px solid var(--learn-accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ fontSize: 40 }}>📋</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: "#fff" }}>Hôm nay em học gì?</div>
                                    <div style={{ fontSize: 14, color: "var(--learn-text-secondary)" }}>
                                        Cho Cú Mèo biết bài tập về nhà → AI tìm bài học + tạo bài tập từ SGK
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>
                )}

                {/* Subject Progress */}
                <motion.div variants={fadeUp} style={{ marginTop: 8 }}>
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
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <ProgressWheel value={mastery} size={60} stroke={6} color={subject.color} />
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: 16, color: "#FFF", marginBottom: 2 }}>
                                                    {subject.emoji} {subject.label}
                                                </div>
                                                {isWeak ? (
                                                    <span className="learn-badge learn-badge-warning">⚠️ Cần luyện thêm</span>
                                                ) : mastery >= 70 ? (
                                                    <span className="learn-badge learn-badge-success">✅ Nắm vững</span>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: "var(--learn-text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Đang học</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="learn-card-glow" />
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* ─── Side Column (spans 4) ─── */}
            <div className="learn-bento-item learn-bento-side">
                {/* Smart Recommendations */}
                {playerDbId && (
                    <motion.div variants={fadeUp}>
                        <SmartRecommendations
                            playerId={playerDbId}
                            grade={player.grade}
                            token={token}
                        />
                    </motion.div>
                )}

                {/* Streak Widget */}
                <motion.div variants={fadeUp}>
                    <StreakWidget currentStreak={player.streak} />
                </motion.div>

                {/* Error Focus */}
                {topErrors.length > 0 && (
                    <motion.div variants={fadeUp}>
                        <h2 className="learn-card-title" style={{ marginBottom: 12 }}>🎯 Lỗi hay gặp</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {topErrors.map(({ type, pattern }) => {
                                const advice = getRemediationAdvice(type);
                                return (
                                    <div key={type} className="learn-card" style={{ borderLeft: "4px solid var(--learn-warning)", padding: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{formatErrorType(type)}</span>
                                            <span className="learn-badge learn-badge-error">Sai {pattern.count} lần</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                                            {advice.tips[0]}
                                        </p>
                                        <Link href={`/learn/practice?focus=${type}`}>
                                            <button className="learn-btn learn-btn-primary" style={{ fontSize: 13, padding: "8px 16px", width: "100%" }}>
                                                Khắc phục lỗi →
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div variants={fadeUp}>
                    <h2 className="learn-card-title" style={{ marginBottom: 12 }}>⚡ Lối tắt</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <Link href="/learn/review" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card learn-action-card" whileHover={{ scale: 1.02 }} style={{ borderLeftColor: "#A855F7" }}>
                                <span className="learn-action-icon">🔄</span>
                                <div style={{ flex: 1 }}>
                                    <div className="learn-action-title">Ôn tập thẻ ghi nhớ</div>
                                    <div className="learn-action-desc">Spaced Repetition</div>
                                </div>
                                {srsCount > 0 && (
                                    <span className="learn-badge learn-badge-warning">{srsCount}</span>
                                )}
                            </motion.div>
                        </Link>
                        <Link href="/learn/lessons" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card learn-action-card" whileHover={{ scale: 1.02 }} style={{ borderLeftColor: "#3B82F6" }}>
                                <span className="learn-action-icon">📺</span>
                                <div>
                                    <div className="learn-action-title">Xem bài giảng</div>
                                    <div className="learn-action-desc">Video theo SGK</div>
                                </div>
                            </motion.div>
                        </Link>
                        <Link href="/learn/tutor" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card learn-action-card" whileHover={{ scale: 1.02 }} style={{ borderLeftColor: "#06B6D4" }}>
                                <span className="learn-action-icon">🤖</span>
                                <div>
                                    <div className="learn-action-title">Hỏi AI Tutor</div>
                                    <div className="learn-action-desc">Cú Mèo giải đáp</div>
                                </div>
                            </motion.div>
                        </Link>
                        <Link href="/learn/english-buddy" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card learn-action-card" whileHover={{ scale: 1.02 }} style={{ borderLeftColor: "#0D9488" }}>
                                <span className="learn-action-icon">🦅</span>
                                <div style={{ flex: 1 }}>
                                    <div className="learn-action-title">Luyện tiếng Anh với Luna</div>
                                    <div className="learn-action-desc">Hội thoại thực tế mỗi ngày</div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#5EEAD4", background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: 8, padding: "3px 8px", letterSpacing: "0.5px" }}>NEW</span>
                            </motion.div>
                        </Link>
                    </div>
                </motion.div>
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

        /* ─── Bento Grid Layout ─── */
        .learn-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }

        .learn-bento-item {
          min-width: 0; /* prevent blowout */
        }

        /* Span assignments for desktop */
        @media (min-width: 1024px) {
          .learn-bento-hero { grid-column: span 8; }
          .learn-bento-stats { grid-column: span 4; }
          .learn-bento-main { grid-column: span 8; display: flex; flex-direction: column; gap: 24px; }
          .learn-bento-side { grid-column: span 4; display: flex; flex-direction: column; gap: 24px; }
        }
        /* Mobile fallback */
        @media (max-width: 1023px) {
          .learn-bento-hero, .learn-bento-stats, .learn-bento-main, .learn-bento-side { 
            grid-column: span 12; 
          }
          .learn-bento-main, .learn-bento-side { gap: 24px; display: flex; flex-direction: column; margin-top: 24px; }
        }

        /* ─── Hero Banner (Aurora Amber) ─── */
        .learn-hero-banner {
          background: linear-gradient(135deg, #1A0B2E 0%, #7C3AED 40%, #D97706 100%);
          border-radius: 32px;
          padding: 40px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
        }
        .learn-hero-mesh-1 {
          position: absolute;
          top: -30%; right: -10%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .learn-hero-mesh-2 {
          position: absolute;
          bottom: -50%; left: 10%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: color-dodge;
        }

        .learn-hero-title {
          font-family: var(--font-heading);
          font-size: 38px;
          font-weight: 900;
          margin-bottom: 16px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.4);
          letter-spacing: -0.5px;
          color: #FFF;
        }

        .learn-hero-subtitle {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .learn-hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
          font-family: var(--font-heading);
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(12px);
          color: var(--learn-accent-light);
          border: 1px solid rgba(245, 158, 11, 0.4);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .learn-hero-speech {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          padding: 16px 24px;
          border-radius: 20px 20px 20px 4px;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 500px;
          line-height: 1.5;
        }

        .learn-hero-graphic {
          font-size: 120px;
          filter: drop-shadow(0 12px 32px rgba(0,0,0,0.6));
          animation: float-slow 6s ease-in-out infinite;
          margin-right: 20px;
          position: relative;
          z-index: 2;
        }

        /* ─── Stats Grid (Bento mini) ─── */
        .learn-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 16px;
          height: 100%;
        }

        .learn-stat-card {
          background: var(--learn-card);
          backdrop-filter: blur(16px);
          padding: 24px 16px;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid var(--learn-card-border);
          box-shadow: var(--learn-card-shadow);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .learn-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0.8;
          pointer-events: none;
        }
        .learn-stat-streak::before { background: radial-gradient(circle at top right, rgba(249,115,22,0.15), transparent 70%); }
        .learn-stat-questions::before { background: radial-gradient(circle at top right, rgba(6,182,212,0.15), transparent 70%); }
        .learn-stat-accuracy::before { background: radial-gradient(circle at top right, rgba(168,85,247,0.15), transparent 70%); }
        .learn-stat-time::before { background: radial-gradient(circle at top right, rgba(245,158,11,0.15), transparent 70%); }

        .learn-stat-card:hover { 
          transform: translateY(-4px) scale(1.02); 
          box-shadow: var(--learn-card-shadow-hover); 
          border-color: var(--learn-border-strong);
        }

        .learn-stat-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          position: relative;
          z-index: 1;
        }

        .learn-stat-icon {
          font-size: 26px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .learn-stat-value {
          font-family: var(--font-heading);
          font-size: 32px;
          font-weight: 900;
          color: #FFF;
          line-height: 1;
          margin-bottom: 6px;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        .learn-stat-label {
          font-size: 12px;
          color: var(--learn-text-secondary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }

        /* ─── Subjects Grid ─── */
        .learn-subjects-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .learn-subject-card {
          cursor: pointer;
          padding: 20px;
          border-radius: 24px;
        }

        /* ─── Quick Action Cards ─── */
        .learn-action-card {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          padding: 20px 24px;
          border-left: 4px solid rgba(255,255,255,0.1); /* Replace with neon subject colored left borders via React styles later */
        }
        .learn-action-card:hover {
          background: rgba(245, 158, 11, 0.05); /* Amber hover bg */
        }
        .learn-action-icon {
          font-size: 28px;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }
        .learn-action-title {
          font-weight: 800;
          font-size: 15px;
          color: #FFF;
          margin-bottom: 2px;
        }
        .learn-action-desc {
          font-size: 13px;
          color: var(--learn-text-secondary);
        }

        @media (max-width: 768px) {
          .learn-hero-banner { flex-direction: column; text-align: center; padding: 32px 24px; gap: 24px; border-radius: 28px; }
          .learn-hero-subtitle { justify-content: center; }
          .learn-hero-speech { border-radius: 20px; font-size: 14px; }
          .learn-hero-graphic { margin-right: 0; display: none; }
          .learn-hero-title { font-size: 28px; }
          
          .learn-stats-grid { grid-template-columns: 1fr 1fr; }
          .learn-subjects-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </motion.div>
    );
}
