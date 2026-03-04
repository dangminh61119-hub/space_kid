"use client";

/**
 * CrystalIndicator.tsx — CosmoMosaic v2.0
 * Shows the player's crystal count in the game UI.
 * Animated when crystals change.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useState, useEffect, useRef } from "react";

export default function CrystalIndicator() {
    const { player } = useGame();
    const [showDelta, setShowDelta] = useState<number | null>(null);
    const prevCrystals = useRef(player.crystals);

    useEffect(() => {
        const delta = player.crystals - prevCrystals.current;
        if (delta !== 0) {
            setShowDelta(delta);
            setTimeout(() => setShowDelta(null), 1500);
        }
        prevCrystals.current = player.crystals;
    }, [player.crystals]);

    return (
        <div className="relative flex items-center gap-1.5">
            <motion.div
                key={player.crystals}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="glass-card !p-1.5 !px-3 !rounded-xl flex items-center gap-1.5 border border-purple-500/20"
            >
                <span className="text-sm">💎</span>
                <span className="text-sm font-bold text-purple-300">{player.crystals}</span>
            </motion.div>

            {/* Floating delta */}
            <AnimatePresence>
                {showDelta !== null && (
                    <motion.span
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: -20 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className={`absolute -top-4 right-0 text-xs font-bold ${showDelta > 0 ? "text-green-400" : "text-red-400"
                            }`}
                    >
                        {showDelta > 0 ? `+${showDelta}` : showDelta}💎
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}
