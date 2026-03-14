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
    isSeriesUnlocked,
    type VideoEpisode, type VideoQuizQuestion, type EpisodeProgress,
} from "@/lib/services/video-theater-service";
import { adminGetAllSeries } from "@/lib/services/video-theater-service";
import { useRouter } from "next/navigation";
import VideoQuiz from "@/components/theater/VideoQuiz";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";

/** YouTube iframe postMessage command helper */
function ytCommand(iframe: HTMLIFrameElement | null, command: string, args?: any) {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: command,
        args: args ? [args] : [],
    }), '*');
}

export default function SeriesViewerPage() {
    const params = useParams();
    const seriesId = params?.seriesId as string;
    const { player, spendCoins } = useGame();
    const { playerDbId } = useAuth();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const router = useRouter();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const playerRef = useRef<any>(null); // keep for compat

    const [episodes, setEpisodes] = useState<VideoEpisode[]>([]);
    const [progress, setProgress] = useState<Record<string, EpisodeProgress>>({});
    const [currentEpIndex, setCurrentEpIndex] = useState(0);
    const [phase, setPhase] = useState<"watch" | "quiz" | "done">("watch");
    const [loading, setLoading] = useState(true);
    const [seriesTitle, setSeriesTitle] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<VideoQuizQuestion[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load series + episodes + progress
    useEffect(() => {
        async function load() {
            try {
                // Get series info
                const allSeries = await adminGetAllSeries();
                const thisSeries = allSeries.find(s => s.id === seriesId);
                if (thisSeries) {
                    setSeriesTitle(thisSeries.title);

                    // Access guard: check if series requires coins and is unlocked
                    if (thisSeries.unlockCost > 0 && playerDbId) {
                        const unlocked = await isSeriesUnlocked(playerDbId, seriesId, thisSeries.unlockCost);
                        if (!unlocked) {
                            router.replace('/portal/starflix');
                            return;
                        }
                    }
                }

                const eps = await getSeriesEpisodes(seriesId);
                setEpisodes(eps);

                if (playerDbId) {
                    const prog = await getPlayerSeriesProgress(playerDbId, seriesId);
                    setProgress(prog);

                    // Start at first unfinished episode
                    const firstUnfinished = eps.findIndex(e => !prog[e.id]?.quizPassed);
                    setCurrentEpIndex(firstUnfinished >= 0 ? firstUnfinished : 0);
                }
            } catch (e) {
                console.error("[starflix-viewer] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [seriesId, playerDbId, router]);

    // Determine phase for current episode
    useEffect(() => {
        if (episodes.length === 0) return;
        const ep = episodes[currentEpIndex];
        if (!ep) return;
        const prog = progress[ep.id];

        if (prog?.quizPassed) {
            setPhase("done");
        } else if (prog?.watched) {
            setPhase("quiz");
        } else {
            setPhase("watch");
        }
        setVideoEnded(false);
        setPlayerReady(false);
        setIsPlaying(false);
        setQuizQuestions([]); // Reset quiz for new episode
    }, [currentEpIndex, progress, episodes]);

    // Auto-load quiz questions when phase changes to "quiz"
    useEffect(() => {
        if (phase !== "quiz") return;
        const ep = episodes[currentEpIndex];
        if (!ep || quizQuestions.length > 0) return; // Already loaded
        (async () => {
            const quiz = await getEpisodeQuiz(ep.id);
            setQuizQuestions(quiz);
            if (quiz.length === 0) {
                // No quiz for this episode → auto pass
                setPhase("done");
            }
        })();
    }, [phase, currentEpIndex, episodes]);

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
            setPhase("done");
        }
    }, [playerDbId]);

    // Listen for YouTube iframe postMessage events
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.origin !== 'https://www.youtube.com') return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.event === 'onReady') {
                    setPlayerReady(true);
                }
                if (data.event === 'onStateChange') {
                    const state = data.info;
                    if (state === 1) {
                        setIsPlaying(true);
                        setVideoEnded(false);
                    } else if (state === 2) {
                        setIsPlaying(false);
                    } else if (state === 0) {
                        setIsPlaying(false);
                        setVideoEnded(true);
                        const ep = episodes[currentEpIndex];
                        if (ep) handleVideoEnded(ep.id);
                    }
                }
                if (data.event === 'initialDelivery' || data.info?.playerState !== undefined) {
                    const state = data.info?.playerState;
                    if (state === 1) { setIsPlaying(true); setVideoEnded(false); }
                    else if (state === 2) { setIsPlaying(false); }
                    else if (state === 0) { setIsPlaying(false); setVideoEnded(true); }
                }
            } catch { /* not a YouTube message */ }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [episodes, currentEpIndex, handleVideoEnded]);

    // When iframe loads, tell YouTube to send us state change events
    const handleIframeLoad = useCallback(() => {
        setPlayerReady(true);
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'listening',
                id: 'yt-player',
            }), '*');
        }
    }, []);

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

    // Start / pause / resume — use postMessage to talk to YouTube iframe
    const startPlayback = () => {
        ytCommand(iframeRef.current, 'playVideo');
        // Optimistic state update
        setTimeout(() => setIsPlaying(true), 500);
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            ytCommand(iframeRef.current, 'pauseVideo');
            setIsPlaying(false);
        } else {
            ytCommand(iframeRef.current, 'playVideo');
            setIsPlaying(true);
        }
    };

    const toggleFullscreen = () => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    // Auto-hide controls after 3s of inactivity when playing
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        if (isPlaying) {
            controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) setShowControls(true);
        else resetControlsTimer();
    }, [isPlaying, resetControlsTimer]);

    // Listen for fullscreen exit via Escape
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

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
                            <div className={`sv-player-wrap ${isFullscreen ? 'fullscreen' : ''}`} ref={wrapperRef} onMouseMove={resetControlsTimer}>
                                {currentEp && (
                                    <iframe
                                        ref={iframeRef}
                                        id="yt-player"
                                        className="sv-yt-container"
                                        src={`https://www.youtube.com/embed/${currentEp.youtubeId}?enablejsapi=1&controls=0&disablekb=1&modestbranding=1&rel=0&fs=0&iv_load_policy=3&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen={false}
                                        onLoad={handleIframeLoad}
                                        style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                    />
                                )}

                                {/* Click overlay: only show when playing (for pause toggle) */}
                                {isPlaying && (
                                    <div className="sv-overlay" onClick={togglePlayPause} />
                                )}

                                {/* Initial play button — only before first play */}
                                {!isPlaying && !videoEnded && phase === "watch" && (
                                    <button className="sv-play-btn" onClick={startPlayback}>
                                        <span>▶</span>
                                    </button>
                                )}

                                {/* Pause icon flash (shows briefly when paused mid-video) */}
                                {!isPlaying && playerReady && !videoEnded && phase === "watch" && (
                                    <div className="sv-pause-indicator">
                                        <span>⏸</span>
                                    </div>
                                )}

                                {/* Video ended overlay */}
                                {videoEnded && phase === "watch" && (
                                    <div className="sv-ended-overlay">
                                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="sv-ended-text">
                                            ✅ Đã xem xong!
                                        </motion.div>
                                    </div>
                                )}

                                {/* Skip to quiz button for already-watched episodes */}
                                {phase === "watch" && !isPlaying && !videoEnded && progress[currentEp?.id]?.watched && (
                                    <div className="sv-skip-quiz-overlay">
                                        <button className="sv-skip-quiz-btn" onClick={() => {
                                            const ep = episodes[currentEpIndex];
                                            if (ep) handleVideoEnded(ep.id);
                                        }}>
                                            🎯 Đã xem rồi — Đi tới câu hỏi
                                        </button>
                                    </div>
                                )}

                                {/* Bottom control bar */}
                                <div className={`sv-controls ${showControls || !isPlaying ? 'visible' : ''}`}>
                                    <button className="sv-ctrl-btn" onClick={togglePlayPause} title={isPlaying ? 'Tạm dừng' : 'Phát'}>
                                        {isPlaying ? '⏸' : '▶️'}
                                    </button>
                                    <div className="sv-ctrl-spacer" />
                                    <button className="sv-ctrl-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
                                        {isFullscreen ? '⛶' : '⛶'}
                                    </button>
                                </div>
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

                            {/* Manual "Done watching" button — always visible during watch phase */}
                            {phase === "watch" && currentEp && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="sv-done-watching-section"
                                >
                                    <button
                                        className="sv-done-watching-btn"
                                        onClick={() => handleVideoEnded(currentEp.id)}
                                    >
                                        🎯 Xem xong — Làm câu hỏi
                                    </button>
                                    <p className="sv-done-watching-hint">
                                        Bấm khi đã xem xong video để chuyển sang phần câu hỏi
                                    </p>
                                </motion.div>
                            )}

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
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%;
                    height: 100%;
                }
                .sv-yt-container :global(iframe) {
                    width: 100% !important;
                    height: 100% !important;
                    border: none;
                }
                .sv-player-wrap.fullscreen {
                    border-radius: 0;
                }
                .sv-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 40px;
                    z-index: 5;
                    cursor: pointer;
                    background: transparent;
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

                /* Skip to quiz button for already-watched episodes */
                .sv-skip-quiz-overlay {
                    position: absolute;
                    bottom: 60px; left: 0; right: 0;
                    z-index: 12;
                    display: flex;
                    justify-content: center;
                    pointer-events: none;
                }
                .sv-skip-quiz-btn {
                    pointer-events: all;
                    padding: 10px 24px;
                    border-radius: 14px;
                    border: 1px solid rgba(245,158,11,0.4);
                    background: rgba(245,158,11,0.15);
                    backdrop-filter: blur(8px);
                    color: #FBBF24;
                    font-family: var(--font-heading);
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                }
                .sv-skip-quiz-btn:hover {
                    background: rgba(245,158,11,0.25);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(245,158,11,0.2);
                }

                /* Manual "Done watching" button below video */
                .sv-done-watching-section {
                    text-align: center;
                    padding: 16px 0;
                    margin-bottom: 8px;
                }
                .sv-done-watching-btn {
                    padding: 14px 32px;
                    border-radius: 16px;
                    border: 2px solid rgba(245,158,11,0.5);
                    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08));
                    color: #FBBF24;
                    font-family: var(--font-heading);
                    font-weight: 900;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.25s;
                    box-shadow: 0 4px 20px rgba(245,158,11,0.15);
                }
                .sv-done-watching-btn:hover {
                    background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.12));
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(245,158,11,0.25);
                    border-color: rgba(245,158,11,0.7);
                }
                .sv-done-watching-hint {
                    font-size: 12px;
                    color: rgba(255,255,255,0.3);
                    margin-top: 8px;
                }

                /* Pause indicator */
                .sv-pause-indicator {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 8;
                    font-size: 48px;
                    opacity: 0.7;
                    pointer-events: none;
                    filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
                }

                /* Bottom control bar */
                .sv-controls {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    z-index: 15;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: linear-gradient(transparent, rgba(0,0,0,0.85));
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .sv-controls.visible { opacity: 1; }
                .sv-player-wrap:hover .sv-controls { opacity: 1; }
                .sv-ctrl-btn {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    backdrop-filter: blur(4px);
                }
                .sv-ctrl-btn:hover {
                    background: rgba(139,92,246,0.4);
                    transform: scale(1.1);
                }
                .sv-ctrl-spacer { flex: 1; }

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
