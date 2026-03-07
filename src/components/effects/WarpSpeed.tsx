"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WarpSpeedProps {
    active: boolean;
    color?: string;
}

export default function WarpSpeed({ active, color = "#00F5FF" }: WarpSpeedProps) {
    const [stars, setStars] = useState<{ id: number; angle: number; speed: number; delay: number; distance: number }[]>([]);

    useEffect(() => {
        if (active) {
            // Generate stars
            const newStars = Array.from({ length: 60 }, (_, i) => ({
                id: i,
                angle: Math.random() * 360,
                speed: 1 + Math.random() * 2,
                delay: Math.random() * 0.5,
                distance: 10 + Math.random() * 50, // starting distance from center
            }));
            setStars(newStars);
        } else {
            setStars([]);
        }
    }, [active]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden mix-blend-screen"
                >
                    {/* Core glow */}
                    <div
                        className="absolute w-32 h-32 rounded-full blur-[60px]"
                        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
                    />

                    {/* Streaks */}
                    {stars.map((star) => (
                        <motion.div
                            key={star.id}
                            className="absolute bg-white rounded-full"
                            style={{
                                transformOrigin: "0 0",
                                rotate: `${star.angle}deg`,
                                left: "50%",
                                top: "50%",
                                boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                            }}
                            initial={{
                                x: Math.cos((star.angle * Math.PI) / 180) * star.distance,
                                y: Math.sin((star.angle * Math.PI) / 180) * star.distance,
                                width: "4px",
                                height: "2px",
                                opacity: 0
                            }}
                            animate={{
                                x: Math.cos((star.angle * Math.PI) / 180) * 1000,
                                y: Math.sin((star.angle * Math.PI) / 180) * 1000,
                                width: `${20 * star.speed}px`,
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 1 / star.speed,
                                repeat: Infinity,
                                delay: star.delay,
                                ease: "easeIn"
                            }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
