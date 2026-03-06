"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ComboFlashProps {
    /** Current combo streak (0 = no flash) */
    combo: number;
    /** Calm mode reduces visual intensity */
    calmMode?: boolean;
}

interface ComboConfig {
    text: string;
    subText: string;
    color: string;
    bgColor: string;
    flashOpacity: number;
    icon: string;
}

const COMBO_CONFIGS: Record<number, ComboConfig> = {
    2: {
        text: "×2 COMBO!",
        subText: "Tuyệt vời!",
        color: "#00F5FF",
        bgColor: "rgba(0, 245, 255, 0.12)",
        flashOpacity: 0.08,
        icon: "✨",
    },
    3: {
        text: "×3 COMBO!",
        subText: "Xuất sắc!",
        color: "#FFE066",
        bgColor: "rgba(255, 224, 102, 0.15)",
        flashOpacity: 0.12,
        icon: "🔥",
    },
    4: {
        text: "×4 SIÊU ĐỈNH!",
        subText: "Không thể tin nổi!",
        color: "#FF6BFF",
        bgColor: "rgba(255, 107, 255, 0.18)",
        flashOpacity: 0.15,
        icon: "⚡",
    },
};

// For combo ≥ 5, use the same config as 4 but escalate icon
function getConfig(combo: number): ComboConfig | null {
    if (combo < 2) return null;
    if (combo >= 5) return {
        text: `×${combo} 🏆 HUYỀN THOẠI!`,
        subText: "Bạn cực kỳ đỉnh!",
        color: "#FF6BFF",
        bgColor: "rgba(255, 107, 255, 0.2)",
        flashOpacity: 0.18,
        icon: "🏆",
    };
    return COMBO_CONFIGS[Math.min(combo, 4)];
}

/**
 * ComboFlash — overlay that appears when combo ≥ 2.
 *
 * Place inside a position:relative container (the game wrapper).
 * Pass the current combo streak number; the component handles
 * show/hide automatically using an internal key trick.
 *
 * Usage:
 *   <div className="relative">
 *     <GameComponent onAnswered={(correct) => { if(correct) setCombo(c => c+1); else setCombo(0); }} />
 *     <ComboFlash combo={comboStreak} />
 *   </div>
 */
export default function ComboFlash({ combo, calmMode = false }: ComboFlashProps) {
    // Use a trigger key so the animation re-runs on every new combo increment
    const [triggerKey, setTriggerKey] = useState(0);
    const [visible, setVisible] = useState(false);
    const config = getConfig(combo);

    useEffect(() => {
        if (!config) return;
        setVisible(true);
        setTriggerKey(k => k + 1);
        const t = setTimeout(() => setVisible(false), 1200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [combo]);

    if (!config) return null;

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Full-screen flash (disabled in calm mode) */}
                    {!calmMode && (
                        <motion.div
                            key={`flash-${triggerKey}`}
                            initial={{ opacity: config.flashOpacity }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: config.bgColor,
                                pointerEvents: "none",
                                zIndex: 50,
                                borderRadius: "inherit",
                            }}
                        />
                    )}

                    {/* Combo text badge */}
                    <motion.div
                        key={`text-${triggerKey}`}
                        initial={{ opacity: 0, scale: 0.4, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2, y: -20 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        style={{
                            position: "absolute",
                            top: "38%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 60,
                            pointerEvents: "none",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                background: config.bgColor,
                                border: `2px solid ${config.color}`,
                                borderRadius: 16,
                                padding: "10px 24px",
                                backdropFilter: "blur(12px)",
                                boxShadow: `0 0 24px ${config.color}60, 0 0 48px ${config.color}30`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: calmMode ? 22 : 28,
                                    fontWeight: 900,
                                    color: config.color,
                                    fontFamily: "var(--font-heading)",
                                    letterSpacing: "0.05em",
                                    textShadow: calmMode ? "none" : `0 0 12px ${config.color}`,
                                    lineHeight: 1.1,
                                }}
                            >
                                {config.icon} {config.text}
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "rgba(255,255,255,0.7)",
                                    marginTop: 2,
                                    fontWeight: 600,
                                }}
                            >
                                {config.subText}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
