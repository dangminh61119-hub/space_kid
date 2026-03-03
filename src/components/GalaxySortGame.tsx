"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* ─── Types ─── */
interface SortItem {
    id: string;
    text: string;
    category: string; // which bin it belongs to
}

interface SortRound {
    question: string;         // e.g. "Phân loại các từ sau"
    categories: string[];     // e.g. ["Danh từ", "Động từ"]
    items: SortItem[];
}

interface Props {
    levels: GameLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
}

/* ─── Constants ─── */
const MAX_HP = 3;
const BASE_XP = 50;
const BONUS_PERFECT = 200;

/* ─── Generate sort rounds from word questions ─── */
function generateRoundsFromLevels(levels: GameLevel[]): SortRound[] {
    const rounds: SortRound[] = [];

    for (const level of levels) {
        // Group questions by subject for natural categories
        const qs = level.questions;
        if (qs.length < 4) continue;

        // Strategy: correct_word = category A, wrong_words[0] items = category B
        // Create sorting challenge from Q&A data
        for (let i = 0; i < qs.length - 1; i += 2) {
            const q1 = qs[i];
            const q2 = qs[i + 1];
            if (!q1 || !q2) continue;

            const cat1 = q1.question; // Use question text as category label
            const cat2 = q2.question;

            const items: SortItem[] = [];
            // Correct answers go to their question category
            items.push({ id: `${i}-c1`, text: q1.correctWord, category: cat1 });
            items.push({ id: `${i}-c2`, text: q2.correctWord, category: cat2 });
            // Add some wrong words as distractors in opposite category
            if (q1.wrongWords[0]) items.push({ id: `${i}-w1`, text: q1.wrongWords[0], category: cat1 });
            if (q2.wrongWords[0]) items.push({ id: `${i}-w2`, text: q2.wrongWords[0], category: cat2 });
            if (q1.wrongWords[1]) items.push({ id: `${i}-w3`, text: q1.wrongWords[1], category: cat1 });
            if (q2.wrongWords[1]) items.push({ id: `${i}-w4`, text: q2.wrongWords[1], category: cat2 });

            rounds.push({
                question: `Kéo từ vào đúng nhóm!`,
                categories: [cat1, cat2],
                items: items.sort(() => Math.random() - 0.5), // shuffle
            });
        }
    }

    return rounds.length > 0 ? rounds : generateDefaultRounds();
}

function generateDefaultRounds(): SortRound[] {
    return [
        {
            question: "Phân loại: Động vật sống ở đâu?",
            categories: ["🌊 Dưới nước", "🌍 Trên cạn"],
            items: [
                { id: "a1", text: "🐟 Cá", category: "🌊 Dưới nước" },
                { id: "a2", text: "🐕 Chó", category: "🌍 Trên cạn" },
                { id: "a3", text: "🐙 Bạch tuộc", category: "🌊 Dưới nước" },
                { id: "a4", text: "🐔 Gà", category: "🌍 Trên cạn" },
                { id: "a5", text: "🦈 Cá mập", category: "🌊 Dưới nước" },
                { id: "a6", text: "🐘 Voi", category: "🌍 Trên cạn" },
            ].sort(() => Math.random() - 0.5),
        },
        {
            question: "Phân loại: Số chẵn hay số lẻ?",
            categories: ["🔵 Số chẵn", "🔴 Số lẻ"],
            items: [
                { id: "b1", text: "12", category: "🔵 Số chẵn" },
                { id: "b2", text: "7", category: "🔴 Số lẻ" },
                { id: "b3", text: "24", category: "🔵 Số chẵn" },
                { id: "b4", text: "15", category: "🔴 Số lẻ" },
                { id: "b5", text: "8", category: "🔵 Số chẵn" },
                { id: "b6", text: "33", category: "🔴 Số lẻ" },
            ].sort(() => Math.random() - 0.5),
        },
        {
            question: "Phân loại: Miền nào?",
            categories: ["🏔️ Miền Bắc", "🏖️ Miền Nam"],
            items: [
                { id: "c1", text: "Hà Nội", category: "🏔️ Miền Bắc" },
                { id: "c2", text: "TP.HCM", category: "🏖️ Miền Nam" },
                { id: "c3", text: "Hải Phòng", category: "🏔️ Miền Bắc" },
                { id: "c4", text: "Cần Thơ", category: "🏖️ Miền Nam" },
                { id: "c5", text: "Sa Pa", category: "🏔️ Miền Bắc" },
                { id: "c6", text: "Vũng Tàu", category: "🏖️ Miền Nam" },
            ].sort(() => Math.random() - 0.5),
        },
        {
            question: "Phân loại: Danh từ hay Động từ?",
            categories: ["📦 Danh từ", "🏃 Động từ"],
            items: [
                { id: "d1", text: "Bàn", category: "📦 Danh từ" },
                { id: "d2", text: "Chạy", category: "🏃 Động từ" },
                { id: "d3", text: "Sách", category: "📦 Danh từ" },
                { id: "d4", text: "Ăn", category: "🏃 Động từ" },
                { id: "d5", text: "Mèo", category: "📦 Danh từ" },
                { id: "d6", text: "Hát", category: "🏃 Động từ" },
            ].sort(() => Math.random() - 0.5),
        },
    ];
}

