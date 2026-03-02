"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* ─── Types ─── */
interface PuzzlePiece {
    id: number;
    label: string;
    correctSlot: number;
}

interface PuzzleLevel {
    level: number;
    title: string;
    heritage: string;
    emoji: string;
    description: string;
    pieces: PuzzlePiece[];
}

interface Props {
    levels?: PuzzleLevel[];
    onExit?: () => void;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    calmMode?: boolean;
}

/* ─── Default Heritage Levels ─── */
const DEFAULT_LEVELS: PuzzleLevel[] = [
    {
        level: 1,
        title: "Vịnh Hạ Long",
        heritage: "Di sản thiên nhiên thế giới UNESCO",
        emoji: "🌊",
        description: "Sắp xếp các sự kiện lịch sử về Vịnh Hạ Long theo thứ tự thời gian",
        pieces: [
            { id: 1, label: "Hạ Long được phát hiện bởi người Pháp", correctSlot: 0 },
            { id: 2, label: "UNESCO công nhận lần 1 (1994)", correctSlot: 1 },
            { id: 3, label: "UNESCO công nhận lần 2 (2000)", correctSlot: 2 },
            { id: 4, label: "Trở thành Kỳ quan thiên nhiên thế giới (2012)", correctSlot: 3 },
        ],
    },
    {
        level: 2,
        title: "Cố đô Huế",
        heritage: "Di sản văn hóa thế giới UNESCO",
        emoji: "🏯",
        description: "Ghép các thông tin đúng về Kinh thành Huế",
        pieces: [
            { id: 1, label: "Kinh đô nhà Nguyễn", correctSlot: 0 },
            { id: 2, label: "Xây dựng năm 1805", correctSlot: 1 },
            { id: 3, label: "UNESCO công nhận năm 1993", correctSlot: 2 },
            { id: 4, label: "Có Cửu Đỉnh bằng đồng nổi tiếng", correctSlot: 3 },
        ],
    },
    {
        level: 3,
        title: "Phố cổ Hội An",
        heritage: "Di sản văn hóa thế giới UNESCO",
        emoji: "🏮",
        description: "Sắp xếp các đặc trưng của Hội An",
        pieces: [
            { id: 1, label: "Cảng thương mại quốc tế từ thế kỷ 15", correctSlot: 0 },
            { id: 2, label: "Chùa Cầu – biểu tượng của Hội An", correctSlot: 1 },
            { id: 3, label: "Đèn lồng truyền thống nổi tiếng", correctSlot: 2 },
            { id: 4, label: "UNESCO công nhận năm 1999", correctSlot: 3 },
        ],
    },
    {
        level: 4,
        title: "Phong Nha – Kẻ Bàng",
        heritage: "Di sản thiên nhiên thế giới UNESCO",
        emoji: "🦇",
        description: "Ghép các thông tin về hang động kỳ vĩ",
        pieces: [
            { id: 1, label: "Hang Sơn Đoòng – hang lớn nhất thế giới", correctSlot: 0 },
            { id: 2, label: "Hệ thống hang động đá vôi 400 triệu năm", correctSlot: 1 },
            { id: 3, label: "UNESCO công nhận năm 2003", correctSlot: 2 },
            { id: 4, label: "Hơn 300 loài động thực vật quý hiếm", correctSlot: 3 },
        ],
    },
];

/* ─── Constants ─── */
const MAX_HP = 3;
const XP_PER_CORRECT = 50;
const BONUS_PERFECT = 200;

