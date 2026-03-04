"use client";

/**
 * BossBattle.tsx — CosmoMosaic v2.0
 * Boss encounter at the end of each planet.
 * Boss has 3 HP, player must answer 3 questions correctly to defeat.
 * Pre-defined dialogue, 0 API calls during battle.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBoss, getBossDialogue, type Boss } from "@/lib/data/boss-data";
import type { GameLevel } from "@/lib/services/db";

interface BossBattleProps {
    planetId: string;
    /** Questions for the boss battle (last level's questions) */
    level: GameLevel;
    /** Called when boss is defeated */
    onVictory: (score: number) => void;
    /** Called when player loses */
    onDefeat: () => void;
    /** Called when player exits */
    onExit: () => void;
    playerName?: string;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
}

type BattlePhase = "intro" | "fighting" | "victory" | "defeat";

export default function BossBattle({
    planetId,
    level,
    onVictory,
    onDefeat,
    onExit,
    playerName = "Chiến binh",
    playerClass,
}: BossBattleProps) {
    const boss = useMemo(() => getBoss(planetId), [planetId]);
    const [phase, setPhase] = useState<BattlePhase>("intro");
    const [introStep, setIntroStep] = useState(0);
    const [bossHp, setBossHp] = useState(boss?.maxHp || 3);
    const [currentQ, setCurrentQ] = useState(0);
    const [dialogue, setDialogue] = useState("");
    const [score, setScore] = useState(0);
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

    const questions = level.questions;

    if (!boss) return null;

    /* ─── Intro sequence ─── */
    const handleIntroNext = () => {
        if (introStep < boss.introLines.length - 1) {
            setIntroStep(prev => prev + 1);
        } else {
            setPhase("fighting");
            setDialogue(getBossDialogue(boss, "taunt"));
        }
    };

    /* ─── Answer handling ─── */
    const handleAnswer = useCallback((selectedWord: string) => {
        const q = questions[currentQ];
        if (!q) return;

        const isCorrect = selectedWord === q.correctWord;

        if (isCorrect) {
            const newHp = bossHp - 1;
            setBossHp(newHp);
            setScore(prev => prev + 100);
            setShake(true);
            setFlash("hit");
            setTimeout(() => { setShake(false); setFlash(null); }, 600);

            if (newHp <= 0) {
                setDialogue(getBossDialogue(boss, "defeat"));
                setTimeout(() => setPhase("victory"), 1500);
            } else if (newHp === 1) {
                setDialogue(getBossDialogue(boss, "fear"));
            } else {
                setDialogue(getBossDialogue(boss, "hit"));
            }
        } else {
            setFlash("miss");
            setTimeout(() => setFlash(null), 600);
            setDialogue(getBossDialogue(boss, "taunt"));
        }

        // Next question
        const nextQ = currentQ + 1;
        if (nextQ < questions.length) {
            setTimeout(() => setCurrentQ(nextQ), 800);
        } else if (!isCorrect || bossHp > 1) {
            // Ran out of questions but boss still alive
            setTimeout(() => {
                setDialogue("Boss vẫn còn sức! Lần sau nhé! 💪");
                setPhase("defeat");
            }, 1000);
        }
    }, [boss, bossHp, currentQ, questions]);

    /* ─── RENDER ─── */
    return (
        <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep">
            {/* Background glow */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${boss.color}40, transparent 70%)`,
                }}
            />

            <AnimatePresence mode="wait">
                {/* ─── INTRO ─── */}
                {phase === "intro" && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
                    >
                        {/* Boss emoji */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, -5, 5, 0],
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-8xl mb-6"
                            style={{ filter: `drop-shadow(0 0 20px ${boss.color})` }}
                        >
                            {boss.emoji}
                        </motion.div>

                        {/* Boss name */}
                        <h2
                            className="text-2xl font-bold font-[var(--font-heading)] mb-2"
                            style={{ color: boss.color }}
                        >
                            ⚠️ {boss.name}
                        </h2>
                        <p className="text-white/40 text-xs mb-4">{boss.personality}</p>

                        {/* Dialogue bubble */}
                        <div className="glass-card !p-4 !rounded-xl max-w-sm mb-6 border"
                            style={{ borderColor: `${boss.color}40` }}
                        >
                            <p className="text-white/80 text-sm italic text-center">
                                &ldquo;{boss.introLines[introStep]}&rdquo;
                            </p>
                        </div>

                        <button
                            onClick={handleIntroNext}
                            className="px-8 py-3 rounded-full font-bold text-white text-base hover:scale-105 transition-transform shadow-lg"
                            style={{
                                background: `linear-gradient(to right, ${boss.color}, ${boss.color}cc)`,
                                boxShadow: `0 0 25px ${boss.color}40`,
                            }}
                        >
                            {introStep < boss.introLines.length - 1 ? "Tiếp..." : `⚔️ Chiến đấu!`}
                        </button>
                    </motion.div>
                )}

                {/* ─── FIGHTING ─── */}
                {phase === "fighting" && questions[currentQ] && (
                    <motion.div
                        key="fighting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4 z-10"
                    >
                        {/* Top: Boss HP + dialogue */}
                        <div className="w-full max-w-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <motion.span
                                        className="text-3xl"
                                        animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {boss.emoji}
                                    </motion.span>
                                    <span className="text-sm font-bold" style={{ color: boss.color }}>
                                        {boss.name}
                                    </span>
                                </div>
                                {/* HP Hearts */}
                                <div className="flex gap-1">
                                    {Array.from({ length: boss.maxHp }).map((_, i) => (
                                        <motion.span
                                            key={i}
                                            className="text-lg"
                                            animate={i >= bossHp ? { scale: [1, 0], opacity: [1, 0] } : {}}
                                        >
                                            {i < bossHp ? "❤️" : "🖤"}
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            {/* Dialogue */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={dialogue}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="glass-card !p-2 !rounded-lg border text-center mb-4"
                                    style={{ borderColor: `${boss.color}30` }}
                                >
                                    <p className="text-xs text-white/60 italic">
                                        &ldquo;{dialogue}&rdquo;
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Flash effect */}
                            {flash && (
                                <motion.div
                                    initial={{ opacity: 0.8 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className={`absolute inset-0 pointer-events-none rounded-2xl ${flash === "hit" ? "bg-green-500/20" : "bg-red-500/20"
                                        }`}
                                />
                            )}
                        </div>

                        {/* Center: Question */}
                        <div className="text-center my-4">
                            <p className="text-white/40 text-xs mb-1">
                                Câu {currentQ + 1} / {Math.min(questions.length, boss.maxHp)}
                            </p>
                            <h3 className="text-xl font-bold text-white font-[var(--font-heading)]">
                                {questions[currentQ].question}
                            </h3>
                        </div>

                        {/* Bottom: Answer options */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                            {[questions[currentQ].correctWord, ...questions[currentQ].wrongWords]
                                .sort(() => Math.random() - 0.5)
                                .map((word, i) => (
                                    <motion.button
                                        key={`${currentQ}-${word}-${i}`}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAnswer(word)}
                                        className="py-3 px-4 rounded-xl border border-white/20 bg-white/5
                                            text-white font-bold text-sm hover:bg-white/10
                                            hover:border-white/40 transition-all"
                                    >
                                        {word}
                                    </motion.button>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* ─── VICTORY ─── */}
                {phase === "victory" && (
                    <motion.div
                        key="victory"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="text-8xl mb-4"
                        >
                            🏆
                        </motion.div>
                        <h2 className="text-3xl font-bold neon-text font-[var(--font-heading)] mb-2">
                            BOSS ĐÃ BỊ HẠ!
                        </h2>
                        <p className="text-white/60 text-sm mb-2">
                            {playerName} đã giải phóng hành tinh!
                        </p>
                        <div className="glass-card !p-3 !rounded-xl mb-4 text-center">
                            <p className="text-xs text-white/40 italic">
                                &ldquo;{getBossDialogue(boss, "defeat")}&rdquo;
                            </p>
                        </div>
                        <p className="text-neon-gold text-2xl font-bold mb-6">{score} XP ⭐</p>
                        <button
                            onClick={() => onVictory(score)}
                            className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,245,255,0.4)]"
                        >
                            🎉 Hoàn thành!
                        </button>
                    </motion.div>
                )}

                {/* ─── DEFEAT ─── */}
                {phase === "defeat" && (
                    <motion.div
                        key="defeat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
                    >
                        <span className="text-7xl mb-4">💥</span>
                        <h2 className="text-2xl font-bold text-red-400 font-[var(--font-heading)] mb-2">
                            Chưa hạ được Boss!
                        </h2>
                        <p className="text-white/60 text-sm mb-6">
                            {boss.name} vẫn còn sức mạnh. Luyện thêm rồi quay lại!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onDefeat}
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:scale-105 transition-transform"
                            >
                                🔄 Thử lại
                            </button>
                            <button
                                onClick={onExit}
                                className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition"
                            >
                                🗺 Về bản đồ
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
