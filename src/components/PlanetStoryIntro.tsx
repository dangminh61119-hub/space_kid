"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    planetName: string;
    planetEmoji: string;
    storyText: string;
    onStart: () => void;
}

const STAR_COUNT = 30;

export default function PlanetStoryIntro({ planetName, planetEmoji, storyText, onStart }: Props) {
    const [phase, setPhase] = useState<"travel" | "arrive" | "story" | "ready">("travel");
    const [typedText, setTypedText] = useState("");

    // Phase progression
    useEffect(() => {
        const t1 = setTimeout(() => setPhase("arrive"), 2000);
        const t2 = setTimeout(() => setPhase("story"), 3200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Typewriter effect for story
    useEffect(() => {
        if (phase !== "story") return;
        let idx = 0;
        const interval = setInterval(() => {
            idx++;
            setTypedText(storyText.slice(0, idx));
            if (idx >= storyText.length) {
                clearInterval(interval);
                setTimeout(() => setPhase("ready"), 400);
            }
        }, 35);
        return () => clearInterval(interval);
    }, [phase, storyText]);

    return (
        <div className="absolute inset-0 bg-space-deep overflow-hidden flex items-center justify-center z-40">
            {/* Stars */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: STAR_COUNT }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={phase === "travel"
                            ? { x: [0, -300], opacity: [0.8, 0] }
                            : { opacity: [0.3, 0.8, 0.3] }
                        }
                        transition={phase === "travel"
                            ? { duration: 1.5, delay: Math.random() * 0.5, repeat: Infinity }
                            : { duration: 2 + Math.random() * 2, repeat: Infinity }
                        }
                    />
                ))}
            </div>

            {/* Nebula glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-cyan-500/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg px-6">
                {/* Spaceship → Planet transition */}
                <AnimatePresence mode="wait">
                    {(phase === "travel") && (
                        <motion.div
                            key="ship"
                            initial={{ x: -150, opacity: 0 }}
                            animate={{ x: 0, opacity: 1, rotate: [0, 2, -2, 0] }}
                            exit={{ x: 150, opacity: 0, scale: 0.5 }}
                            transition={{ duration: 1.5, rotate: { repeat: Infinity, duration: 2 } }}
                            className="text-7xl"
                        >
                            🚀
                        </motion.div>
                    )}

                    {(phase === "arrive" || phase === "story" || phase === "ready") && (
                        <motion.div
                            key="planet"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="text-center"
                        >
                            <motion.div
                                className="text-8xl mb-3"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                {planetEmoji}
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-magenta"
                            >
                                {planetName}
                            </motion.h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Story from Owl Commander */}
                {(phase === "story" || phase === "ready") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card !rounded-2xl !p-5 border border-neon-gold/20 w-full"
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-3xl shrink-0 mt-1">🦉</span>
                            <div>
                                <p className="text-xs text-neon-gold font-bold mb-1.5">Chỉ huy Cú Mèo</p>
                                <p className="text-white/80 text-sm leading-relaxed min-h-[3em]">
                                    &ldquo;{typedText}
                                    {phase === "story" && <span className="animate-pulse text-neon-cyan">|</span>}
                                    &rdquo;
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Start button */}
                {phase === "ready" && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        onClick={onStart}
                        className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,245,255,0.4)]"
                    >
                        Bắt đầu khám phá! 🌟
                    </motion.button>
                )}

                {/* Skip button (always visible) */}
                {phase !== "ready" && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={onStart}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                        Bỏ qua →
                    </motion.button>
                )}
            </div>
        </div>
    );
}
