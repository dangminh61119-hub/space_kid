"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
    getSeriesEpisodes, getEpisodeQuiz, getPlayerSeriesProgress,
    markEpisodeWatched, submitQuizAnswers, skipQuizWithCoins,
    type VideoEpisode, type VideoQuizQuestion, type EpisodeProgress,
} from "@/lib/services/video-theater-service";
import { adminGetAllSeries } from "@/lib/services/video-theater-service";
import VideoQuiz from "@/components/theater/VideoQuiz";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";

/** Load YouTube IFrame API once */
function useYouTubeAPI() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if ((window as any).YT?.Player) { setReady(true); return; }
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        (window as any).onYouTubeIframeAPIReady = () => setReady(true);
    }, []);
    return ready;
}

export default function SeriesViewerPage() {
    const params = useParams();
    const seriesId = params?.seriesId as string;
    const { player, spendCoins } = useGame();
    const { playerDbId } = useAuth();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const ytReady = useYouTubeAPI();

    const [episodes, setEpisodes] = useState<VideoEpisode[]>([]);
    const [progress, setProgress] = useState<Record<string, EpisodeProgress>>({});
    const [currentEpIndex, setCurrentEpIndex] = useState(0);
    const [phase, setPhase] = useState<"watch" | "quiz" | "done">("watch");
    const [quizQuestions, setQuizQuestions] = useState<VideoQuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [seriesTitle, setSeriesTitle] = useState("");
    const [videoEnded, setVideoEnded] = useState(false);

    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load data
    useEffect(() => {
        async function load() {
            try {
                const [eps, allSeries] = await Promise.all([
                    getSeriesEpisodes(seriesId),
                    adminGetAllSeries(),
                ]);
                setEpisodes(eps);
                const series = allSeries.find(s => s.id === seriesId);
                if (series) setSeriesTitle(series.title);

                if (playerDbId) {
                    const prog = await getPlayerSeriesProgress(playerDbId, seriesId);
                    setProgress(prog);

                    // Find first unwatched/unquizzed episode
                    const firstUnfinished = eps.findIndex(ep => {
                        const p = prog[ep.id];
                        return !p || !p.quizPassed;
                    });
                    setCurrentEpIndex(firstUnfinished >= 0 ? firstUnfinished : 0);
                }
            } catch (e) {
                console.error("[starflix-viewer] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [seriesId, playerDbId]);

    // Determine phase for current episode
    useEffect(() => {
        if (episodes.length === 0) return;
        const ep = episodes[currentEpIndex];
        if (!ep) return;
        const prog = progress[ep.id];

        if (prog?.quizPassed) {
            // Already completed → show video in done mode (can rewatch)
            setPhase("done");
        } else if (prog?.watched) {
            // Watched but quiz not passed → show quiz
            setPhase("quiz");
        } else {
            setPhase("watch");
        }
        setVideoEnded(false);
    }, [currentEpIndex, progress, episodes]);

    // Set up YouTube player
    useEffect(() => {
        if (!ytReady || episodes.length === 0) return;
        const ep = episodes[currentEpIndex];
        if (!ep) return;

        // Destroy previous
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch { }
        }

        const container = document.getElementById("yt-player-container");
        if (!container) return;

        // Create fresh div
        const div = document.createElement("div");
        div.id = "yt-player";
        container.innerHTML = "";
        container.appendChild(div);

        playerRef.current = new (window as any).YT.Player("yt-player", {
            videoId: ep.youtubeId,
            playerVars: {
                controls: 0,
                disablekb: 1,
                modestbranding: 1,
                rel: 0,
                fs: 0,
                iv_load_policy: 3,
                playsinline: 1,
                autoplay: 0,
            },
            events: {
                onStateChange: (event: any) => {
                    // YT.PlayerState.ENDED = 0
                    if (event.data === 0) {
                        setVideoEnded(true);
                        handleVideoEnded(ep.id);
                    }
                },
            },
        });
    }, [ytReady, currentEpIndex, episodes]);

    const handleVideoEnded = useCallback(async (episodeId: string) => {
        if (!playerDbId) return;
        await markEpisodeWatched(playerDbId, episodeId);
        setProgress(prev => ({
            ...prev,
            [episodeId]: {
                ...prev[episodeId],
                episodeId,
                watched: true,
                quizPassed: prev[episodeId]?.quizPassed ?? false,
                quizSkipCount: prev[episodeId]?.quizSkipCount ?? 0,
            },
        }));
        // Load quiz
        const quiz = await getEpisodeQuiz(episodeId);
        setQuizQuestions(quiz);
        if (quiz.length > 0) {
            setPhase("quiz");
        } else {
            // No quiz → auto pass
            setPhase("done");
        }
    }, [playerDbId]);

    const handleQuizPass = useCallback(async () => {
        const ep = episodes[currentEpIndex];
        if (!ep || !playerDbId) return;
        await submitQuizAnswers(playerDbId, ep.id, quizQuestions.map(q => q.correctIndex));
        setProgress(prev => ({
            ...prev,
            [ep.id]: { ...prev[ep.id], episodeId: ep.id, quizPassed: true, watched: true, quizSkipCount: prev[ep.id]?.quizSkipCount ?? 0 },
        }));
        setPhase("done");
    }, [currentEpIndex, episodes, playerDbId, quizQuestions]);

    const handleQuizSkip = useCallback(async (cost: number) => {
        const ep = episodes[currentEpIndex];
        if (!ep || !playerDbId) return;
        const result = await skipQuizWithCoins(playerDbId, ep.id);
        if (result.cost >= 0) {
            spendCoins(cost);
            setProgress(prev => ({
                ...prev,
                [ep.id]: { episodeId: ep.id, quizPassed: true, watched: true, quizSkipCount: result.newSkipCount },
            }));
            setPhase("done");
        }
    }, [currentEpIndex, episodes, playerDbId, spendCoins]);

    const goToEpisode = (index: number) => {
        const ep = episodes[index];
        if (!ep) return;
        // Can access if: first episode, or previous episode quizPassed, or this episode already has progress
        if (index === 0) { setCurrentEpIndex(index); return; }
        const prevEp = episodes[index - 1];
        const prevProg = progress[prevEp?.id];
        const thisProg = progress[ep.id];
        if (prevProg?.quizPassed || thisProg?.watched) {
            setCurrentEpIndex(index);
        }
    };

    // Start watching
    const startPlayback = () => {
        if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
        }
    };

    // Loading quiz when going to quiz phase
    useEffect(() => {
        if (phase === "quiz" && quizQuestions.length === 0 && episodes[currentEpIndex]) {
            getEpisodeQuiz(episodes[currentEpIndex].id).then(q => setQuizQuestions(q));
        }
    }, [phase, currentEpIndex, episodes, quizQuestions.length]);

    if (authLoading || redirecting || !allowed) {
        return (
            <div style={{ minHeight: "100vh", background: "#060B1E", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                <div style={{ fontSize: 48, animation: "pulse 2s infinite" }}>🌠</div>
            </div>
        );
    }

    const currentEp = episodes[currentEpIndex];

    return (
        <div className="sv-root">
            <StarField count={40} />
            <Navbar />

            <div className="sv-container">
                {/* Breadcrumb */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sv-breadcrumb">
                    <Link href="/portal/starflix" className="sv-bread-link">🌠 StarFlix</Link>
                    <span className="sv-bread-sep">›</span>
                    <span className="sv-bread-current">{seriesTitle || "Đang tải..."}</span>
                </motion.div>

                {loading ? (
                    <div className="sv-loading">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ fontSize: 48 }}>🌠</motion.div>
                        <p>Đang tải phim...</p>
                    </div>
                ) : episodes.length === 0 ? (
                    <div className="sv-empty">
                        <div style={{ fontSize: 48 }}>📡</div>
                        <p>Series này chưa có tập phim nào.</p>
                    </div>
                ) : (
                    <div className="sv-layout">
                        {/* Episode List (sidebar) */}
                        <aside className="sv-sidebar">
                            <h3 className="sv-sidebar-title">📺 Danh sách tập</h3>
                            <div className="sv-ep-list">
                                {episodes.map((ep, i) => {
                                    const prog = progress[ep.id];
                                    const isLocked = i > 0 && !progress[episodes[i - 1]?.id]?.quizPassed && !prog?.watched;
                                    const isCurrent = i === currentEpIndex;
                                    const isDone = prog?.quizPassed;

                                    return (
                                        <button
                                            key={ep.id}
                                            className={`sv-ep-item ${isCurrent ? "current" : ""} ${isDone ? "done" : ""} ${isLocked ? "locked" : ""}`}
                                            onClick={() => !isLocked && goToEpisode(i)}
                                            disabled={isLocked}
                                        >
                                            <div className="sv-ep-badge">
                                                {isDone ? "✅" : isLocked ? "🔒" : isCurrent ? "▶️" : `${i + 1}`}
                                            </div>
                                            <div className="sv-ep-info">
                                                <div className="sv-ep-title">{ep.title}</div>
                                                <div className="sv-ep-duration">
                                                    {Math.floor(ep.durationSeconds / 60)}:{(ep.durationSeconds % 60).toString().padStart(2, "0")}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="sv-main">
                            {/* Video Player */}
                            <div className="sv-player-wrap" ref={containerRef}>
                                <div id="yt-player-container" className="sv-yt-container" />
                                {/* Invisible overlay to block interactions */}
                                <div className="sv-overlay" />

                                {/* Play button overlay */}
                                {!videoEnded && phase === "watch" && (
                                    <button className="sv-play-btn" onClick={startPlayback}>
                                        <span>▶</span>
                                    </button>
                                )}

                                {/* Video ended overlay */}
                                {videoEnded && phase === "watch" && (
                                    <div className="sv-ended-overlay">
                                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="sv-ended-text">
                                            ✅ Đã xem xong!
                                        </motion.div>
                                    </div>
                                )}
                            </div>

                            {/* Episode info */}
                            <div className="sv-ep-header">
                                <h2 className="sv-ep-name">
                                    Tập {currentEpIndex + 1}: {currentEp?.title}
                                </h2>
                                <div className="sv-coins-badge">
                                    🪙 {player.coins.toLocaleString()}
                                </div>
                            </div>

                            {/* Quiz section */}
                            <AnimatePresence mode="wait">
                                {phase === "quiz" && quizQuestions.length > 0 && (
                                    <motion.div
                                        key="quiz"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="sv-quiz-header">
                                            <span>🎯</span>
                                            <span>Trả lời câu hỏi để mở khoá tập tiếp theo!</span>
                                        </div>
                                        <VideoQuiz
                                            questions={quizQuestions}
                                            skipCount={progress[currentEp?.id]?.quizSkipCount ?? 0}
                                            playerCoins={player.coins}
                                            onPass={handleQuizPass}
                                            onSkip={handleQuizSkip}
                                        />
                                    </motion.div>
                                )}

                                {phase === "done" && (
                                    <motion.div
                                        key="done"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="sv-done-section"
                                    >
                                        <div className="sv-done-badge">✅ Đã hoàn thành</div>
                                        {currentEpIndex < episodes.length - 1 && (
                                            <button
                                                className="sv-next-btn"
                                                onClick={() => setCurrentEpIndex(currentEpIndex + 1)}
                                            >
                                                ▶ Xem tập tiếp theo
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </main>
                    </div>
                )}
            </div>

            <style jsx>{`
                .sv-root {
                    min-height: 100vh;
                    background: #060B1E;
                    position: relative;
                    color: #e2e8f0;
                }
                .sv-container {
                    position: relative;
                    z-index: 10;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 100px 24px 60px;
                }

                /* Breadcrumb */
                .sv-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 24px;
                    font-size: 13px;
                }
                .sv-bread-link { color: #8B5CF6; text-decoration: none; font-weight: 700; }
                .sv-bread-link:hover { color: #c084fc; }
                .sv-bread-sep { color: rgba(255,255,255,0.2); }
                .sv-bread-current { color: rgba(255,255,255,0.5); }

                /* Layout */
                .sv-layout {
                    display: flex;
                    gap: 24px;
                }

                /* Sidebar */
                .sv-sidebar {
                    width: 280px;
                    flex-shrink: 0;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 20px;
                    max-height: calc(100vh - 140px);
                    overflow-y: auto;
                    position: sticky;
                    top: 100px;
                }
                .sv-sidebar-title {
                    font-family: var(--font-heading);
                    font-size: 15px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 16px;
                }
                .sv-ep-list { display: flex; flex-direction: column; gap: 6px; }
                .sv-ep-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    background: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    width: 100%;
                }
                .sv-ep-item:hover:not(.locked) {
                    background: rgba(139,92,246,0.06);
                    border-color: rgba(139,92,246,0.15);
                }
                .sv-ep-item.current {
                    background: rgba(139,92,246,0.1);
                    border-color: rgba(139,92,246,0.3);
                    color: #c084fc;
                    box-shadow: 0 0 16px rgba(139,92,246,0.1);
                }
                .sv-ep-item.done { color: rgba(52,211,153,0.7); }
                .sv-ep-item.locked { opacity: 0.3; cursor: not-allowed; }
                .sv-ep-badge {
                    width: 32px; height: 32px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 800;
                    flex-shrink: 0;
                    font-family: var(--font-heading);
                }
                .sv-ep-item.current .sv-ep-badge { background: rgba(139,92,246,0.2); }
                .sv-ep-info { flex: 1; min-width: 0; }
                .sv-ep-title {
                    font-size: 13px;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .sv-ep-duration { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }

                /* Main */
                .sv-main { flex: 1; min-width: 0; }

                /* Player */
                .sv-player-wrap {
                    position: relative;
                    background: #000;
                    border-radius: 20px;
                    overflow: hidden;
                    aspect-ratio: 16/9;
                    margin-bottom: 20px;
                }
                .sv-yt-container {
                    width: 100%;
                    height: 100%;
                }
                .sv-yt-container :global(iframe) {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .sv-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 5;
                    cursor: default;
                }
                .sv-play-btn {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                    width: 72px; height: 72px;
                    border-radius: 50%;
                    background: rgba(139,92,246,0.9);
                    border: 3px solid rgba(255,255,255,0.3);
                    color: #fff;
                    font-size: 28px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s;
                    box-shadow: 0 0 40px rgba(139,92,246,0.5);
                }
                .sv-play-btn:hover {
                    transform: translate(-50%, -50%) scale(1.12);
                    box-shadow: 0 0 60px rgba(139,92,246,0.7);
                }
                .sv-ended-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 10;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .sv-ended-text {
                    font-family: var(--font-heading);
                    font-size: 24px;
                    font-weight: 900;
                    color: #34D399;
                }

                /* Episode info */
                .sv-ep-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .sv-ep-name {
                    font-family: var(--font-heading);
                    font-size: 22px;
                    font-weight: 800;
                    color: #fff;
                }
                .sv-coins-badge {
                    background: rgba(245,158,11,0.1);
                    border: 1px solid rgba(245,158,11,0.2);
                    border-radius: 12px;
                    padding: 8px 16px;
                    font-weight: 800;
                    font-family: var(--font-heading);
                    color: #FBBF24;
                    font-size: 14px;
                }

                /* Quiz header */
                .sv-quiz-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 20px;
                    background: rgba(139,92,246,0.08);
                    border: 1px solid rgba(139,92,246,0.15);
                    border-radius: 16px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #c084fc;
                }

                /* Done */
                .sv-done-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 24px;
                    background: rgba(52,211,153,0.06);
                    border: 1px solid rgba(52,211,153,0.15);
                    border-radius: 16px;
                }
                .sv-done-badge {
                    font-family: var(--font-heading);
                    font-weight: 800;
                    color: #34D399;
                    font-size: 15px;
                }
                .sv-next-btn {
                    margin-left: auto;
                    padding: 12px 24px;
                    border-radius: 14px;
                    border: none;
                    background: linear-gradient(135deg, #8B5CF6, #6366F1);
                    color: #fff;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.25s;
                    box-shadow: 0 4px 16px rgba(139,92,246,0.3);
                }
                .sv-next-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.4); }

                /* States */
                .sv-loading, .sv-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 0;
                    color: rgba(255,255,255,0.4);
                }

                @media (max-width: 768px) {
                    .sv-layout { flex-direction: column; }
                    .sv-sidebar {
                        width: 100%;
                        position: static;
                        max-height: none;
                        order: 2;
                    }
                    .sv-main { order: 1; }
                    .sv-ep-header { flex-direction: column; gap: 8px; align-items: flex-start; }
                }
            `}</style>
        </div>
    );
}
