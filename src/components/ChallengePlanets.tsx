"use client";

import { motion } from "framer-motion";
import PlanetIcon from "./PlanetIcon";

interface PlanetData {
    name: string;
    emoji: string;
    c1: string;
    c2: string;
    ring?: string;
    bobDuration: number;
    bobDelay: number;
    spinDuration: number;
}

const planets: PlanetData[] = [
    { name: "Vịnh Hạ Long", emoji: "🏝️", c1: "#00F5FF", c2: "#0077B6", ring: "#00F5FF", bobDuration: 4, bobDelay: 0, spinDuration: 20 },
    { name: "Cố đô Huế", emoji: "🏯", c1: "#FF6BFF", c2: "#9D174D", ring: "#FF6BFF", bobDuration: 5, bobDelay: 1, spinDuration: 25 },
    { name: "Làng Gióng", emoji: "⚔️", c1: "#FFE066", c2: "#D97706", ring: "#FFE066", bobDuration: 4.5, bobDelay: 0.5, spinDuration: 22 },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.6, ease: "easeOut" as const },
    },
};

export default function ChallengePlanets() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-wrap justify-center gap-10 sm:gap-16 pt-8"
        >
            {planets.map((planet) => (
                <motion.div
                    key={planet.name}
                    variants={itemVariants}
                    className="flex flex-col items-center gap-4 group cursor-pointer"
                    whileHover={{ y: -8, scale: 1.05 }}
                >
                    <div className="relative">
                        {/* Hover glow behind planet */}
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                            style={{ backgroundColor: planet.c1 }}
                        />
                        {/* Animated planet with gentle floating (bob + sway + tilt) */}
                        <motion.div
                            animate={{
                                y: [0, -10, 0, 8, 0],
                                x: [0, 5, 0, -5, 0],
                                rotate: [-2, 2, -2],
                            }}
                            transition={{
                                y: {
                                    duration: planet.bobDuration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: planet.bobDelay,
                                },
                                x: {
                                    duration: planet.bobDuration * 1.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: planet.bobDelay + 0.5,
                                },
                                rotate: {
                                    duration: planet.bobDuration * 1.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                },
                            }}
                        >
                            <PlanetIcon
                                color1={planet.c1}
                                color2={planet.c2}
                                ringColor={planet.ring}
                                size={120}
                                className="relative z-10"
                            />
                        </motion.div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform">{planet.emoji}</span>
                        <span
                            className="text-base font-bold text-white/80 group-hover:text-white transition-colors tracking-wide"
                            style={{ textShadow: `0 0 10px ${planet.c1}40` }}
                        >
                            {planet.name}
                        </span>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
