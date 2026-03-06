"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/* ─── Mini Owl SVG (simplified from MascotAI OwlCharacter) ─── */
function MiniOwlSVG({ glowing }: { glowing?: boolean }) {
    return (
        <svg viewBox="0 0 100 110" className="w-full h-full" style={{ filter: `drop-shadow(0 0 ${glowing ? '12' : '6'}px rgba(0,245,255,${glowing ? '0.8' : '0.4'}))` }}>
            <defs>
                <radialGradient id="mo-cyberBlue" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#2A4B8C" />
                    <stop offset="60%" stopColor="#1B2A4A" />
                    <stop offset="100%" stopColor="#0B152A" />
                </radialGradient>
                <linearGradient id="mo-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FAD6A5" />
                    <stop offset="30%" stopColor="#D4A373" />
                    <stop offset="70%" stopColor="#9C6644" />
                    <stop offset="100%" stopColor="#5C3317" />
                </linearGradient>
                <radialGradient id="mo-galaxy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6C2B85" />
                    <stop offset="40%" stopColor="#2E1B4A" />
                    <stop offset="100%" stopColor="#0B152A" />
                </radialGradient>
                <linearGradient id="mo-eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0F7FA" />
                    <stop offset="30%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#0077B6" />
                </linearGradient>
                <filter id="mo-glow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Body */}
            <ellipse cx="50" cy="55" rx="34" ry="36" fill="url(#mo-cyberBlue)" stroke="#0B152A" strokeWidth="2" />
            <path d="M 22 55 C 22 35 78 35 78 55 C 78 75 65 88 50 88 C 35 88 22 75 22 55 Z" fill="url(#mo-galaxy)" stroke="url(#mo-bronze)" strokeWidth="1.5" opacity="0.95" />
            {/* Galaxy stars */}
            <circle cx="40" cy="50" r="0.8" fill="#FFF" opacity="0.9" />
            <circle cx="60" cy="65" r="1.2" fill="#00E5FF" opacity="0.8" />
            <circle cx="35" cy="60" r="1.5" fill="#FFF" opacity="0.7" />

            {/* Chest straps */}
            <path d="M 22 45 C 40 65 60 65 78 45" fill="none" stroke="url(#mo-bronze)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />

            {/* Shield emblem */}
            <g transform="translate(50, 56)">
                <path d="M -10 -10 L 10 -10 L 10 0 C 10 8 0 14 0 14 C 0 14 -10 8 -10 0 Z" fill="url(#mo-cyberBlue)" stroke="url(#mo-bronze)" strokeWidth="2.5" />
            </g>

            {/* Head */}
            <ellipse cx="50" cy="32" rx="30" ry="26" fill="url(#mo-cyberBlue)" stroke="#0B152A" strokeWidth="2" />
            {/* Brow armor */}
            <path d="M 24 18 C 35 25 45 32 50 35 C 55 32 65 25 76 18 C 80 20 75 14 74 12 C 65 18 55 24 50 28 C 45 24 35 18 26 12 C 25 14 20 20 24 18 Z" fill="url(#mo-cyberBlue)" stroke="url(#mo-bronze)" strokeWidth="1.5" />
            {/* Ears */}
            <path d="M 28 22 C 20 12 15 5 28 15 Z" fill="url(#mo-cyberBlue)" stroke="#1B2A4A" strokeWidth="1.5" />
            <path d="M 72 22 C 80 12 85 5 72 15 Z" fill="url(#mo-cyberBlue)" stroke="#1B2A4A" strokeWidth="1.5" />
            {/* Face feather */}
            <path d="M 42 38 C 38 45 46 52 50 54 C 54 52 62 45 58 38 C 52 42 48 42 42 38 Z" fill="#E0F7FA" stroke="#2A4B8C" strokeWidth="1" />
            {/* Beak */}
            <path d="M 46 38 C 50 36 50 36 54 38 C 52 45 51 46 50 50 C 49 46 48 45 46 38 Z" fill="#D4A373" stroke="#5C3317" strokeWidth="1.5" />

            {/* Eyes */}
            {/* Left */}
            <circle cx="34" cy="30" r="16" fill="url(#mo-bronze)" stroke="#5C3317" strokeWidth="1.5" />
            <circle cx="34" cy="30" r="12" fill="#0B152A" stroke="#111" strokeWidth="2" />
            <circle cx="34" cy="30" r="11" fill="url(#mo-eyeGlow)" opacity="0.9" filter="url(#mo-glow)" />
            <circle cx="34" cy="30" r="7" fill="#0B152A" />
            <circle cx="32" cy="28" r="2.5" fill="#FFF" opacity="0.95" />
            <circle cx="36" cy="31" r="1" fill="#00E5FF" filter="url(#mo-glow)" />
            {/* Right */}
            <circle cx="66" cy="30" r="16" fill="url(#mo-bronze)" stroke="#5C3317" strokeWidth="1.5" />
            <circle cx="66" cy="30" r="12" fill="#0B152A" stroke="#111" strokeWidth="2" />
            <circle cx="66" cy="30" r="11" fill="url(#mo-eyeGlow)" opacity="0.9" filter="url(#mo-glow)" />
            <circle cx="66" cy="30" r="7" fill="#0B152A" />
            <circle cx="64" cy="28" r="2.5" fill="#FFF" opacity="0.95" />
            <circle cx="68" cy="31" r="1" fill="#00E5FF" filter="url(#mo-glow)" />
        </svg>
    );
}

