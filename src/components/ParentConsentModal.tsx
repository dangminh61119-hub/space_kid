"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";

interface ParentConsentModalProps {
    parentEmail: string;
    childName: string;
    onConsent: () => void;
    onCancel: () => void;
}

const CONSENT_ITEMS = [
    {
        icon: "📊",
        title: "Thu thập dữ liệu học tập",
        description: "Chúng tôi thu thập dữ liệu tiến độ học tập (điểm, thời gian chơi, mastery) để cá nhân hóa trải nghiệm.",
    },
    {
        icon: "🤖",
        title: "Tương tác AI an toàn",
        description: "AI Mascot hỗ trợ học tập với nội dung được kiểm duyệt nghiêm ngặt, không thu thập thông tin cá nhân.",
    },
    {
        icon: "📧",
        title: "Gửi báo cáo cho phụ huynh",
        description: "Chúng tôi gửi báo cáo tiến độ học tập qua email phụ huynh đã đăng ký.",
    },
    {
        icon: "🔒",
        title: "Bảo mật dữ liệu",
        description: "Dữ liệu được mã hóa và lưu trữ an toàn. Không chia sẻ với bên thứ ba. Tuân thủ COPPA.",
    },
];

export default function ParentConsentModal({
    parentEmail,
    childName,
    onConsent,
    onCancel,
}: ParentConsentModalProps) {
    const [agreed, setAgreed] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onCancel}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                >
                    <GlassCard glow="gold" className="!p-6 sm:!p-8">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">🛡️</div>
                            <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-heading)] neon-text">
                                Đồng ý của Phụ huynh
                            </h2>
                            <p className="text-white/50 text-sm mt-2">
                                Vì sự an toàn của <span className="text-neon-gold font-bold">{childName || "con bạn"}</span>
                            </p>
                        </div>

                        {/* Consent items */}
                        <div className="space-y-3 mb-6">
                            {CONSENT_ITEMS.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <span className="text-2xl shrink-0">{item.icon}</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white/90">{item.title}</h4>
                                        <p className="text-[11px] text-white/40 leading-relaxed">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Rights notice */}
                        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-6">
                            <p className="text-[11px] text-cyan-400/70 leading-relaxed">
                                <strong>Quyền của bạn:</strong> Bạn có quyền xem, xuất, hoặc xóa toàn bộ dữ liệu
                                của con bất cứ lúc nào tại trang Dashboard. Email nhận báo cáo:{" "}
                                <span className="font-bold text-cyan-400">{parentEmail}</span>
                            </p>
                        </div>

                        {/* Checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer mb-6 group">
                            <div className="shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                                />
                            </div>
                            <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                Tôi đã đọc và đồng ý với các điều khoản thu thập dữ liệu, tương tác AI an toàn,
                                và gửi báo cáo tiến độ cho con tôi.
                            </span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 rounded-xl font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-all text-sm"
                            >
                                Quay lại
                            </button>
                            <div className="flex-1">
                                <NeonButton
                                    variant="gold"
                                    size="lg"
                                    onClick={onConsent}
                                    disabled={!agreed}
                                >
                                    Đồng ý ✨
                                </NeonButton>
                            </div>
                        </div>

                        {/* Footer */}
                        <p className="text-[10px] text-white/20 text-center mt-4">
                            CosmoMosaic tuân thủ COPPA · Dữ liệu lưu trữ tại Supabase (Singapore)
                        </p>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
