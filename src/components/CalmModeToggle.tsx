"use client";

import { useGame } from "@/lib/game-context";
import { motion } from "framer-motion";

/**
 * CalmModeToggle — Nút bật/tắt Calm Mode 🌙/☀️
 * Luôn hiển thị ở góc phải Navbar.
 * Khi bật: Giảm kích thích giác quan (saturate, animation chậm hơn 1.5×).
 */
export default function CalmModeToggle() {
    const { player, setCalmMode } = useGame();
    const isCalm = player.calmMode;

    return (
        <motion.button
            onClick={() => setCalmMode(!isCalm)}
            aria-label={isCalm ? "Tắt Calm Mode (bình thường)" : "Bật Calm Mode (giảm kích thích)"}
            title={isCalm ? "Tắt Calm Mode" : "Bật Calm Mode"}
            className="relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            style={{
                background: isCalm
                    ? "rgba(176, 123, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.08)",
                borderColor: isCalm
                    ? "rgba(176, 123, 255, 0.5)"
                    : "rgba(255, 255, 255, 0.15)",
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
        >
            <motion.span
                key={isCalm ? "moon" : "sun"}
                initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="text-lg leading-none"
            >
                {isCalm ? "🌙" : "☀️"}
            </motion.span>

            {/* Active dot indicator */}
            {isCalm && (
                <motion.span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                />
            )}
        </motion.button>
    );
}
