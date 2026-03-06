"use client";

import { motion, AnimatePresence } from "framer-motion";
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

const MODE_INTRO = {
    "shooter": { icon: "🚀", label: "Bắn Từ Không Gian" },
    "star-hunter": { icon: "⭐", label: "Săn Sao Vũ Trụ" },
    "math-forge": { icon: "⚒️", label: "Lò Rèn Vũ Trụ" },
    "meteor": { icon: "☄️", label: "Mưa Thiên Thạch" },
    "rush": { icon: "⚡", label: "Đố Nhanh Vũ Trụ" },
    "word-craft": { icon: "✍️", label: "Xưởng Chữ Vũ Trụ" },
    "timebomb": { icon: "💣", label: "Bom Hẹn Giờ" },
    "galaxy-sort": { icon: "🔬", label: "Phân Loại Thiên Hà" },
    "cosmo-bridge": { icon: "🌉", label: "Cầu Nối Tri Thức" },
    "boss": { icon: "⚔️", label: "Boss Battle" },
    "star-race": { icon: "🏁", label: "Cuộc Đua Sao" },
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

export default function LevelIntro({
    planetName,
    planetEmoji,
    levelTitle,
    levelNumber,
    subject,
    onStart,
    playerClass,
    gameMode,
}: LevelIntroProps) {
    const storyText = storyIntros[planetName] || "Hành tinh này cần sự giúp đỡ của bạn!";
    const classMsg = playerClass ? classMessages[playerClass] : null;
    const modeInfo = gameMode ? MODE_INTRO[gameMode] : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-30 px-4"
            >
                {/* Owl Commander */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl animate-float"
                >
                    🦉
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center max-w-md"
                >
                    <GlassCard glow="gold" className="mb-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="text-2xl">{planetEmoji}</span>
                            <h3 className="text-lg font-bold text-white font-[var(--font-heading)]">
                                {planetName}
                            </h3>
                        </div>
                        {modeInfo && (
                            <div className="flex justify-center mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-neon-gold border border-white/20">
                                    <span>{modeInfo.icon}</span> {modeInfo.label}
                                </span>
                            </div>
                        )}
                        <p className="text-white/70 text-sm leading-relaxed mb-3">
                            <span className="text-neon-gold font-bold">Chỉ huy Cú Mèo:</span>{" "}
                            &ldquo;{storyText}&rdquo;
                        </p>
                        <div className="flex items-center justify-center gap-3 text-xs text-white/50">
                            <span>📚 {subject}</span>
                            <span>·</span>
                            <span>Level {levelNumber}: {levelTitle}</span>
                        </div>
                    </GlassCard>

                    {/* Class ability notice */}
                    {classMsg && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-sm text-neon-cyan mb-4"
                        >
                            {classMsg}
                        </motion.p>
                    )}
                </motion.div>

                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    onClick={onStart}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,245,255,0.4)]"
                >
                    Bắt đầu sứ mệnh! ⚡
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}