/* ─── Props ─── */
interface MascotAbilityButtonProps {
    /** onClick handler — usually the useAbility function */
    onClick: () => void;
    /** Is the ability already used / unavailable */
    disabled?: boolean;
    /** Number of charges remaining */
    charges: number;
    /** Ability label, e.g. "Đóng Băng TG" */
    label: string;
    /** Short description, e.g. "Đứng yên 5s" */
    description?: string;
    /** Size variant */
    size?: "sm" | "md";
    /** Position in game (absolute positioned) */
    position?: "bottom-right" | "bottom-left" | "bottom-center" | "inline";
}

/* ─── Component ─── */
export default function MascotAbilityButton({
    onClick,
    disabled = false,
    charges,
    label,
    description,
    size = "md",
    position = "bottom-right",
}: MascotAbilityButtonProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (charges < 1 && disabled) return null;

    const sizeClass = size === "sm" ? "w-14 h-14" : "w-[68px] h-[68px]";
    const positionClass = position === "bottom-right" ? "absolute bottom-4 right-4 z-20"
        : position === "bottom-left" ? "absolute bottom-4 left-4 z-20"
            : position === "bottom-center" ? "z-20"
                : "";

    return (
        <div className={`${positionClass} flex flex-col items-center gap-1`}>
            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        className="glass-card !px-3 !py-2 !rounded-xl text-center whitespace-nowrap mb-1"
                        style={{ boxShadow: "0 0 15px rgba(0,245,255,0.2)" }}
                    >
                        <p className="text-xs font-bold text-neon-gold">{label}</p>
                        {description && <p className="text-[10px] text-white/60">{description}</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mascot button */}
            <motion.button
                onClick={onClick}
                disabled={disabled || charges < 1}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onTouchStart={() => { setShowTooltip(true); setTimeout(() => setShowTooltip(false), 2000); }}
                whileHover={!disabled ? { scale: 1.15 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
                animate={!disabled ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`relative ${sizeClass} rounded-full transition-all`}
                style={{
                    opacity: disabled ? 0.3 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                }}
            >
                {/* Glow ring */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(0,245,255,0.3), rgba(147,51,234,0.2), transparent)",
                        filter: "blur(8px)",
                        transform: "scale(1.3)",
                    }}
                />
                {/* Owl */}
                <div className="relative z-10">
                    <MiniOwlSVG glowing={!disabled} />
                </div>
                {/* Charge badge */}
                {charges > 0 && (
                    <motion.div
                        key={charges}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-20 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-neon-gold to-amber-500 flex items-center justify-center shadow-lg"
                        style={{ boxShadow: "0 0 8px rgba(255,215,0,0.5)" }}
                    >
                        <span className="text-[10px] font-black text-slate-900 px-1">⚡{charges}</span>
                    </motion.div>
                )}
            </motion.button>

            {/* Label below */}
            {!disabled && (
                <span className="text-[9px] text-white/50 font-bold whitespace-nowrap">Trợ giúp</span>
            )}
        </div>
    );
}

/* ─── Export MiniOwl for reuse in HUD (e.g. shield indicator) ─── */
export { MiniOwlSVG };
