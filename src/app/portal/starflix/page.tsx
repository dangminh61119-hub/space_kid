"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getAllVideoSeries, getPlayerSeriesProgress, getPlayerUnlockedSeries, unlockSeriesWithCoins, type VideoSeries } from "@/lib/services/video-theater-service";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";

const ITEMS_PER_PAGE = 6;

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    english: { label: "Tiếng Anh", emoji: "🌍", color: "#3B82F6" },
    math: { label: "Toán học", emoji: "🔢", color: "#F59E0B" },
    science: { label: "Khoa học", emoji: "🔬", color: "#8B5CF6" },
};

export default function StarFlixPage() {
    const { player, spendCoins } = useGame();
    const { playerDbId } = useAuth();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const router = useRouter();
    const [series, setSeries] = useState<VideoSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [progressMap, setProgressMap] = useState<Record<string, { watched: number; total: number }>>({});
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set());
    const [unlockModal, setUnlockModal] = useState<VideoSeries | null>(null);
    const [unlocking, setUnlocking] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getAllVideoSeries();
                setSeries(data);

                // Load progress + unlock status
                if (playerDbId) {
                    const [map2, unlocked] = await Promise.all([
                        (async () => {
                            const m: Record<string, { watched: number; total: number }> = {};
                            for (const s of data) {
                                const progress = await getPlayerSeriesProgress(playerDbId, s.id);
                                const watchedCount = Object.values(progress).filter(p => p.quizPassed).length;
                                m[s.id] = { watched: watchedCount, total: s.episodeCount || 0 };
                            }
                            return m;
                        })(),
                        getPlayerUnlockedSeries(playerDbId),
                    ]);
                    setProgressMap(map2);
                    setUnlockedSet(unlocked);
                }
            } catch (e) {
                console.error("[starflix] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [playerDbId]);

    // Filter + search + paginate
    const filteredSeries = useMemo(() => {
        let result = series;
        if (filter !== "all") result = result.filter(s => s.category === filter);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            );
        }
        return result;
    }, [series, filter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredSeries.length / ITEMS_PER_PAGE));
    const paginatedSeries = filteredSeries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset page when filter/search changes
    useEffect(() => { setCurrentPage(1); }, [filter, searchQuery]);

    const handleCardClick = (s: VideoSeries) => {
        const isFree = s.unlockCost <= 0;
        const isUnlocked = unlockedSet.has(s.id);
        if (isFree || isUnlocked) {
            router.push(`/portal/starflix/${s.id}`);
        } else {
            setUnlockModal(s);
        }
    };

    const handleUnlock = async () => {
        if (!unlockModal || !playerDbId || unlocking) return;
        if (player.coins < unlockModal.unlockCost) return;
        setUnlocking(true);
        try {
            const ok = await unlockSeriesWithCoins(playerDbId, unlockModal.id, unlockModal.unlockCost);
            if (ok) {
                spendCoins(unlockModal.unlockCost);
                setUnlockedSet(prev => new Set([...prev, unlockModal.id]));
                setUnlockModal(null);
                router.push(`/portal/starflix/${unlockModal.id}`);
            }
        } catch (e) {
            console.error("[starflix] unlock error:", e);
        } finally {
            setUnlocking(false);
        }
    };

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

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="sf-search-wrap"
                >
                    <span className="sf-search-icon">🔍</span>
                    <input
                        type="text"
                        className="sf-search-input"
                        placeholder="Tìm kiếm phim theo tên hoặc mô tả..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="sf-search-clear" onClick={() => setSearchQuery("")}>
                            ✕
                        </button>
                    )}
                </motion.div>

                {/* Result count */}
                {!loading && (
                    <div className="sf-result-count">
                        {filteredSeries.length} series{searchQuery ? ` cho "${searchQuery}"` : ''}
                        {filter !== 'all' ? ` • ${CATEGORY_CONFIG[filter]?.label}` : ''}
                    </div>
                )}

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
                        <h3>{searchQuery ? 'Không tìm thấy' : 'Chưa có phim nào'}</h3>
                        <p>{searchQuery ? `Không tìm thấy phim nào cho "${searchQuery}"` : 'Rạp chiếu đang được chuẩn bị. Quay lại sau nhé!'}</p>
                        {searchQuery && (
                            <button className="sf-empty-clear" onClick={() => setSearchQuery("")}>Xoá tìm kiếm</button>
                        )}
                    </div>
                ) : (
                    <>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                        className="sf-grid"
                    >
                        {paginatedSeries.map((s) => {
                            const cfg = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.english;
                            const prog = progressMap[s.id];
                            const progressPct = prog && prog.total > 0 ? Math.round((prog.watched / prog.total) * 100) : 0;
                            const isFree = s.unlockCost <= 0;
                            const isUnlocked = isFree || unlockedSet.has(s.id);

                            return (
                                <motion.div
                                    key={s.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                                    }}
                                >
                                    <div onClick={() => handleCardClick(s)} style={{ cursor: "pointer" }}>
                                        <div className={`sf-card ${!isUnlocked ? 'locked' : ''}`}>
                                            {/* Lock overlay */}
                                            {!isUnlocked && (
                                                <div className="sf-card-lock-overlay">
                                                    <div className="sf-card-lock-icon">🔒</div>
                                                    <div className="sf-card-lock-cost">🪙 {s.unlockCost}</div>
                                                </div>
                                            )}
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
                                                {isUnlocked && prog && prog.total > 0 && (
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
                                                    {isFree ? (
                                                        <span className="sf-card-free">✨ Miễn phí</span>
                                                    ) : isUnlocked ? (
                                                        <span className="sf-card-free">✅ Đã mở khóa</span>
                                                    ) : (
                                                        <span className="sf-card-cost">🪙 {s.unlockCost}</span>
                                                    )}
                                                    <span className="sf-card-play">{isUnlocked ? 'Xem ngay →' : 'Mở khoá →'}</span>
                                                </div>
                                            </div>

                                            {/* Hover glow */}
                                            <div className="sf-card-glow" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="sf-pagination">
                            <button
                                className="sf-page-btn"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                ← Trước
                            </button>
                            <div className="sf-page-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`sf-page-num ${page === currentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="sf-page-btn"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Tiếp →
                            </button>
                        </div>
                    )}
                    </>
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

                {/* Unlock Confirmation Modal */}
                <AnimatePresence>
                    {unlockModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="sf-modal-overlay"
                            onClick={() => !unlocking && setUnlockModal(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="sf-modal"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="sf-modal-icon">🔓</div>
                                <h3 className="sf-modal-title">Mở khoá "{unlockModal.title}"?</h3>
                                <p className="sf-modal-desc">
                                    Series này có {unlockModal.episodeCount} tập phim. Bạn cần trả coins để mở khoá.
                                </p>
                                <div className="sf-modal-cost">
                                    <span>Chi phí:</span>
                                    <span className="sf-modal-price">🪙 {unlockModal.unlockCost}</span>
                                </div>
                                <div className="sf-modal-balance">
                                    <span>Số dư:</span>
                                    <span style={{ color: player.coins >= unlockModal.unlockCost ? '#34D399' : '#EF4444' }}>
                                        🪙 {player.coins.toLocaleString()}
                                    </span>
                                </div>
                                {player.coins < unlockModal.unlockCost && (
                                    <p className="sf-modal-warn">⚠️ Không đủ coins! Cần thêm {unlockModal.unlockCost - player.coins} coins.</p>
                                )}
                                <div className="sf-modal-actions">
                                    <button
                                        className="sf-modal-btn sf-modal-cancel"
                                        onClick={() => setUnlockModal(null)}
                                        disabled={unlocking}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className="sf-modal-btn sf-modal-confirm"
                                        onClick={handleUnlock}
                                        disabled={player.coins < unlockModal.unlockCost || unlocking}
                                    >
                                        {unlocking ? 'Đang mở...' : '🔓 Mở khoá'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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

                /* Locked card */
                .sf-card.locked .sf-card-thumb { filter: grayscale(0.5) brightness(0.6); }
                .sf-card-lock-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 5;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border-radius: 24px;
                    pointer-events: none;
                }
                .sf-card-lock-icon { font-size: 36px; filter: drop-shadow(0 0 12px rgba(0,0,0,0.5)); }
                .sf-card-lock-cost {
                    font-family: var(--font-heading);
                    font-weight: 900;
                    font-size: 16px;
                    color: #FBBF24;
                    background: rgba(0,0,0,0.5);
                    padding: 4px 14px;
                    border-radius: 10px;
                    backdrop-filter: blur(4px);
                }

                /* Unlock Modal */
                .sf-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .sf-modal {
                    background: #0f1225;
                    border: 1px solid rgba(139,92,246,0.2);
                    border-radius: 24px;
                    padding: 32px;
                    width: 400px;
                    max-width: 90vw;
                    text-align: center;
                }
                .sf-modal-icon { font-size: 48px; margin-bottom: 12px; }
                .sf-modal-title { font-family: var(--font-heading); font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 8px; }
                .sf-modal-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px; line-height: 1.5; }
                .sf-modal-cost, .sf-modal-balance {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 16px;
                    border-radius: 12px;
                    margin-bottom: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    background: rgba(255,255,255,0.03);
                }
                .sf-modal-cost span:first-child, .sf-modal-balance span:first-child { color: rgba(255,255,255,0.5); }
                .sf-modal-price { color: #FBBF24; font-family: var(--font-heading); font-weight: 900; }
                .sf-modal-warn { color: #EF4444; font-size: 12px; margin-top: 8px; margin-bottom: 4px; }
                .sf-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
                .sf-modal-btn {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 14px;
                    border: none;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .sf-modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .sf-modal-cancel {
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.6);
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .sf-modal-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
                .sf-modal-confirm {
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    color: #000;
                    box-shadow: 0 4px 16px rgba(245,158,11,0.3);
                }
                .sf-modal-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.4); }

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

                /* Search Bar */
                .sf-search-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    padding: 10px 16px;
                    margin-bottom: 12px;
                    transition: border-color 0.2s;
                }
                .sf-search-wrap:focus-within {
                    border-color: rgba(139,92,246,0.4);
                    background: rgba(255,255,255,0.06);
                }
                .sf-search-icon { font-size: 18px; opacity: 0.5; flex-shrink: 0; }
                .sf-search-input {
                    flex: 1;
                    background: none;
                    border: none;
                    outline: none;
                    color: #e2e8f0;
                    font-size: 14px;
                    font-family: inherit;
                }
                .sf-search-input::placeholder { color: rgba(255,255,255,0.25); }
                .sf-search-clear {
                    background: rgba(255,255,255,0.08);
                    border: none;
                    color: rgba(255,255,255,0.5);
                    width: 24px; height: 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .sf-search-clear:hover { background: rgba(255,255,255,0.15); color: #fff; }

                /* Result count */
                .sf-result-count {
                    font-size: 12px;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 16px;
                    padding-left: 4px;
                }

                /* Pagination */
                .sf-pagination {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 32px;
                    padding: 16px 0;
                }
                .sf-page-numbers { display: flex; gap: 4px; }
                .sf-page-btn {
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.04);
                    color: rgba(255,255,255,0.6);
                    font-size: 13px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sf-page-btn:hover:not(:disabled) { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3); color: #c084fc; }
                .sf-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .sf-page-num {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.03);
                    color: rgba(255,255,255,0.5);
                    font-size: 13px;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex; align-items: center; justify-content: center;
                }
                .sf-page-num:hover { background: rgba(139,92,246,0.1); color: #c084fc; }
                .sf-page-num.active {
                    background: linear-gradient(135deg, #8B5CF6, #6366F1);
                    color: #fff;
                    border-color: transparent;
                    box-shadow: 0 4px 12px rgba(139,92,246,0.3);
                }

                /* Empty state clear */
                .sf-empty-clear {
                    margin-top: 16px;
                    padding: 10px 24px;
                    border-radius: 12px;
                    border: 1px solid rgba(139,92,246,0.3);
                    background: rgba(139,92,246,0.08);
                    color: #c084fc;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .sf-empty-clear:hover { background: rgba(139,92,246,0.15); }

                @media (max-width: 640px) {
                    .sf-hero { flex-direction: column; gap: 16px; padding: 24px 20px; align-items: flex-start; }
                    .sf-hero-title { font-size: 24px; }
                    .sf-hero-icon { font-size: 40px; }
                    .sf-grid { grid-template-columns: 1fr; }
                    .sf-pagination { flex-wrap: wrap; }
                }
            `}</style>
        </div>
    );
}