const BIN_COLORS = [
    { bg: "from-cyan-600/20 to-cyan-800/20", border: "border-cyan-400/40", glow: "shadow-[0_0_20px_rgba(0,245,255,0.2)]", text: "text-cyan-300" },
    { bg: "from-orange-600/20 to-orange-800/20", border: "border-orange-400/40", glow: "shadow-[0_0_20px_rgba(251,146,60,0.2)]", text: "text-orange-300" },
    { bg: "from-purple-600/20 to-purple-800/20", border: "border-purple-400/40", glow: "shadow-[0_0_20px_rgba(192,132,252,0.2)]", text: "text-purple-300" },
];

/* ─── Component ─── */
export default function GalaxySortGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const [gameState, setGameState] = useState<"ready" | "playing" | "roundComplete" | "gameOver" | "win">("ready");
    const [rounds, setRounds] = useState<SortRound[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [sortedItems, setSortedItems] = useState<Record<string, string>>({}); // itemId → category
    const [unsortedItems, setUnsortedItems] = useState<SortItem[]>([]);
    const [feedback, setFeedback] = useState<Record<string, "correct" | "wrong">>({});
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [autoSorted, setAutoSorted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [comboCount, setComboCount] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const round = rounds[roundIdx];

    /* ─── Generate rounds ─── */
    useEffect(() => {
        const generated = generateRoundsFromLevels(levels);
        setRounds(generated.length > 0 ? generated : generateDefaultRounds());
    }, [levels]);

    /* ─── Start game ─── */
    const startGame = () => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setComboCount(0);
        setShieldUsed(false);
        setAutoSorted(false);
        startRound(0);
    };

    const startRound = (idx: number) => {
        setRoundIdx(idx);
        const r = rounds[idx];
        if (!r) return;
        setUnsortedItems([...r.items]);
        setSortedItems({});
        setFeedback({});
        setSelectedItem(null);
        setAutoSorted(false);
        setGameState("playing");
    };

    /* ─── Tap item to select, then tap bin to sort ─── */
    const handleSelectItem = (itemId: string) => {
        if (sortedItems[itemId]) return; // already sorted
        setSelectedItem(prev => prev === itemId ? null : itemId);
    };

    const handleDropToBin = useCallback((category: string) => {
        if (!selectedItem) return;

        const item = round?.items.find(i => i.id === selectedItem);
        if (!item) return;

        const isCorrect = item.category === category;

        if (isCorrect) {
            playCorrect();
            setComboCount(c => c + 1);
            const combo = Math.min(comboCount, 5);
            setScore(s => s + BASE_XP + combo * 10);
            setSortedItems(prev => ({ ...prev, [item.id]: category }));
            setFeedback(prev => ({ ...prev, [item.id]: "correct" }));
            setUnsortedItems(prev => prev.filter(i => i.id !== item.id));
            onAnswered?.(true, levels[0]?.subject ?? "", 4);
        } else {
            playWrong();
            setComboCount(0);
            setFeedback(prev => ({ ...prev, [item.id]: "wrong" }));
            onAnswered?.(false, levels[0]?.subject ?? "", 4);

            if (playerClass === "warrior" && !shieldUsed) {
                setShieldUsed(true);
                setAbilityNotice("🛡️ Lá chắn bảo vệ HP!");
                setTimeout(() => setAbilityNotice(null), 1500);
            } else {
                setHp(prev => {
                    const n = prev - 1;
                    if (n <= 0) {
                        setTimeout(() => {
                            stopBGM();
                            onGameComplete?.(score, roundIdx);
                            setGameState("gameOver");
                        }, 500);
                    }
                    return n;
                });
            }

            // Clear wrong feedback after a moment
            setTimeout(() => {
                setFeedback(prev => {
                    const copy = { ...prev };
                    delete copy[item.id];
                    return copy;
                });
            }, 800);
        }

        setSelectedItem(null);
    }, [selectedItem, round, comboCount, sortedItems, shieldUsed, playerClass, score, roundIdx, hp]);

    /* ─── Hunter ability: auto-sort one item ─── */
    const handleAutoSort = () => {
        if (playerClass !== "hunter" || autoSorted || unsortedItems.length === 0) return;
        const item = unsortedItems[0];
        setAutoSorted(true);
        setSortedItems(prev => ({ ...prev, [item.id]: item.category }));
        setFeedback(prev => ({ ...prev, [item.id]: "correct" }));
        setUnsortedItems(prev => prev.filter(i => i.id !== item.id));
        setScore(s => s + BASE_XP);
        setAbilityNotice("🎯 Tự phân loại 1 item!");
        setTimeout(() => setAbilityNotice(null), 1500);
    };

    /* ─── Check round completion ─── */
    useEffect(() => {
        if (gameState !== "playing" || !round) return;
        if (unsortedItems.length === 0) {
            // Round complete!
            const allCorrect = round.items.every(i => sortedItems[i.id] === i.category);
            if (allCorrect) setScore(s => s + BONUS_PERFECT);

            setTimeout(() => {
                if (roundIdx + 1 >= rounds.length) {
                    stopBGM();
                    onGameComplete?.(score + (allCorrect ? BONUS_PERFECT : 0), rounds.length);
                    setGameState("win");
                } else {
                    setGameState("roundComplete");
                }
            }, 800);
        }
    }, [unsortedItems.length, gameState]);

    /* ─── Fullscreen ─── */
    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", h);
        return () => document.removeEventListener("fullscreenchange", h);
    }, []);

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>

            {/* HUD */}
            <div className={`flex items-center justify-between glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full' : ''}`}>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>
                            ❤️
                        </span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && (
                        <span className="text-xl ml-1 animate-pulse">🛡️</span>
                    )}
                </div>

                <AnimatePresence>
                    {abilityNotice && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap">
                            {abilityNotice}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                    {comboCount > 1 && (
                        <motion.span key={comboCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                            🔥 x{comboCount}
                        </motion.span>
                    )}
                    <span className="text-neon-cyan font-bold text-lg">{score}</span>
                    <span className="text-white/40 text-xs">XP</span>
                    <button onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            {/* ─── MAIN AREA ─── */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-2' : 'min-h-[500px]'}`}
                style={{ filter: calmMode ? 'saturate(0.3)' : 'none' }}>

                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
                </div>

                {/* Playing */}
                {gameState === "playing" && round && (
                    <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-6 gap-4">
                        {/* Round info */}
                        <div className="text-center">
                            <p className="text-white/40 text-xs mb-1">Vòng {roundIdx + 1}/{rounds.length}</p>
                            <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                                🔬 {round.question}
                            </p>
                        </div>

                        {/* Items to sort (conveyor belt) */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                            {unsortedItems.map(item => (
                                <motion.button
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: 1,
                                        scale: selectedItem === item.id ? 1.1 : 1,
                                        boxShadow: selectedItem === item.id ? "0 0 20px rgba(192,132,252,0.5)" : "none",
                                    }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    onClick={() => handleSelectItem(item.id)}
                                    className={`
                                        px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all
                                        ${selectedItem === item.id
                                            ? "border-purple-400 bg-purple-400/20 text-purple-200"
                                            : feedback[item.id] === "wrong"
                                                ? "border-red-400 bg-red-400/10 text-red-300 animate-[shake_0.5s]"
                                                : feedback[item.id] === "correct"
                                                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                                                    : "border-white/15 bg-white/5 text-white hover:border-purple-400/30"
                                        }
                                    `}
                                >
                                    {item.text}
                                </motion.button>
                            ))}
                            {unsortedItems.length === 0 && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-emerald-400 font-bold text-sm">
                                    ✨ Phân loại xong!
                                </motion.p>
                            )}
                        </div>

                        {/* Hunter ability button */}
                        {playerClass === "hunter" && !autoSorted && unsortedItems.length > 0 && (
                            <button onClick={handleAutoSort}
                                className="px-3 py-1.5 rounded-full border border-neon-gold/30 text-neon-gold text-xs font-bold hover:bg-neon-gold/10 transition-colors">
                                🎯 Tự phân loại 1 từ
                            </button>
                        )}

                        {/* Selection hint */}
                        {selectedItem && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-white/40 text-xs">
                                👆 Bấm vào nhóm bên dưới để phân loại
                            </motion.p>
                        )}

                        {/* Category bins */}
                        <div className="flex gap-4 w-full max-w-lg mt-auto mb-2">
                            {round.categories.map((cat, i) => {
                                const color = BIN_COLORS[i % BIN_COLORS.length];
                                const itemsInBin = round.items.filter(item => sortedItems[item.id] === cat);

                                return (
                                    <motion.button
                                        key={cat}
                                        onClick={() => handleDropToBin(cat)}
                                        whileHover={selectedItem ? { scale: 1.03 } : {}}
                                        whileTap={selectedItem ? { scale: 0.97 } : {}}
                                        className={`
                                            flex-1 rounded-2xl border-2 border-dashed p-4 min-h-[120px] transition-all
                                            flex flex-col items-center gap-2
                                            bg-gradient-to-b ${color.bg} ${color.border}
                                            ${selectedItem ? `${color.glow} cursor-pointer` : "cursor-default"}
                                        `}
                                    >
                                        <span className={`font-bold text-sm ${color.text}`}>{cat}</span>
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {itemsInBin.map(item => (
                                                <span key={item.id} className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70">
                                                    {item.text}
                                                </span>
                                            ))}
                                        </div>
                                        {itemsInBin.length === 0 && (
                                            <span className="text-white/10 text-xs mt-2">Kéo vào đây</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── OVERLAYS ─── */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl animate-float">🔬</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                Phân Loại Thiên Hà
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Chạm vào từ, rồi chạm vào nhóm đúng để phân loại!<br />
                                Phân loại nhanh & đúng = <span className="text-neon-gold font-bold">bonus XP!</span>
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && "🛡️ Miễn 1 lần phân loại sai"}
                                        {playerClass === "wizard" && "⏳ Conveyor chạy chậm hơn"}
                                        {playerClass === "hunter" && "🎯 Tự phân loại 1 từ"}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                BẮT ĐẦU PHÂN LOẠI 🔬
                            </button>
                        </motion.div>
                    )}

                    {gameState === "roundComplete" && (
                        <motion.div key="roundComplete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-5xl">🎉</div>
                            <h2 className="text-xl font-bold neon-text">Vòng {roundIdx + 1} hoàn thành!</h2>
                            <p className="text-neon-gold font-bold">{score} XP</p>
                            <button onClick={() => startRound(roundIdx + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-105 transition-transform">
                                Vòng tiếp theo →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="gameOver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl font-bold text-red-400">Phân loại thất bại!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} XP</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-105 transition-transform">
                                    Thử lại 🔄
                                </button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Thoát</button>}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl font-bold neon-text">Phân loại hoàn hảo!</h2>
                            <p className="text-neon-gold text-xl font-bold">{score} XP ⭐</p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-105 transition-transform">
                                    Chơi lại 🔄
                                </button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Về bản đồ 🗺</button>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="text-xs text-white/40">🔬 Phân Loại Thiên Hà · Vòng {roundIdx + 1}/{rounds.length}</div>
                {onExit && <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10">← Thoát</button>}
            </div>
        </div>
    );
}
