"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import VolumeControl from "./VolumeControl";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import {
    createRoom,
    joinRoom,
    getRaceQuestions,
    subscribeToRaceRoom,
    broadcastRaceStart,
    broadcastQuestion,
    broadcastAnswer,
    broadcastQuestionResults,
    broadcastRaceFinished,
    broadcastJoinRejected,
    updateRoomStatus,
    saveRaceResult,
    type RaceQuestion,
    type RacePlayer,
    type AnswerEvent,
    type RaceRoom,
} from "@/lib/services/race-service";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameLevel } from "@/lib/services/db";

/* ═══════════════════════════════════════════════
 * StarRaceGame — Real-Time Multiplayer Quiz Race
 * ═══════════════════════════════════════════════ */

const SHIP_OPTIONS = [
    { emoji: "🚀", name: "Tên lửa", color: "#00F5FF" },
    { emoji: "🛸", name: "Đĩa bay", color: "#FF00FF" },
    { emoji: "🚁", name: "Trực thăng", color: "#4ADE80" },
    { emoji: "✈️", name: "Máy bay", color: "#FB923C" },
    { emoji: "🛩️", name: "Phi cơ", color: "#A78BFA" },
];

const POINTS_BY_RANK = [100, 80, 60, 40, 20];
const QUESTION_TIME_SECONDS = 10;
const MAX_PLAYERS = 6;

/* ─── Race Track Visualization ─── */
function RaceTrack({ players, totalScores, maxScore, currentPlayerId }: {
    players: RacePlayer[];
    totalScores: Record<string, number>;
    maxScore: number;
    currentPlayerId: string | null;
}) {
    const sorted = [...players]
        .map(p => ({ ...p, score: totalScores[p.playerId] || 0 }))
        .sort((a, b) => b.score - a.score);

    return (
        <div className="w-full mb-4 glass-card !rounded-2xl !p-3 overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(0,10,30,0.8), rgba(0,20,50,0.6))" }}>
            {/* Track header */}
            <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest mb-2 px-1">
                <span>Xuất phát</span>
                <span>🏁 Đích</span>
            </div>
            {/* Lanes */}
            <div className="space-y-1.5">
                {sorted.map((p, i) => {
                    const progress = maxScore > 0 ? (p.score / maxScore) * 100 : 0;
                    const isMe = p.playerId === currentPlayerId;
                    const shipInfo = SHIP_OPTIONS.find(s => s.emoji === p.emoji) || SHIP_OPTIONS[0];

                    return (
                        <div key={p.playerId} className="relative">
                            {/* Lane background */}
                            <div className="h-10 rounded-lg relative overflow-hidden"
                                style={{
                                    background: isMe
                                        ? "linear-gradient(90deg, rgba(0,245,255,0.1), rgba(0,245,255,0.03))"
                                        : "rgba(255,255,255,0.03)",
                                    border: isMe ? "1px solid rgba(0,245,255,0.3)" : "1px solid rgba(255,255,255,0.05)",
                                }}>
                                {/* Progress trail */}
                                <motion.div
                                    className="absolute top-0 left-0 h-full rounded-lg"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                    style={{
                                        background: `linear-gradient(90deg, ${shipInfo.color}33, ${shipInfo.color}11)`,
                                    }}
                                />
                                {/* Ship + info */}
                                <motion.div
                                    className="absolute top-0 h-full flex items-center"
                                    initial={{ left: "0%" }}
                                    animate={{ left: `${Math.min(Math.max(progress - 5, 0), 85)}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                >
                                    <div className="flex items-center gap-1.5 px-2">
                                        <span className="text-xl" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))" }}>
                                            {p.emoji}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold leading-none ${isMe ? "text-neon-cyan" : "text-white/70"}`}>
                                                {p.name.length > 8 ? p.name.slice(0, 8) + ".." : p.name}
                                            </span>
                                            <span className="text-[9px] text-neon-gold font-mono">{p.score}đ</span>
                                        </div>
                                    </div>
                                </motion.div>
                                {/* Rank badge */}
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs">
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Star particles decoration */}
            <div className="flex justify-between mt-1 px-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[2px] h-[2px] rounded-full bg-white/20" />
                ))}
            </div>
        </div>
    );
}

type GamePhase = "ship-select" | "lobby" | "countdown" | "racing" | "question-result" | "podium";

