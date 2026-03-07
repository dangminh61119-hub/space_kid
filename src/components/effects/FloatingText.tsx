"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingTextProps {
    id: string;
    text: string;
    x: number;
    y: number;
    color?: string;
    size?: "sm" | "md" | "lg" | "xl";
    onComplete?: (id: string) => void;
}

const sizeMap = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
};

export default function FloatingText({
    id,
    text,
    x,
    y,
    color = "#00F5FF",
    size = "md",
    onComplete,
}: FloatingTextProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
                setTimeout(() => onComplete(id), 500); // Wait for exit animation
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [id, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: y, x: x - 20, scale: 0.5 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        y: y - 100, // Float up by 100px
                        x: x - 20 + (Math.random() * 40 - 20), // Slight random horizontal drift
                        scale: [0.5, 1.2, 1, 0.8]
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`absolute pointer-events-none font-bold z-[9999] ${sizeMap[size]}`}
                    style={{
                        color: color,
                        textShadow: `0 0 10px ${color}, 0 0 20px ${color}88, 2px 2px 0px rgba(0,0,0,0.5)`,
                        fontFamily: "var(--font-heading)",
                    }}
                >
                    {text}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
