"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getStreakMultiplier } from "@/lib/game-context";

interface CoinRewardPopupProps {
    earned: number;
    multiplier: number;
    reason?: string;
    onDone?: () => void;
}

/**
 * Animated popup showing Coins reward with streak multiplier.
 * Auto-dismisses after 3 seconds.
 */
export default function CoinRewardPopup({ earned, multiplier, reason, onDone }: CoinRewardPopupProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onDone?.();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onDone]);

    const baseAmount = multiplier > 1 ? Math.round(earned / multiplier) : earned;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="coin-reward-popup-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="coin-reward-popup"
                        initial={{ scale: 0.5, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: -30, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    >
                        {/* Glow background */}
                        <div className="coin-reward-glow" />

                        {/* Coin icon with bounce */}
                        <motion.div
                            className="coin-reward-icon"
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        >
                            🪙
                        </motion.div>

                        {/* Amount */}
                        <motion.div
                            className="coin-reward-amount"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", damping: 12 }}
                        >
                            +{earned}
                        </motion.div>

                        {/* Multiplier badge */}
                        {multiplier > 1 && (
                            <motion.div
                                className="coin-reward-multiplier"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="coin-reward-multiplier-base">{baseAmount}</span>
                                <span className="coin-reward-multiplier-x">× {multiplier}</span>
                                <span className="coin-reward-multiplier-streak">🔥 Streak Bonus!</span>
                            </motion.div>
                        )}

                        {/* Reason text */}
                        {reason && (
                            <motion.p
                                className="coin-reward-reason"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {reason}
                            </motion.p>
                        )}

                        {/* Sparkle particles */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="coin-reward-sparkle"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                    x: Math.cos((i / 6) * Math.PI * 2) * 60,
                                    y: Math.sin((i / 6) * Math.PI * 2) * 60,
                                }}
                                transition={{ duration: 1, delay: 0.1 + i * 0.08 }}
                            >
                                ✨
                            </motion.div>
                        ))}
                    </motion.div>

                    <style jsx>{`
                        .coin-reward-popup-overlay {
                            position: fixed;
                            inset: 0;
                            z-index: 100;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            pointer-events: none;
                        }

                        .coin-reward-popup {
                            position: relative;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 8px;
                            padding: 32px 48px;
                            background: rgba(10, 22, 40, 0.95);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(245, 180, 11, 0.3);
                            border-radius: 28px;
                            box-shadow:
                                0 20px 60px rgba(0, 0, 0, 0.8),
                                0 0 40px rgba(245, 180, 11, 0.15),
                                inset 0 1px 0 rgba(255, 255, 255, 0.1);
                        }

                        .coin-reward-glow {
                            position: absolute;
                            inset: -40px;
                            background: radial-gradient(circle, rgba(245, 180, 11, 0.15) 0%, transparent 60%);
                            border-radius: 50%;
                            pointer-events: none;
                        }

                        .coin-reward-icon {
                            font-size: 56px;
                            filter: drop-shadow(0 0 20px rgba(245, 180, 11, 0.6));
                            position: relative;
                            z-index: 2;
                        }

                        .coin-reward-amount {
                            font-family: var(--font-heading, 'Inter', sans-serif);
                            font-size: 42px;
                            font-weight: 900;
                            background: linear-gradient(135deg, #FBBF24, #F59E0B, #D97706);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            text-shadow: none;
                            filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4));
                            position: relative;
                            z-index: 2;
                        }

                        .coin-reward-multiplier {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 16px;
                            background: rgba(245, 158, 11, 0.1);
                            border: 1px solid rgba(245, 158, 11, 0.2);
                            border-radius: 20px;
                            position: relative;
                            z-index: 2;
                        }

                        .coin-reward-multiplier-base {
                            font-family: var(--font-heading, 'Inter', sans-serif);
                            font-size: 14px;
                            font-weight: 700;
                            color: rgba(255, 255, 255, 0.5);
                            text-decoration: line-through;
                        }

                        .coin-reward-multiplier-x {
                            font-family: var(--font-heading, 'Inter', sans-serif);
                            font-size: 16px;
                            font-weight: 900;
                            color: #FBBF24;
                        }

                        .coin-reward-multiplier-streak {
                            font-size: 12px;
                            font-weight: 700;
                            color: #F97316;
                        }

                        .coin-reward-reason {
                            font-size: 14px;
                            font-weight: 600;
                            color: rgba(255, 255, 255, 0.6);
                            position: relative;
                            z-index: 2;
                            margin: 0;
                        }

                        .coin-reward-sparkle {
                            position: absolute;
                            font-size: 18px;
                            pointer-events: none;
                            z-index: 1;
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