export default function HeritagePuzzleGame({ levels = DEFAULT_LEVELS, onExit, onGameComplete, calmMode = false }: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();

    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "gameOver" | "win">("ready");
    const [levelIdx, setLevelIdx] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [score, setScore] = useState(0);
    const [placedPieces, setPlacedPieces] = useState<(PuzzlePiece | null)[]>([]);
    const [availablePieces, setAvailablePieces] = useState<PuzzlePiece[]>([]);
    const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
    const [feedback, setFeedback] = useState<{ slotIdx: number; correct: boolean } | null>(null);
    const [perfectLevel, setPerfectLevel] = useState(true);
    const [levelsCompleted, setLevelsCompleted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const level = levels[levelIdx];

    /* ─── Init level ─── */
    const initLevel = useCallback((idx: number) => {
        const lvl = levels[idx];
        if (!lvl) return;
        setLevelIdx(idx);
        setPlacedPieces(new Array(lvl.pieces.length).fill(null));
        setAvailablePieces([...lvl.pieces].sort(() => Math.random() - 0.5));
        setSelectedPiece(null);
        setFeedback(null);
        setPerfectLevel(true);
        setGameState("playing");
    }, [levels]);

    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setLevelsCompleted(0);
        initLevel(0);
    }, [playBGM, initLevel]);

    /* ─── Place piece in slot ─── */
    const handleSlotClick = useCallback((slotIdx: number) => {
        if (!selectedPiece || feedback || gameState !== "playing") return;

        const isCorrect = selectedPiece.correctSlot === slotIdx;

        if (isCorrect) {
            playCorrect();
            setPlacedPieces(prev => {
                const next = [...prev];
                next[slotIdx] = selectedPiece;
                return next;
            });
            setAvailablePieces(prev => prev.filter(p => p.id !== selectedPiece.id));
            setScore(s => s + XP_PER_CORRECT);
            setFeedback({ slotIdx, correct: true });
        } else {
            playWrong();
            setPerfectLevel(false);
            setFeedback({ slotIdx, correct: false });
            const newHp = hp - 1;
            setHp(newHp);
            if (newHp <= 0) {
                stopBGM();
                setTimeout(() => {
                    onGameComplete?.(score, levelsCompleted);
                    setGameState("gameOver");
                }, 800);
                return;
            }
        }

        setSelectedPiece(null);

        // Clear feedback after delay
        setTimeout(() => {
            setFeedback(null);

            // Check if level complete
            if (isCorrect) {
                const newPlaced = [...placedPieces];
                newPlaced[slotIdx] = selectedPiece;
                const allPlaced = newPlaced.every(p => p !== null);
                if (allPlaced) {
                    const bonus = perfectLevel ? BONUS_PERFECT : 0;
                    setScore(s => s + bonus);
                    setLevelsCompleted(l => l + 1);

                    if (levelIdx + 1 >= levels.length) {
                        stopBGM();
                        onGameComplete?.(score + XP_PER_CORRECT + bonus, levelIdx + 1);
                        setGameState("win");
                    } else {
                        setGameState("levelComplete");
                    }
                }
            }
        }, 800);
    }, [selectedPiece, feedback, gameState, hp, placedPieces, perfectLevel, levelIdx, levels.length, score, levelsCompleted]);

    /* ─── Render ─── */
    return (
        <div
            ref={containerRef}
            className="w-full max-w-4xl mx-auto flex flex-col gap-4"
            style={{ filter: calmMode ? "saturate(0.3)" : "none" }}
        >
            {/* HUD */}
            <div className="flex items-center justify-between gap-3 glass-card-strong !rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>
                            ❤️
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-neon-gold font-bold text-lg">{score}</span>
                    <span className="text-white/40 text-xs">XP</span>
                </div>
            </div>

            {/* Main area */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep min-h-[500px] flex flex-col">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                <AnimatePresence mode="wait">
                    {/* READY */}
                    {gameState === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-6 z-20"
                        >
                            <div className="text-6xl animate-float">🏛️</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center">
                                Ghép Di Sản Việt Nam
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Kéo các mảnh ghép vào đúng vị trí để khám phá<br />
                                di sản <span className="text-neon-gold font-bold">văn hóa</span> Việt Nam! 🇻🇳
                            </p>
                            {level && (
                                <div className="glass-card !p-3 !rounded-xl text-center">
                                    <p className="text-xs text-white/50">{level.emoji} {level.title}</p>
                                    <p className="text-sm font-bold text-white">{level.heritage}</p>
                                </div>
                            )}
                            <button
                                onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                            >
                                BẮT ĐẦU GHÉP 🏛️
                            </button>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {gameState === "playing" && level && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex-1 flex flex-col p-6 gap-6"
                        >
                            {/* Level header */}
                            <div className="text-center">
                                <p className="text-2xl mb-1">{level.emoji}</p>
                                <h3 className="text-lg font-bold text-white font-[var(--font-heading)]">{level.title}</h3>
                                <p className="text-white/40 text-xs">{level.description}</p>
                            </div>

                            {/* Slots */}
                            <div className="space-y-3">
                                {level.pieces.map((_, slotIdx) => {
                                    const placed = placedPieces[slotIdx];
                                    const isFeedbackSlot = feedback?.slotIdx === slotIdx;

                                    return (
                                        <motion.div
                                            key={slotIdx}
                                            onClick={() => handleSlotClick(slotIdx)}
                                            className={`
                                                relative flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer
                                                transition-all duration-300
                                                ${placed
                                                    ? "border-green-500/50 bg-green-500/10"
                                                    : selectedPiece
                                                        ? "border-amber-400/50 bg-amber-400/5 hover:bg-amber-400/10"
                                                        : "border-white/10 bg-white/5"
                                                }
                                                ${isFeedbackSlot && feedback?.correct ? "ring-2 ring-green-400" : ""}
                                                ${isFeedbackSlot && !feedback?.correct ? "ring-2 ring-red-400 animate-pulse" : ""}
                                            `}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white/50 shrink-0">
                                                {slotIdx + 1}
                                            </div>
                                            {placed ? (
                                                <span className="text-sm text-green-400 font-medium">{placed.label}</span>
                                            ) : (
                                                <span className="text-sm text-white/20">Kéo mảnh ghép vào đây...</span>
                                            )}
                                            {placed && (
                                                <span className="absolute right-4 text-green-400">✓</span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Available pieces */}
                            <div>
                                <p className="text-xs text-white/30 mb-2">Chọn một mảnh ghép:</p>
                                <div className="flex flex-wrap gap-2">
                                    {availablePieces.map((piece) => (
                                        <motion.button
                                            key={piece.id}
                                            onClick={() => setSelectedPiece(selectedPiece?.id === piece.id ? null : piece)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={`
                                                px-4 py-3 rounded-xl text-sm font-medium transition-all
                                                ${selectedPiece?.id === piece.id
                                                    ? "bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                                    : "glass-card-strong text-white/80 hover:text-white border border-white/10"
                                                }
                                            `}
                                        >
                                            {piece.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LEVEL COMPLETE */}
                    {gameState === "levelComplete" && (
                        <motion.div
                            key="levelComplete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">🎉</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">
                                {level?.title} hoàn thành!
                            </h2>
                            {perfectLevel && (
                                <p className="text-neon-gold text-sm font-bold">🌟 Hoàn hảo! +{BONUS_PERFECT} XP bonus</p>
                            )}
                            <p className="text-neon-gold text-lg font-bold">{score} XP</p>
                            <button
                                onClick={() => initLevel(levelIdx + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg hover:scale-105 transition-transform"
                            >
                                Di sản tiếp theo →
                            </button>
                        </motion.div>
                    )}

                    {/* GAME OVER */}
                    {gameState === "gameOver" && (
                        <motion.div
                            key="gameOver"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">💫</div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-orange-400">Thử lại nhé!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-gold font-bold">{score} XP</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:scale-105 transition-transform">
                                    Chơi lại 🔄
                                </button>
                                {onExit && (
                                    <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Thoát
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* WIN */}
                    {gameState === "win" && (
                        <motion.div
                            key="win"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">Nhà sử học vũ trụ!</h2>
                            <p className="text-neon-gold text-xl font-bold">Tổng: {score} XP ⭐</p>
                            <p className="text-white/50 text-sm">Khám phá tất cả {levels.length} di sản!</p>
                            <div className="flex gap-3">
                                <button onClick={startGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:scale-105 transition-transform">
                                    Chơi lại 🔄
                                </button>
                                {onExit && (
                                    <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Về bản đồ 🗺
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    {level && (
                        <>
                            <span>🏛️ {level.title}</span>
                            <span>·</span>
                            <span>Level {level.level}/{levels.length}</span>
                        </>
                    )}
                </div>
                {onExit && (
                    <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                        ← Thoát
                    </button>
                )}
            </div>
        </div>
    );
}
