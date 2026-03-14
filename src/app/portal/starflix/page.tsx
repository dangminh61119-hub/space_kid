"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getVideoSeries, getPlayerSeriesProgress, type VideoSeries } from "@/lib/services/video-theater-service";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    english: { label: "Tiếng Anh", emoji: "🌍", color: "#3B82F6" },
    math: { label: "Toán học", emoji: "🔢", color: "#F59E0B" },
    science: { label: "Khoa học", emoji: "🔬", color: "#8B5CF6" },
};

export default function StarFlixPage() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const [series, setSeries] = useState<VideoSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [progressMap, setProgressMap] = useState<Record<string, { watched: number; total: number }>>({});
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        async function load() {
            try {
                const data = await getVideoSeries(player.grade);
                setSeries(data);

                // Load progress for each series
                if (playerDbId) {
                    const map: Record<string, { watched: number; total: number }> = {};
                    for (const s of data) {
                        const progress = await getPlayerSeriesProgress(playerDbId, s.id);
                        const watchedCount = Object.values(progress).filter(p => p.quizPassed).length;
                        map[s.id] = { watched: watchedCount, total: s.episodeCount || 0 };
                    }
                    setProgressMap(map);
                }
            } catch (e) {
                console.error("[starflix] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [player.grade, playerDbId]);

    const filteredSeries = filter === "all" ? series : series.filter(s => s.category === filter);

    if (authLoading || redirecting || !allowed) {
        return (
            <div className="sf-loading-screen">
                <div className="sf-loading-icon">🌠</div>
                <p>{authLoading ? "Đang kiểm tra..." : "Đang chuyển hướng..."}</p>
                <style jsx>{`
                    .sf-loading-screen { min-height: 100vh; background: #060B1E; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7280; }
                    .sf-loading-icon { font-size: 48px; animation: pulse 2s infinite; }
                    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="sf-root">
            <StarField count={60} />
            <Navbar />

            <div className="sf-container">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sf-hero"
                >
                    <div className="sf-hero-glow" />
                    <div className="sf-hero-content">
                        <motion.div
                            animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="sf-hero-icon"
                        >
                            🌠
                        </motion.div>
                        <div>
                            <h1 className="sf-hero-title">StarFlix Vũ Trụ</h1>
                            <p className="sf-hero-subtitle">
                                Khám phá video bí ẩn từ dải ngân hà! Xem phim, vượt thử thách, mở khoá tập mới 🚀
                            </p>
                        </div>
                    </div>

                    {/* Coins display */}
                    <div className="sf-coins-badge">
                        <span className="sf-coins-icon">🪙</span>
                        <span className="sf-coins-value">{player.coins.toLocaleString()}</span>
                    </div>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="sf-filter-bar"
                >
                    <button
                        className={`sf-filter-btn ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        ✨ Tất cả
                    </button>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            className={`sf-filter-btn ${filter === key ? "active" : ""}`}
                            onClick={() => setFilter(key)}
                        >
                            {cfg.emoji} {cfg.label}
                        </button>
                    ))}
                </motion.div>

                {/* Series Grid */}
                {loading ? (
                    <div className="sf-loading">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            style={{ fontSize: 40 }}
                        >
                            🌠
                        </motion.div>
                        <p>Đang tải phim vũ trụ...</p>
                    </div>
                ) : filteredSeries.length === 0 ? (
                    <div className="sf-empty">
                        <div style={{ fontSize: 60, marginBottom: 16 }}>📡</div>
                        <h3>Chưa có phim nào</h3>
                        <p>Rạp chiếu đang được chuẩn bị. Quay lại sau nhé!</p>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="sf-grid"
                    >
                        {filteredSeries.map((s) => {
                            const cfg = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.english;
                            const prog = progressMap[s.id];
                            const progressPct = prog && prog.total > 0 ? Math.round((prog.watched / prog.total) * 100) : 0;

                            return (
                                <motion.div
                                    key={s.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                                    }}
                                >
                                    <Link href={`/portal/starflix/${s.id}`} style={{ textDecoration: "none" }}>
                                        <div className="sf-card">
                                            {/* Thumbnail */}
                                            <div className="sf-card-thumb" style={{ background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}08)` }}>
                                                {s.thumbnailUrl ? (
                                                    <img src={s.thumbnailUrl} alt={s.title} className="sf-card-img" />
                                                ) : (
                                                    <div className="sf-card-placeholder">{cfg.emoji}</div>
                                                )}
                                                {/* Category badge */}
                                                <div className="sf-card-category" style={{ background: cfg.color }}>
                                                    {cfg.emoji} {cfg.label}
                                                </div>
                                                {/* Episode count */}
                                                <div className="sf-card-episodes">
                                                    📺 {s.episodeCount} tập
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="sf-card-body">
                                                <h3 className="sf-card-title">{s.title}</h3>
                                                <p className="sf-card-desc">{s.description}</p>

                                                {/* Progress bar */}
                                                {prog && prog.total > 0 && (
                                                    <div className="sf-card-progress">
                                                        <div className="sf-card-progress-bar">
                                                            <div
                                                                className="sf-card-progress-fill"
                                                                style={{ width: `${progressPct}%`, background: cfg.color }}
                                                            />
                                                        </div>
                                                        <span className="sf-card-progress-text">
                                                            {prog.watched}/{prog.total} tập
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Cost */}
                                                <div className="sf-card-footer">
                                                    {s.unlockCost > 0 ? (
                                                        <span className="sf-card-cost">🪙 {s.unlockCost}</span>
                                                    ) : (
                                                        <span className="sf-card-free">✨ Miễn phí</span>
                                                    )}
                                                    <span className="sf-card-play">Xem ngay →</span>
                                                </div>
                                            </div>

                                            {/* Hover glow */}
                                            <div className="sf-card-glow" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Back link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="sf-back"
                >
                    <Link href="/portal" className="sf-back-link">
                        ← Về Portal
                    </Link>
                </motion.div>
            </div>

            <style jsx>{`
                .sf-root {
                    min-height: 100vh;
                    background: #060B1E;
                    position: relative;
                    color: #e2e8f0;
                    font-family: var(--font-body);
                }
                .sf-container {
                    position: relative;
                    z-index: 10;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 100px 24px 60px;
                }

                /* Hero */
                .sf-hero {
                    position: relative;
                    background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08), rgba(245,158,11,0.06));
                    border: 1px solid rgba(139,92,246,0.2);
                    border-radius: 28px;
                    padding: 32px 36px;
                    margin-bottom: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    overflow: hidden;
                }
                .sf-hero-glow {
                    position: absolute;
                    top: -50%; right: -20%;
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 60%);
                    border-radius: 50%;
                    pointer-events: none;
                }
                .sf-hero-content {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    position: relative;
                    z-index: 2;
                }
                .sf-hero-icon {
                    font-size: 56px;
                    filter: drop-shadow(0 0 20px rgba(139,92,246,0.6));
                }
                .sf-hero-title {
                    font-family: var(--font-heading);
                    font-size: 32px;
                    font-weight: 900;
                    background: linear-gradient(90deg, #c084fc, #60a5fa, #fbbf24);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 6px;
                }
                .sf-hero-subtitle {
                    font-size: 14px;
                    color: rgba(255,255,255,0.6);
                    max-width: 400px;
                    line-height: 1.5;
                }
                .sf-coins-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(245,158,11,0.1);
                    border: 1px solid rgba(245,158,11,0.25);
                    border-radius: 16px;
                    padding: 10px 20px;
                    position: relative;
                    z-index: 2;
                }
                .sf-coins-icon { font-size: 24px; filter: drop-shadow(0 0 8px rgba(245,158,11,0.5)); }
                .sf-coins-value { font-family: var(--font-heading); font-weight: 900; font-size: 20px; color: #FBBF24; }

                /* Filter */
                .sf-filter-bar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 28px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
                .sf-filter-btn {
                    flex-shrink: 0;
                    padding: 10px 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.6);
                    font-family: var(--font-heading);
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .sf-filter-btn:hover { background: rgba(139,92,246,0.08); color: #fff; border-color: rgba(139,92,246,0.3); }
                .sf-filter-btn.active {
                    background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1));
                    color: #c084fc;
                    border-color: rgba(139,92,246,0.4);
                    box-shadow: 0 0 16px rgba(139,92,246,0.15);
                }

                /* Grid */
                .sf-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }

                /* Card */
                .sf-card {
                    background: rgba(255,255,255,0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 24px;
                    overflow: hidden;
                    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                    position: relative;
                }
                .sf-card:hover {
                    transform: translateY(-6px) scale(1.02);
                    border-color: rgba(139,92,246,0.3);
                    box-shadow: 0 20px 50px rgba(139,92,246,0.15), 0 0 30px rgba(139,92,246,0.08);
                }
                .sf-card-glow {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%);
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                .sf-card:hover .sf-card-glow { opacity: 1; }

                .sf-card-thumb {
                    position: relative;
                    height: 160px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .sf-card-img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                }
                .sf-card-placeholder {
                    font-size: 56px;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
                }
                .sf-card-category {
                    position: absolute;
                    top: 12px; left: 12px;
                    padding: 4px 12px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #fff;
                    font-family: var(--font-heading);
                    letter-spacing: 0.3px;
                }
                .sf-card-episodes {
                    position: absolute;
                    bottom: 10px; right: 12px;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.8);
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                }

                .sf-card-body {
                    padding: 18px 20px 20px;
                }
                .sf-card-title {
                    font-family: var(--font-heading);
                    font-size: 17px;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 6px;
                }
                .sf-card-desc {
                    font-size: 13px;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.4;
                    margin-bottom: 14px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .sf-card-progress {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                .sf-card-progress-bar {
                    flex: 1;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .sf-card-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s;
                }
                .sf-card-progress-text {
                    font-size: 11px;
                    color: rgba(255,255,255,0.4);
                    font-weight: 700;
                    white-space: nowrap;
                }

                .sf-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sf-card-cost {
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 14px;
                    color: #FBBF24;
                }
                .sf-card-free {
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 13px;
                    color: #34D399;
                }
                .sf-card-play {
                    font-size: 13px;
                    color: rgba(139,92,246,0.8);
                    font-weight: 700;
                    transition: color 0.2s;
                }
                .sf-card:hover .sf-card-play { color: #c084fc; }

                /* States */
                .sf-loading, .sf-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 0;
                    color: rgba(255,255,255,0.4);
                    text-align: center;
                }
                .sf-empty h3 { font-size: 20px; color: rgba(255,255,255,0.6); margin-bottom: 8px; font-family: var(--font-heading); }
                .sf-empty p { font-size: 14px; }

                /* Back */
                .sf-back {
                    margin-top: 40px;
                    text-align: center;
                }
                .sf-back-link {
                    color: rgba(255,255,255,0.4);
                    font-size: 14px;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .sf-back-link:hover { color: #c084fc; }

                @media (max-width: 640px) {
                    .sf-hero { flex-direction: column; gap: 16px; padding: 24px 20px; align-items: flex-start; }
                    .sf-hero-title { font-size: 24px; }
                    .sf-hero-icon { font-size: 40px; }
                    .sf-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
