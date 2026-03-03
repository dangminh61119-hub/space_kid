"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    planetName: string;
    planetEmoji: string;
    videoSrc?: string;        // e.g. "/videos/planets/hue.mp4"
    onStart: () => void;
}

const STAR_COUNT = 30;

export default function PlanetStoryIntro({ planetName, planetEmoji, videoSrc, onStart }: Props) {
    const [phase, setPhase] = useState<"travel" | "video" | "ready">("travel");
    const videoRef = useRef<HTMLVideoElement>(null);

    // Phase: travel → video (or ready if no video)
    useEffect(() => {
        const t = setTimeout(() => {
            if (videoSrc) {
                setPhase("video");
            } else {
                setPhase("ready");
            }
        }, 2200);
        return () => clearTimeout(t);
    }, [videoSrc]);

    // Auto-play video when phase changes
    useEffect(() => {
        if (phase === "video" && videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, [phase]);

    // When video ends → ready
    const handleVideoEnd = () => {
        setPhase("ready");
    };

    return (
        <div className="absolute inset-0 bg-space-deep overflow-hidden flex items-center justify-center z-40">
            {/* Stars background */}
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

            {/* Nebula */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-cyan-500/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5 max-w-lg w-full px-6">
                <AnimatePresence mode="wait">
                    {/* Phase 1: Spaceship traveling */}
                    {phase === "travel" && (
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

                    {/* Phase 2: Video playing */}
                    {phase === "video" && videoSrc && (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            {/* Planet title */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-4"
                            >
                                <span className="text-4xl mb-1 block">{planetEmoji}</span>
                                <h1 className="text-xl sm:text-2xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-magenta">
                                    {planetName}
                                </h1>
                            </motion.div>

                            {/* Video player */}
                            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(0,245,255,0.15)]">
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    onEnded={handleVideoEnd}
                                    playsInline
                                    muted={false}
                                    className="w-full rounded-2xl"
                                    style={{ maxHeight: "300px", objectFit: "cover" }}
                                />
                                {/* Skip button on video */}
                                <button
                                    onClick={() => setPhase("ready")}
                                    className="absolute bottom-3 right-3 text-xs text-white/50 hover:text-white/80 transition-colors bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm"
                                >
                                    Bỏ qua →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Phase 3: Ready to start */}
                    {phase === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring" }}
                            className="text-center"
                        >
                            <motion.div
                                className="text-8xl mb-3"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                {planetEmoji}
                            </motion.div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-magenta mb-6">
                                {planetName}
                            </h1>
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                onClick={onStart}
                                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,245,255,0.4)]"
                            >
                                Bắt đầu khám phá! 🌟
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Skip during travel */}
                {phase === "travel" && (
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