interface StarRaceGameProps {
    levels: GameLevel[];
    onExit: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete: (score: number, levelsCompleted: number) => void;
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    journeySlug?: string;
}

export default function StarRaceGame({
    onExit,
    onGameComplete,
    onAnswered,
    journeySlug = "race-alpha",
}: StarRaceGameProps) {
    const { player, addStars } = useGame();
    const { playerDbId } = useAuth();
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();

    // Game state
    const [phase, setPhase] = useState<GamePhase>("ship-select");
    const [selectedShip, setSelectedShip] = useState(SHIP_OPTIONS[0]);
    const [roomCode, setRoomCode] = useState("");
    const [inputCode, setInputCode] = useState("");
    const [room, setRoom] = useState<RaceRoom | null>(null);
    const [players, setPlayers] = useState<RacePlayer[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState("");


    // Racing state
    const [questions, setQuestions] = useState<RaceQuestion[]>([]);
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<RaceQuestion | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
    const [answered, setAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerOrder, setAnswerOrder] = useState<AnswerEvent[]>([]); // answers for current question
    const [totalScores, setTotalScores] = useState<Record<string, number>>({});
    const [countdownNum, setCountdownNum] = useState(3);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    // Final results
    const [finalRanking, setFinalRanking] = useState<RacePlayer[]>([]);

    // Refs for channel
    const channelRef = useRef<RealtimeChannel | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const questionStartRef = useRef<number>(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubRef.current?.();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    /* ─── Realtime Callbacks ─── */
    const handlePlayersUpdate = useCallback((updatedPlayers: RacePlayer[]) => {
        // Enforce player limit: if I just joined and room is full, disconnect
        if (updatedPlayers.length > MAX_PLAYERS && !isHost) {
            const isNewJoiner = !players.some(p => p.playerId === playerDbId) &&
                updatedPlayers.some(p => p.playerId === playerDbId);
            if (isNewJoiner || updatedPlayers.length > MAX_PLAYERS) {
                setError(`Phòng đã đầy! (tối đa ${MAX_PLAYERS} người)`);
                unsubRef.current?.();
                setPhase("ship-select");
                return;
            }
        }
        setPlayers(updatedPlayers);
    }, [isHost, players, playerDbId]);

    // Joiner: kicked by host
    const handleJoinRejectedReceived = useCallback((rejectedPlayerId: string) => {
        if (rejectedPlayerId === playerDbId) {
            setError("Chủ phòng đã loại bạn khỏi phòng đua.");
            unsubRef.current?.();
            setPhase("ship-select");
        }
    }, [playerDbId]);

    const handleRaceStart = useCallback((qs: RaceQuestion[]) => {
        setQuestions(qs);
        setPhase("countdown");
        setCountdownNum(3);
    }, []);

    const handleQuestion = useCallback((q: RaceQuestion, idx: number) => {
        setCurrentQuestion(q);
        setCurrentQIdx(idx);
        setAnswered(false);
        setSelectedAnswer(null);
        setAnswerOrder([]);
        setTimeLeft(QUESTION_TIME_SECONDS);
        questionStartRef.current = Date.now();

        // Shuffle answers
        const opts = [q.correct_answer, ...q.wrong_answers].sort(() => Math.random() - 0.5);
        setShuffledOptions(opts);
        setPhase("racing");

        // Start countdown timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleAnswerEvent = useCallback((event: AnswerEvent) => {
        setAnswerOrder((prev) => [...prev, event]);
    }, []);

    const handleQuestionResults = useCallback((scores: Record<string, number>) => {
        setTotalScores(scores);
        setPhase("question-result");
    }, []);

    const handleRaceFinished = useCallback((finalPlayers: RacePlayer[]) => {
        setFinalRanking(finalPlayers);
        setPhase("podium");
        stopBGM();

        // Save own result + award stars if won
        if (room && playerDbId) {
            const me = finalPlayers.find((p) => p.playerId === playerDbId);
            if (me) {
                const myRank = finalPlayers.indexOf(me) + 1;
                saveRaceResult(
                    room.id,
                    playerDbId,
                    me.score,
                    me.correctCount,
                    questions.length,
                    myRank,
                    selectedShip.emoji,
                );
                // ⭐ Rank 1 wins 3 stars!
                if (myRank === 1) {
                    addStars(3);
                    playCorrect(); // fanfare khi thắng
                }
            }
        }
    }, [room, playerDbId, questions.length, selectedShip.emoji, addStars, stopBGM, playCorrect]);

    /* ─── Connect to Room ─── */
    const connectToRoom = useCallback(
        (roomData: RaceRoom, hostFlag: boolean) => {
            if (!playerDbId) return;
            setRoom(roomData);
            setRoomCode(roomData.room_code);
            setIsHost(hostFlag);

            const sub = subscribeToRaceRoom(
                roomData.room_code,
                {
                    playerId: playerDbId,
                    name: player.name || "Tân Binh",
                    emoji: selectedShip.emoji,
                    isHost: hostFlag,
                },
                {
                    onPlayersUpdate: handlePlayersUpdate,
                    onRaceStart: handleRaceStart,
                    onQuestion: handleQuestion,
                    onAnswer: handleAnswerEvent,
                    onQuestionResults: handleQuestionResults,
                    onRaceFinished: handleRaceFinished,
                    onJoinRejected: handleJoinRejectedReceived,
                },
            );

            if (sub) {
                channelRef.current = sub.channel;
                unsubRef.current = sub.unsubscribe;
            }

            setPhase("lobby");
            playBGM(); // BGM khi vào lobby phòng đua
        },
        [playerDbId, player.name, selectedShip.emoji, handlePlayersUpdate, handleRaceStart, handleQuestion, handleAnswerEvent, handleQuestionResults, handleRaceFinished, handleJoinRejectedReceived, playBGM],
    );

    /* ─── Create Room ─── */
    const handleCreateRoom = async () => {
        if (!playerDbId) return;
        setError("");
        const roomData = await createRoom(playerDbId, journeySlug, 5);
        if (!roomData) {
            setError("Không thể tạo phòng. Thử lại!");
            return;
        }
        connectToRoom(roomData, true);
    };

    /* ─── Join Room ─── */
    const handleJoinRoom = async () => {
        if (!inputCode.trim()) {
            setError("Nhập mã phòng!");
            return;
        }
        setError("");
        const roomData = await joinRoom(inputCode.trim());
        if (!roomData) {
            setError("Phòng không tồn tại hoặc đã bắt đầu!");
            return;
        }
        // Check player limit via presence count
        connectToRoom(roomData, false);
    };

    /* ─── Host: Kick Player ─── */
    const handleKickPlayer = (playerId: string) => {
        if (!channelRef.current) return;
        broadcastJoinRejected(channelRef.current, playerId);
    };

    /* ─── Start Race (host only) ─── */
    const handleStartRace = async () => {
        if (!room || !channelRef.current || !isHost) return;

        const qs = await getRaceQuestions(journeySlug, player.grade, 5);
        if (qs.length === 0) {
            setError("Không tìm thấy câu hỏi!");
            return;
        }

        await updateRoomStatus(room.id, "racing");
        broadcastRaceStart(channelRef.current, qs);
    };

    /* ─── Countdown Effect ─── */
    useEffect(() => {
        if (phase !== "countdown") return;
        if (countdownNum <= 0) {
            // Start first question
            if (isHost && questions.length > 0) {
                broadcastQuestion(channelRef.current!, questions[0], 0, questions.length);
            }
            return;
        }
        const t = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, countdownNum, isHost, questions]);

    /* ─── Handle Answer Submission ─── */
    const handleSelectAnswer = (answer: string) => {
        if (answered || !currentQuestion || !channelRef.current || !playerDbId) return;

        setAnswered(true);
        setSelectedAnswer(answer);
        if (timerRef.current) clearInterval(timerRef.current);

        const timeMs = Date.now() - questionStartRef.current;
        const isCorrect = answer === currentQuestion.correct_answer;

        // Play sound feedback
        if (isCorrect) {
            playCorrect();
        } else {
            playWrong();
        }

        // Calculate rank-based points
        const correctBefore = answerOrder.filter((a) => a.isCorrect).length;
        const rank = isCorrect ? correctBefore : -1;
        const points = isCorrect ? (POINTS_BY_RANK[rank] || 20) : 0;

        const event: AnswerEvent = {
            playerId: playerDbId,
            playerName: player.name || "Tân Binh",
            answer,
            isCorrect,
            timeMs,
            points,
        };

        broadcastAnswer(channelRef.current, event);

        // Track answer for learning analytics
        onAnswered?.(currentQuestion.id, isCorrect, currentQuestion.subject, 1);
    };

    /* ─── Time's up: auto-submit no answer ─── */
    useEffect(() => {
        if (phase === "racing" && timeLeft === 0 && !answered) {
            handleSelectAnswer("__timeout__");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, phase, answered]);

    /* ─── Host: Process answers + advance questions ─── */
    useEffect(() => {
        if (phase !== "racing" || !isHost || !channelRef.current) return;

        // When all players answered (or time expired), show results after a delay
        const allAnswered = players.length > 0 && answerOrder.length >= players.length;
        const timeExpired = timeLeft === 0;

        if (allAnswered || timeExpired) {
            const timeout = setTimeout(() => {
                // Calculate updated scores
                const newScores = { ...totalScores };
                for (const a of answerOrder) {
                    newScores[a.playerId] = (newScores[a.playerId] || 0) + a.points;
                }

                broadcastQuestionResults(channelRef.current!, newScores);

                // After showing results for 3s, next question or finish
                setTimeout(() => {
                    const nextIdx = currentQIdx + 1;
                    if (nextIdx < questions.length) {
                        broadcastQuestion(channelRef.current!, questions[nextIdx], nextIdx, questions.length);
                    } else {
                        // Race finished
                        const finalPlayers: RacePlayer[] = players.map((p) => ({
                            ...p,
                            score: newScores[p.playerId] || 0,
                        }));
                        finalPlayers.sort((a, b) => b.score - a.score);
                        broadcastRaceFinished(channelRef.current!, finalPlayers);
                        if (room) updateRoomStatus(room.id, "finished");
                    }
                }, 3000);
            }, timeExpired ? 500 : 0);
            return () => clearTimeout(timeout);
        }
    }, [answerOrder.length, players.length, timeLeft, phase, isHost, currentQIdx, questions, totalScores, room]);

    /* ─── Handle Exit ─── */
    const handleExit = () => {
        unsubRef.current?.();
        if (phase === "podium") {
            const myScore = totalScores[playerDbId || ""] || 0;
            onGameComplete(myScore, myScore > 0 ? 1 : 0);
        }
        onExit();
    };

    // ══════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════

    /* ─── Phase 1: Ship Select ─── */
    if (phase === "ship-select") {
        return (
            <div className="w-full max-w-lg mx-auto p-6 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-3xl font-bold text-white mb-2 font-[var(--font-heading)]">
                        ☀️ Cuộc Đua Giữa Các Vì Sao
                    </h2>
                    <p className="text-white/50 text-sm mb-6">Chọn phi thuyền của bạn!</p>

                    <div className="grid grid-cols-5 gap-3 mb-8">
                        {SHIP_OPTIONS.map((ship) => (
                            <button
                                key={ship.emoji}
                                onClick={() => setSelectedShip(ship)}
                                className={`p-3 rounded-2xl transition-all duration-300 ${selectedShip.emoji === ship.emoji
                                    ? "glass-card-strong scale-110 ring-2"
                                    : "glass-card hover:scale-105"
                                    }`}
                                style={{
                                    borderColor: selectedShip.emoji === ship.emoji ? ship.color : "transparent",
                                    boxShadow: selectedShip.emoji === ship.emoji ? `0 0 15px ${ship.color}40` : "none",
                                }}
                            >
                                <div className="text-3xl mb-1">{ship.emoji}</div>
                                <div className="text-[9px] text-white/50">{ship.name}</div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCreateRoom}
                            className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                            style={{
                                background: "linear-gradient(135deg, #FF6B35, #FF00FF)",
                                boxShadow: "0 8px 30px rgba(255,107,53,0.3)",
                            }}
                        >
                            🏁 Tạo Phòng Đua
                        </button>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã phòng..."
                                maxLength={4}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-lg font-mono tracking-[0.3em] placeholder:text-white/30 focus:outline-none focus:border-neon-cyan uppercase"
                            />
                            <button
                                onClick={handleJoinRoom}
                                className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
                                style={{
                                    background: "linear-gradient(135deg, #00F5FF, #0077B6)",
                                }}
                            >
                                Tham Gia
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-3">
                            ⚠️ {error}
                        </motion.p>
                    )}

                    <button onClick={onExit} className="mt-6 text-white/30 text-sm hover:text-white/60 transition-colors">
                        ← Quay lại
                    </button>
                </motion.div>
            </div>
        );
    }


    /* ─── Phase 2: Lobby ─── */
    if (phase === "lobby") {
        return (
            <div className="w-full max-w-lg mx-auto p-6 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-5xl mb-3">☀️</div>
                    <h2 className="text-2xl font-bold text-white mb-1 font-[var(--font-heading)]">
                        Phòng Đua
                    </h2>

                    {/* Room Code */}
                    <div className="glass-card-strong !rounded-2xl !p-6 mb-6">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Mã phòng</div>
                        <div className="text-4xl font-mono font-bold tracking-[0.5em] text-neon-cyan" style={{
                            textShadow: "0 0 20px rgba(0,245,255,0.5)",
                        }}>
                            {roomCode}
                        </div>
                        <div className="text-xs text-white/30 mt-2">Chia sẻ mã này cho bạn bè!</div>
                    </div>

                    {/* Players */}
                    <div className="glass-card !rounded-2xl !p-4 mb-6">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                            Người chơi ({players.length}/{MAX_PLAYERS})
                        </div>
                        <div className="space-y-2">
                            {players.length === 0 && (
                                <div className="text-white/30 text-sm py-4">Đang chờ người chơi...</div>
                            )}
                            {players.map((p) => (
                                <div
                                    key={p.playerId}
                                    className="flex items-center gap-3 glass-card !p-3 !rounded-xl"
                                >
                                    <span className="text-2xl">{p.emoji}</span>
                                    <span className="text-white font-bold flex-1 text-left">{p.name}</span>
                                    {p.isHost && (
                                        <span className="text-[10px] bg-neon-gold/20 text-neon-gold px-2 py-0.5 rounded-full font-bold">
                                            👑 CHỦ PHÒNG
                                        </span>
                                    )}
                                    {p.playerId === playerDbId && (
                                        <span className="text-[10px] bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full">
                                            BẠN
                                        </span>
                                    )}
                                    {/* Host can kick non-host players */}
                                    {isHost && !p.isHost && p.playerId !== playerDbId && (
                                        <button
                                            onClick={() => handleKickPlayer(p.playerId)}
                                            className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold hover:bg-red-500/30 transition-colors"
                                            title={`Loại ${p.name}`}
                                        >
                                            ✖ Loại
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Start button (host only, needs 2+ players) */}
                    {isHost ? (
                        <button
                            onClick={handleStartRace}
                            disabled={players.length < 2}
                            className={`w-full py-4 rounded-2xl text-lg font-bold text-white transition-all ${players.length >= 2
                                ? "hover:scale-[1.02] active:scale-95"
                                : "opacity-40 cursor-not-allowed"
                                }`}
                            style={{
                                background:
                                    players.length >= 2
                                        ? "linear-gradient(135deg, #FF6B35, #FF00FF)"
                                        : "rgba(255,255,255,0.1)",
                                boxShadow: players.length >= 2 ? "0 8px 30px rgba(255,107,53,0.3)" : "none",
                            }}
                        >
                            {players.length >= 2 ? "🏁 Bắt Đầu Đua!" : `Cần thêm ${2 - players.length} người nữa`}
                        </button>
                    ) : (
                        <div className="glass-card !p-4 !rounded-2xl">
                            <div className="text-white/50 text-sm">⏳ Đang chờ chủ phòng bắt đầu...</div>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>
                    )}

                    <button onClick={handleExit} className="mt-4 text-white/30 text-sm hover:text-white/60 transition-colors">
                        ← Rời phòng
                    </button>
                </motion.div>
            </div>
        );
    }

    /* ─── Phase 3: Countdown ─── */
    if (phase === "countdown") {
        return (
            <div className="w-full max-w-lg mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={countdownNum}
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        {countdownNum > 0 ? (
                            <div className="text-8xl font-bold text-neon-cyan" style={{
                                textShadow: "0 0 40px rgba(0,245,255,0.8)",
                            }}>
                                {countdownNum}
                            </div>
                        ) : (
                            <div className="text-5xl font-bold text-neon-gold" style={{
                                textShadow: "0 0 40px rgba(250,204,21,0.8)",
                            }}>
                                🏁 XUẤT PHÁT!
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    /* ─── Phase 4: Racing (Question) ─── */
    if (phase === "racing" && currentQuestion) {
        const isTimedOut = timeLeft === 0;
        const myAnswer = answerOrder.find((a) => a.playerId === playerDbId);

        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                {/* Race Track */}
                <RaceTrack
                    players={players}
                    totalScores={totalScores}
                    maxScore={questions.length * 100}
                    currentPlayerId={playerDbId}
                />

                {/* Header: Question counter + Timer */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-white/50">
                        Câu {currentQIdx + 1}/{questions.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <VolumeControl />
                        <div className={`text-2xl font-bold font-mono ${timeLeft <= 3 ? "text-red-400 animate-pulse" : "text-neon-cyan"}`}>
                            {timeLeft}s
                        </div>
                    </div>
                </div>

                {/* Timer bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                    <motion.div
                        className="h-full rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(timeLeft / QUESTION_TIME_SECONDS) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                        style={{
                            background: timeLeft <= 3
                                ? "linear-gradient(90deg, #ef4444, #f97316)"
                                : "linear-gradient(90deg, #00F5FF, #FF00FF)",
                        }}
                    />
                </div>

                {/* Question */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-strong !rounded-2xl !p-6 mb-6 text-center"
                >
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                        {currentQuestion.subject}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-relaxed">
                        {currentQuestion.question_text}
                    </h3>
                </motion.div>

                {/* Answers */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {shuffledOptions.map((opt, i) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrectAnswer = opt === currentQuestion.correct_answer;
                        const showResult = answered || isTimedOut;
                        const bgColors = ["#3B82F6", "#EF4444", "#4ADE80", "#F59E0B"];

                        return (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleSelectAnswer(opt)}
                                disabled={answered || isTimedOut}
                                className={`p-4 rounded-2xl text-left font-bold text-white transition-all relative overflow-hidden ${!showResult ? "hover:scale-[1.02] active:scale-95" : ""
                                    } ${answered && !isSelected && !isCorrectAnswer ? "opacity-40" : ""}`}
                                style={{
                                    background: showResult
                                        ? isCorrectAnswer
                                            ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                            : isSelected
                                                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                                : `${bgColors[i]}33`
                                        : `linear-gradient(135deg, ${bgColors[i]}88, ${bgColors[i]}44)`,
                                    border: isSelected
                                        ? "2px solid rgba(255,255,255,0.6)"
                                        : "2px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <span className="text-sm">{opt}</span>
                                {showResult && isCorrectAnswer && (
                                    <span className="absolute top-2 right-2 text-lg">✅</span>
                                )}
                                {showResult && isSelected && !isCorrectAnswer && (
                                    <span className="absolute top-2 right-2 text-lg">❌</span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Live answer feed */}
                <AnimatePresence>
                    {answerOrder.map((a, i) => (
                        <motion.div
                            key={`${a.playerId}-${i}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-xs mb-1 ${a.isCorrect ? "text-green-400" : "text-red-400"}`}
                        >
                            {a.isCorrect ? "✅" : "❌"} {a.playerName}{" "}
                            {a.isCorrect ? `+${a.points}đ (${(a.timeMs / 1000).toFixed(1)}s)` : "0đ"}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Show own result */}
                {myAnswer && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`mt-3 text-center text-lg font-bold ${myAnswer.isCorrect ? "text-neon-green" : "text-red-400"
                            }`}
                    >
                        {myAnswer.isCorrect
                            ? `🏆 +${myAnswer.points} điểm! (${(myAnswer.timeMs / 1000).toFixed(1)}s)`
                            : "❌ Sai rồi!"}
                    </motion.div>
                )}
            </div>
        );
    }

    /* ─── Phase 5: Question Results ─── */
    if (phase === "question-result") {
        const sortedPlayers = [...players]
            .map((p) => ({ ...p, score: totalScores[p.playerId] || 0 }))
            .sort((a, b) => b.score - a.score);

        return (
            <div className="w-full max-w-lg mx-auto p-6 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Race Track */}
                    <RaceTrack
                        players={players}
                        totalScores={totalScores}
                        maxScore={questions.length * 100}
                        currentPlayerId={playerDbId}
                    />
                    <h3 className="text-xl font-bold text-white mb-4">📊 Bảng xếp hạng</h3>
                    <div className="space-y-2 mb-6">
                        {sortedPlayers.map((p, i) => (
                            <motion.div
                                key={p.playerId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-center gap-3 glass-card !p-3 !rounded-xl ${p.playerId === playerDbId ? "ring-1 ring-neon-cyan" : ""
                                    }`}
                            >
                                <span className="text-xl font-bold text-white/50 w-6">
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                                </span>
                                <span className="text-xl">{p.emoji}</span>
                                <span className="text-white font-bold flex-1 text-left text-sm">{p.name}</span>
                                <span className="text-neon-gold font-bold">{p.score}đ</span>
                            </motion.div>
                        ))}
                    </div>
                    <div className="text-white/30 text-sm">
                        {currentQIdx + 1 < questions.length
                            ? "Câu tiếp theo đang tải..."
                            : "Đang tổng kết..."}
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ─── Phase 6: Podium (Final Results) ─── */
    if (phase === "podium") {
        const myRank = finalRanking.findIndex((p) => p.playerId === playerDbId) + 1;
        const medals = ["🏆", "🥈", "🥉"];

        return (
            <div className="w-full max-w-lg mx-auto p-6 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="text-5xl mb-4">{myRank <= 3 ? medals[myRank - 1] : "🏁"}</div>
                    <h2 className="text-3xl font-bold text-white mb-1 font-[var(--font-heading)]">
                        {myRank === 1
                            ? "VÔ ĐỊCH!"
                            : myRank === 2
                                ? "Xuất sắc!"
                                : myRank === 3
                                    ? "Giỏi lắm!"
                                    : "Hoàn thành!"}
                    </h2>
                    <p className="text-white/50 text-sm mb-2">
                        Bạn đứng hạng {myRank}/{finalRanking.length}
                    </p>
                    {myRank === 1 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                            style={{
                                background: "linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))",
                                border: "1px solid rgba(255,215,0,0.4)",
                                boxShadow: "0 0 20px rgba(255,215,0,0.3)",
                            }}
                        >
                            <span className="text-xl">⭐</span>
                            <span className="text-neon-gold font-bold">+3 Sao!</span>
                            <span className="text-xl">⭐</span>
                        </motion.div>
                    )}

                    {/* Podium */}
                    <div className="flex items-end justify-center gap-4 mb-8 h-48">
                        {finalRanking.slice(0, 3).map((p, i) => {
                            const heights = [160, 120, 90];
                            const colors = [
                                "linear-gradient(to top, #FFD700, #FFA500)",
                                "linear-gradient(to top, #C0C0C0, #A0A0A0)",
                                "linear-gradient(to top, #CD7F32, #A0522D)",
                            ];
                            const order = [1, 0, 2]; // show 2nd, 1st, 3rd
                            const idx = order[i];
                            const pl = finalRanking[idx];
                            if (!pl) return null;

                            return (
                                <motion.div
                                    key={pl.playerId}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: heights[idx], opacity: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.3, duration: 0.5 }}
                                    className="w-20 rounded-t-xl flex flex-col items-center justify-start pt-2 relative"
                                    style={{ background: colors[idx] }}
                                >
                                    <div className="text-2xl mb-1">{pl.emoji}</div>
                                    <div className="text-xs font-bold text-white truncate w-full px-1">
                                        {pl.name}
                                    </div>
                                    <div className="text-lg font-bold text-white">{pl.score}đ</div>
                                    <div className="absolute -top-6 text-2xl">
                                        {medals[idx]}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Full ranking */}
                    <div className="glass-card !rounded-2xl !p-4 mb-6">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                            Bảng xếp hạng đầy đủ
                        </div>
                        {finalRanking.map((p, i) => (
                            <div
                                key={p.playerId}
                                className={`flex items-center gap-3 py-2 ${i > 0 ? "border-t border-white/5" : ""
                                    } ${p.playerId === playerDbId ? "bg-neon-cyan/5 rounded-lg px-2" : ""}`}
                            >
                                <span className="text-sm w-6 text-white/40">
                                    {i < 3 ? medals[i] : `${i + 1}.`}
                                </span>
                                <span className="text-lg">{p.emoji}</span>
                                <span className="text-white text-sm font-bold flex-1 text-left">
                                    {p.name}
                                    {p.playerId === playerDbId && " (Bạn)"}
                                </span>
                                <span className="text-neon-gold font-bold text-sm">{p.score}đ</span>
                                <span className="text-white/30 text-xs">
                                    {p.correctCount}/{questions.length}✅
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleExit}
                        className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                        style={{
                            background: "linear-gradient(135deg, #00F5FF, #FF00FF)",
                            boxShadow: "0 8px 30px rgba(0,245,255,0.2)",
                        }}
                    >
                        🏠 Về Portal
                    </button>
                </motion.div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="text-center p-8 text-white/50">
            Đang tải...
        </div>
    );
}
