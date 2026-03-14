"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useGame } from "@/lib/game-context";
import { getStudentProfile, getWeakSubjects, getTopErrors, formatErrorType, type StudentProfile } from "@/lib/services/student-profile-service";
import { getSessionStats } from "@/lib/services/learning-session-service";
import { getRemediationAdvice } from "@/lib/services/error-tracking-service";
import { useAuth } from "@/lib/services/auth-context";
import StreakWidget from "@/components/learn/StreakWidget";
import SmartRecommendations from "@/components/learn/SmartRecommendations";
import PlanetProgress from "@/components/learn/PlanetProgress";
import StarMap from "@/components/learn/StarMap";
import RocketMeter from "@/components/learn/RocketMeter";
import { getDueCount } from "@/lib/services/srs-service";
import DailyMissions from "@/components/learn/DailyMissions";

/* ─── Subject config ─── */

const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🪐", color: "#3B82F6" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "🌍", color: "#10B981" },
    { id: "english", label: "Tiếng Anh", emoji: "🔴", color: "#F43F5E" },
    { id: "science", label: "Khoa học", emoji: "🟣", color: "#8B5CF6" },
    { id: "geography", label: "Địa lý", emoji: "🌊", color: "#06B6D4" },
    { id: "history", label: "Lịch sử", emoji: "🪻", color: "#D946EF" },
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
                        if (sessData.sessions) setRecentStudy(sessData.sessions.slice(0, 5));
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
            return `Chào ${player.name}! Cú Mèo rất vui được đồng hành cùng bạn trong hành trình khám phá vũ trụ kiến thức!`;
        }
        if (weakSubjects.length > 0) {
            const weakLabel = SUBJECTS.find(s => s.id === weakSubjects[0])?.label || weakSubjects[0];
            return `Chào ${player.name}! Hôm nay mình cùng khám phá hành tinh ${weakLabel} nhé? Cú Mèo tin bạn sẽ chinh phục được! 🌟`;
        }
        return `Tuyệt vời ${player.name}! Bạn đang bay rất cao. Tiếp tục phát huy nhé! 🚀`;
    }, [profile, player.name, weakSubjects]);

    // Build StarMap nodes from recent study + quick actions
    const starMapNodes = useMemo(() => {
        if (recentStudy.length === 0) return [];
        return recentStudy.map((s, i) => {
            const subjectInfo = SUBJECTS.find(sub => sub.id === s.subject);
            return {
                id: s.id,
                label: s.query.length > 18 ? s.query.slice(0, 18) + "…" : s.query,
                subject: s.subject,
                emoji: subjectInfo?.emoji || "📚",
                href: `/learn/tutor?topic=${encodeURIComponent(s.query)}&subject=${s.subject || ""}&from=bao-bai`,
                status: (s.practiced ? "done" : i === 0 ? "current" : "upcoming") as "done" | "current" | "upcoming",
            };
        });
    }, [recentStudy]);

    if (loading) {
        return (
            <div className="learn-loading">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: 48 }}
                >
                    🚀
                </motion.div>
                <p style={{ color: "var(--learn-text-secondary)", marginTop: 12 }}>Đang chuẩn bị phi thuyền...</p>
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
                    <div className="learn-hero-mesh-3" />
                    <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
                        <h1 className="learn-hero-title">
                            {player.mascot === "cat" ? "🐱" : player.mascot === "dog" ? "🐶" : "👋"} Xin chào, {player.name}!
                        </h1>
                        <p className="learn-hero-subtitle">
                            <span className="learn-hero-badge">🎓 Lớp {player.grade}</span>
                            <span className="learn-hero-badge">⚡ Level {player.level}</span>
                            <span className="learn-hero-badge" style={{ borderColor: 'rgba(245, 180, 11, 0.3)', color: '#FBBF24' }}>🪙 {player.coins.toLocaleString()}</span>
                        </p>
                        <div className="learn-hero-speech">
                            <motion.div
                                className="learn-hero-avatar"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Image
                                    src="/images/cosmo_avatar.png"
                                    alt="Cú Mèo"
                                    width={48}
                                    height={48}
                                    style={{ borderRadius: 12 }}
                                />
                            </motion.div>
                            <span>{greeting}</span>
                        </div>
                    </div>
                    <div className="learn-hero-graphic">
                        <motion.div
                            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Image
                                src="/images/cosmo_avatar.png"
                                alt="Cosmo"
                                width={140}
                                height={140}
                                style={{ filter: "drop-shadow(0 12px 40px rgba(0, 212, 255, 0.4))" }}
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Daily Missions ─── */}
            <motion.div variants={fadeUp} className="learn-bento-item" style={{ gridColumn: "1 / -1" }}>
                <DailyMissions />
            </motion.div>

            {/* ─── Rocket Meter replaces Stats Grid (spans 4) ─── */}
            <motion.div variants={fadeUp} className="learn-bento-item learn-bento-stats">
                <RocketMeter
                    totalQuestions={stats?.totalQuestions || 0}
                    totalMinutes={stats?.totalMinutes || 0}
                    accuracy={stats?.averageAccuracy || 0}
                    streak={player.streak}
                />
            </motion.div>

            {/* ─── Main Column (spans 8) ─── */}
            <div className="learn-bento-item learn-bento-main">
                {/* Star Map — Constellation Learning Journey */}
                {starMapNodes.length > 0 ? (
                    <motion.div variants={fadeUp} className="learn-card" style={{ padding: "24px 28px" }}>
                        <StarMap nodes={starMapNodes} title="🌌 Hành trình học tập" />
                    </motion.div>
                ) : (
                    <motion.div variants={fadeUp}>
                        <Link href="/learn/bao-bai" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-card learn-start-card" whileHover={{ scale: 1.01 }}>
                                <div className="learn-start-glow" />
                                <span className="learn-start-rocket">📋</span>
                                <div>
                                    <div className="learn-start-title">Hôm nay em học gì?</div>
                                    <div className="learn-start-desc">
                                        Cho Cú Mèo biết bài tập về nhà → AI tìm bài học + tạo bài tập từ SGK
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </motion.div>
                )}

                {/* Planet Progress — Subject Cards */}
                <motion.div variants={fadeUp} style={{ marginTop: 8 }}>
                    <h2 className="learn-section-title">🪐 Hành tinh kiến thức</h2>
                    <div className="learn-planets-grid">
                        {SUBJECTS.map((subject) => {
                            const mastery = profile?.subjectStrengths[subject.id] ?? 0;
                            const isWeak = weakSubjects.includes(subject.id);
                            return (
                                <Link href={`/learn/practice?subject=${subject.id}`} key={subject.id} style={{ textDecoration: "none" }}>
                                    <PlanetProgress
                                        subject={subject.id}
                                        label={subject.label}
                                        emoji={subject.emoji}
                                        mastery={mastery}
                                        color={subject.color}
                                        isWeak={isWeak}
                                    />
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
                        <h2 className="learn-section-title">🎯 Lỗi hay gặp</h2>
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

                {/* Quick Actions — Space Dock */}
                <motion.div variants={fadeUp}>
                    <h2 className="learn-section-title">⚡ Trạm không gian</h2>
                    <div className="learn-dock-grid">
                        <Link href="/learn/review" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-dock-item" whileHover={{ scale: 1.05, y: -4 }}>
                                <span className="learn-dock-icon">🔄</span>
                                <span className="learn-dock-label">Ôn tập</span>
                                {srsCount > 0 && (
                                    <span className="learn-dock-badge">{srsCount}</span>
                                )}
                            </motion.div>
                        </Link>
                        <Link href="/learn/lessons" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-dock-item" whileHover={{ scale: 1.05, y: -4 }}>
                                <span className="learn-dock-icon">📺</span>
                                <span className="learn-dock-label">Bài giảng</span>
                            </motion.div>
                        </Link>
                        <Link href="/learn/tutor" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-dock-item" whileHover={{ scale: 1.05, y: -4 }}>
                                <span className="learn-dock-icon">🤖</span>
                                <span className="learn-dock-label">AI Tutor</span>
                            </motion.div>
                        </Link>
                        <Link href="/learn/english-buddy" style={{ textDecoration: "none" }}>
                            <motion.div className="learn-dock-item learn-dock-new" whileHover={{ scale: 1.05, y: -4 }}>
                                <span className="learn-dock-icon">🦅</span>
                                <span className="learn-dock-label">Cosmo</span>
                                <span className="learn-dock-new-tag">NEW</span>
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
          min-width: 0;
        }

        @media (min-width: 1024px) {
          .learn-bento-hero { grid-column: span 8; }
          .learn-bento-stats { grid-column: span 4; }
          .learn-bento-main { grid-column: span 8; display: flex; flex-direction: column; gap: 24px; }
          .learn-bento-side { grid-column: span 4; display: flex; flex-direction: column; gap: 24px; }
        }
        @media (max-width: 1023px) {
          .learn-bento-hero, .learn-bento-stats, .learn-bento-main, .learn-bento-side {
            grid-column: span 12;
          }
          .learn-bento-main, .learn-bento-side { gap: 24px; display: flex; flex-direction: column; margin-top: 24px; }
        }

        /* ─── Section Title ─── */
        .learn-section-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 16px;
          letter-spacing: 0.2px;
        }

        /* ─── Hero Banner (Aurora Cosmic) ─── */
        .learn-hero-banner {
          background: linear-gradient(135deg, #060C1A 0%, #0A1628 15%, #0B2A4A 35%, #0891B2 55%, #D97706 85%, #F59E0B 100%);
          border-radius: 32px;
          padding: 40px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.7),
            0 0 80px rgba(0, 212, 255, 0.1),
            inset 0 2px 4px rgba(255,255,255,0.15);
          position: relative;
          overflow: hidden;
        }
        .learn-hero-mesh-1 {
          position: absolute;
          top: -30%; right: -10%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: hero-mesh-drift 10s ease-in-out infinite alternate;
        }
        .learn-hero-mesh-2 {
          position: absolute;
          bottom: -50%; left: 10%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: color-dodge;
          animation: hero-mesh-drift 12s ease-in-out 2s infinite alternate-reverse;
        }
        .learn-hero-mesh-3 {
          position: absolute;
          top: 20%; left: 40%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0, 139, 178, 0.2) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
          animation: hero-mesh-drift 8s ease-in-out 4s infinite alternate;
        }

        @keyframes hero-mesh-drift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.15); }
        }

        .learn-hero-title {
          font-family: var(--font-heading);
          font-size: 38px;
          font-weight: 900;
          margin-bottom: 16px;
          text-shadow: 0 4px 16px rgba(0,0,0,0.5);
          letter-spacing: -0.5px;
          color: #FFF;
          background: linear-gradient(90deg, #FFF, #67E8F9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          background: rgba(0, 20, 40, 0.5);
          backdrop-filter: blur(12px);
          color: var(--learn-accent-cyan-light);
          border: 1px solid rgba(0, 212, 255, 0.3);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .learn-hero-speech {
          background: rgba(0, 20, 50, 0.4);
          backdrop-filter: blur(20px);
          padding: 16px 24px;
          border-radius: 20px 20px 20px 4px;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0, 212, 255, 0.08);
          border: 1px solid rgba(0, 212, 255, 0.12);
          max-width: 500px;
          line-height: 1.5;
        }

        .learn-hero-avatar {
          flex-shrink: 0;
          margin-right: 12px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 16px rgba(0, 212, 255, 0.3);
          border: 2px solid rgba(0, 212, 255, 0.2);
        }


        .learn-hero-graphic {
          margin-right: 20px;
          position: relative;
          z-index: 2;
        }

        /* ─── Planet Grid ─── */
        .learn-planets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* ─── Start Card ─── */
        .learn-start-card {
          border-left: 6px solid var(--learn-accent);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .learn-start-glow {
          position: absolute;
          top: -50%; right: -20%;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
        }
        .learn-start-rocket {
          font-size: 40px;
          position: relative;
          z-index: 2;
        }
        .learn-start-title {
          font-weight: 800;
          font-size: 18px;
          margin-bottom: 4px;
          color: #fff;
          position: relative;
          z-index: 2;
        }
        .learn-start-desc {
          font-size: 14px;
          color: var(--learn-text-secondary);
          position: relative;
          z-index: 2;
        }

        /* ─── Space Dock (Quick Actions) ─── */
        .learn-dock-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .learn-dock-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 12px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          text-decoration: none;
        }
        .learn-dock-item:hover {
          background: rgba(0, 212, 255, 0.05);
          border-color: rgba(0, 212, 255, 0.15);
          box-shadow: 0 12px 32px rgba(0, 212, 255, 0.08), 0 0 20px rgba(0, 212, 255, 0.04);
        }

        .learn-dock-icon {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }

        .learn-dock-label {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 800;
          color: rgba(255,255,255,0.8);
          letter-spacing: 0.3px;
        }

        .learn-dock-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00D4FF, #0891B2);
          color: #000;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
        }

        .learn-dock-new-tag {
          position: absolute;
          top: 6px;
          right: 6px;
          font-size: 8px;
          font-weight: 900;
          color: #5EEAD4;
          background: rgba(13,148,136,0.2);
          border: 1px solid rgba(13,148,136,0.3);
          border-radius: 6px;
          padding: 2px 6px;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .learn-hero-banner { flex-direction: column; text-align: center; padding: 32px 24px; gap: 24px; border-radius: 28px; }
          .learn-hero-subtitle { justify-content: center; }
          .learn-hero-speech { border-radius: 20px; font-size: 14px; }
          .learn-hero-graphic { margin-right: 0; display: none; }
          .learn-hero-title { font-size: 28px; }
          .learn-planets-grid { grid-template-columns: repeat(2, 1fr); }
          .learn-dock-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 480px) {
          .learn-planets-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
        </motion.div>
    );
}
