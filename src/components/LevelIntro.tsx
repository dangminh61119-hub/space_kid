"use client";

import { motion, AnimatePresence, type TargetAndTransition, type Transition } from "framer-motion";
import { useState, useEffect } from "react";
import GlassCard from "./GlassCard";

interface LevelIntroProps {
    planetName: string;
    planetEmoji: string;
    levelTitle: string;
    levelNumber: number;
    subject: string;
    onStart: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    gameMode?: "shooter" | "star-hunter" | "math-forge" | "meteor" | "rush" | "word-craft" | "timebomb" | "galaxy-sort" | "cosmo-bridge" | "boss" | "star-race";
}

const classMessages = {
    warrior: "🛡️ Lá chắn thép sẵn sàng bảo vệ bạn 1 lần!",
    wizard: "⏳ Thời gian đã được làm chậm cho bạn!",
    hunter: "🎯 Một đáp án sai đã bị loại bỏ!",
};

const storyIntros: Record<string, string> = {
    "Cố đô Huế": "Kinh thành Huế đang bị Băng đảng Lười Biếng phá hủy các văn bản cổ! Hãy dùng sức mạnh ngôn ngữ để khôi phục chúng!",
    "Vịnh Hạ Long": "Vịnh Hạ Long bị phong ấn bởi ma thuật tối! Chỉ tri thức ngôn ngữ mới phá được phong ấn!",
    "Làng Gióng": "Lò rèn của Thánh Gióng cần năng lượng! Giải các phương trình để cung cấp sức mạnh cho vũ khí tri thức!",
    "Phong Nha": "Hang động Phong Nha ẩn chứa bí mật khoa học! Khám phá sâu hơn bằng kiến thức của bạn!",
    "Phố cổ Hội An": "Đèn lồng Hội An đang tắt dần! Thắp sáng chúng bằng nghệ thuật và ngôn ngữ!",
    "Ruộng bậc thang Sa Pa": "Ruộng bậc thang bị mã hóa! Giải mã bằng Toán học để cứu mùa vụ!",
    "Thủ đô Hà Nội": "Thăng Long nghìn năm đang bị xóa trí nhớ! Hãy viết lại lịch sử và địa lý bằng chính ngòi bút của bạn!",
};

// ── Per-mode appearance config ──────────────────────────────
interface ModeConfig {
    icon: string;
    label: string;
    color: string;
    bgGlow: string;
    iconAnim: TargetAndTransition;
    iconTransition: Transition;
    tagline: string;
}

const MODE_INTRO: Record<string, ModeConfig> = {
    "shooter": {
        icon: "🚀", label: "Bắn Từ Không Gian",
        color: "#00F5FF",
        bgGlow: "radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.18) 0%, transparent 70%)",
        iconAnim: { x: [-60, 0], opacity: [0, 1], rotate: [-10, 0] },
        iconTransition: { duration: 0.6, ease: "easeOut" },
        tagline: "🎯 Ngắm bắn chính xác để chiến thắng!",
    },
    "timebomb": {
        icon: "💣", label: "Bom Hẹn Giờ",
        color: "#FF8A4C",
        bgGlow: "radial-gradient(ellipse at 50% 0%, rgba(255,138,76,0.18) 0%, transparent 70%)",
        iconAnim: { y: [-50, 8, 0], scale: [0.5, 1.15, 1], rotate: [-5, 3, 0] },
        iconTransition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
        tagline: "⏱️ Tick… tick… tick… Nhanh lên!",
    },
    "meteor": {
        icon: "☄️", label: "Mưa Thiên Thạch",
        color: "#FF6BFF",
        bgGlow: "radial-gradient(ellipse at 70% 0%, rgba(255,107,255,0.18) 0%, transparent 70%)",
        iconAnim: { x: [60, 0], y: [-40, 0], rotate: [30, -5, 0], opacity: [0, 1] },
        iconTransition: { duration: 0.55, ease: "easeOut" },
        tagline: "🌠 Thiên thạch đang rơi! Chặn chúng lại!",
    },
    "rush": {
        icon: "⚡", label: "Đố Nhanh Vũ Trụ",
        color: "#FFE066",
        bgGlow: "radial-gradient(ellipse at 30% 20%, rgba(255,224,102,0.2) 0%, transparent 70%)",
        iconAnim: { scale: [0, 1.3, 1], opacity: [0, 1] },
        iconTransition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
        tagline: "⚡ Tốc độ là chìa khóa — đừng do dự!",
    },
    "galaxy-sort": {
        icon: "🌌", label: "Phân Loại Thiên Hà",
        color: "#B07BFF",
        bgGlow: "radial-gradient(ellipse at 50% 50%, rgba(176,123,255,0.18) 0%, transparent 70%)",
        iconAnim: { rotate: [180, 720], scale: [0, 1.1, 1], opacity: [0, 1] },
        iconTransition: { duration: 0.8, ease: "easeOut" },
        tagline: "🔭 Phân loại đúng để thiên hà sáng lên!",
    },
    "cosmo-bridge": {
        icon: "🌉", label: "Cầu Nối Tri Thức",
        color: "#7BFF7B",
        bgGlow: "radial-gradient(ellipse at 50% 100%, rgba(123,255,123,0.15) 0%, transparent 60%)",
        iconAnim: { y: [30, 0], scale: [0.6, 1.05, 1], opacity: [0, 1] },
        iconTransition: { duration: 0.6, ease: "easeOut" },
        tagline: "🌉 Bắc cầu nối từ ngữ — vượt qua thử thách!",
    },
    "star-hunter": {
        icon: "⭐", label: "Săn Sao Vũ Trụ",
        color: "#FFE066",
        bgGlow: "radial-gradient(ellipse at 50% 30%, rgba(255,224,102,0.2) 0%, transparent 60%)",
        iconAnim: { scale: [0, 1.4, 0.9, 1.1, 1], opacity: [0, 1] },
        iconTransition: { duration: 0.7, ease: "easeOut" },
        tagline: "✨ Săn đủ sao để mở cánh cổng tri thức!",
    },
    "boss": {
        icon: "👾", label: "Boss Battle",
        color: "#FF6BFF",
        bgGlow: "radial-gradient(ellipse at 50% 40%, rgba(255,107,255,0.25) 0%, transparent 65%)",
        iconAnim: {
            scale: [0, 1.5, 0.8, 1.2, 1],
            rotate: [-20, 20, -10, 10, 0],
            opacity: [0, 1],
        },
        iconTransition: { duration: 1.0, ease: "easeOut" },
        tagline: "⚔️ Boss xuất hiện! Thắng để chinh phục!",
    },
    "star-race": {
        icon: "🏁", label: "Cuộc Đua Sao",
        color: "#00F5FF",
        bgGlow: "radial-gradient(ellipse at 0% 50%, rgba(0,245,255,0.15) 0%, transparent 60%)",
        iconAnim: { x: [-80, 0], opacity: [0, 1] },
        iconTransition: { duration: 0.5, ease: "easeOut" },
        tagline: "🚦 Vạch xuất phát! Ai về đích trước?",
    },
    "math-forge": {
        icon: "⚒️", label: "Lò Rèn Toán Học",
        color: "#FF8A4C",
        bgGlow: "radial-gradient(ellipse at 50% 0%, rgba(255,138,76,0.2) 0%, transparent 70%)",
        iconAnim: { y: [-20, 10, 0], rotate: [0, -15, 15, 0], scale: [0.5, 1] },
        iconTransition: { duration: 0.65, ease: "easeOut" },
        tagline: "🔥 Rèn giũa tư duy toán học của bạn!",
    },
    "word-craft": {
        icon: "✍️", label: "Xưởng Chữ Vũ Trụ",
        color: "#7BFF7B",
        bgGlow: "radial-gradient(ellipse at 50% 20%, rgba(123,255,123,0.15) 0%, transparent 65%)",
        iconAnim: { scale: [0.4, 1.1, 1], opacity: [0, 1], rotate: [10, -5, 0] },
        iconTransition: { duration: 0.5, ease: "easeOut" },
        tagline: "✍️ Viết đúng — chinh phục ngôn từ!",
    },
};

const DEFAULT_MODE: ModeConfig = {
    icon: "🎮", label: "Mini Game",
    color: "#00F5FF",
    bgGlow: "radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.15) 0%, transparent 70%)",
    iconAnim: { scale: [0, 1.1, 1], opacity: [0, 1] },
    iconTransition: { duration: 0.5 },
    tagline: "🚀 Hành trình bắt đầu!",
};

export default function LevelIntro({
    planetName, planetEmoji, levelTitle, levelNumber,
    subject, onStart, playerClass, gameMode,
}: LevelIntroProps) {
    const storyText = storyIntros[planetName] || "Hành tinh này cần sự giúp đỡ của bạn!";
    const classMsg = playerClass ? classMessages[playerClass] : null;
    const modeConfig = (gameMode && MODE_INTRO[gameMode]) ? MODE_INTRO[gameMode] : DEFAULT_MODE;

    // Countdown before auto-proceed (optional UX polish)
    const [countdown, setCountdown] = useState<number | null>(null);
    const _ = countdown; // suppress unused warning – used for future countdown display

    useEffect(() => {
        // No auto-start: player must press button
        void _;
    }, [_]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-5 z-30 px-4 py-10 overflow-hidden"
                style={{ background: `${modeConfig.bgGlow}, #060B1E` }}
            >
                {/* ── Animated hero icon per game mode ── */}
                <motion.div
                    animate={modeConfig.iconAnim}
                    transition={modeConfig.iconTransition}
                    className="text-8xl filter drop-shadow-lg select-none"
                    style={{ filter: `drop-shadow(0 0 20px ${modeConfig.color}80)` }}
                >
                    {modeConfig.icon}
                </motion.div>

                {/* ── Mode badge ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-base font-bold border"
                    style={{
                        color: modeConfig.color,
                        borderColor: `${modeConfig.color}50`,
                        background: `${modeConfig.color}18`,
                    }}
                >
                    {modeConfig.label}
                </motion.div>

                {/* ── Info card ── */}
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-center max-w-md w-full"
                >
                    <GlassCard glow="gold" className="mb-4 !p-5">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-3xl">{planetEmoji}</span>
                            <h3 className="text-xl font-bold text-white font-[var(--font-heading)]">
                                {planetName}
                            </h3>
                        </div>
                        <p className="text-white font-medium text-base leading-relaxed mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                            <span className="text-neon-gold font-bold drop-shadow-none">Chỉ huy Cú Mèo:</span>{" "}
                            &ldquo;{storyText}&rdquo;
                        </p>
                        <div className="flex items-center justify-center gap-3 text-sm text-white/60">
                            <span>📚 {subject}</span>
                            <span>·</span>
                            <span>Level {levelNumber}: {levelTitle}</span>
                        </div>
                    </GlassCard>

                    {/* Tagline per mode */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-base font-semibold mb-2"
                        style={{ color: `${modeConfig.color}CC` }}
                    >
                        {modeConfig.tagline}
                    </motion.p>

                    {/* Class ability notice */}
                    {classMsg && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-base font-medium text-neon-cyan mt-3"
                        >
                            {classMsg}
                        </motion.p>
                    )}
                </motion.div>

                {/* ── Start button ── */}
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onStart}
                    className="px-10 py-4 mt-2 rounded-full font-black text-white text-xl tracking-wide shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${modeConfig.color}, #FF6BFF)`,
                        boxShadow: `0 0 30px ${modeConfig.color}50`,
                    }}
                >
                    Bắt đầu sứ mệnh! {modeConfig.icon}
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}
