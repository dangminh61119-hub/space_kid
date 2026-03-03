"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LinkCodePopupProps {
    linkCode: string;
    childName: string;
    parentEmail: string;
    onClose: () => void;
}

export default function LinkCodePopup({ linkCode, childName, parentEmail, onClose }: LinkCodePopupProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(linkCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const el = document.createElement("textarea");
            el.value = linkCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="relative w-full max-w-md rounded-3xl overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, #0A0E27 0%, #1a1f4e 100%)",
                        border: "1px solid rgba(0,245,255,0.2)",
                        boxShadow: "0 0 60px rgba(0,245,255,0.15), 0 20px 60px rgba(0,0,0,0.5)",
                    }}
                >
                    {/* Header */}
                    <div className="text-center pt-8 pb-4 px-6">
                        <motion.div
                            className="text-5xl mb-3"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            🔗
                        </motion.div>
                        <h2 className="text-xl font-bold text-white font-[var(--font-heading)]">
                            Mã Liên Kết Phụ Huynh
                        </h2>
                        <p className="text-white/50 text-sm mt-1">
                            Gửi mã này cho phụ huynh để theo dõi tiến độ học tập
                        </p>
                    </div>

                    {/* Link Code */}
                    <div className="mx-6 mb-4">
                        <div
                            className="text-center py-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                            style={{
                                background: "rgba(0,245,255,0.08)",
                                border: "2px solid rgba(0,245,255,0.3)",
                            }}
                            onClick={handleCopy}
                        >
                            <div className="text-white/40 text-xs font-medium mb-2 tracking-wider">
                                MÃ LIÊN KẾT
                            </div>
                            <div
                                className="text-4xl font-bold font-mono tracking-[0.4em] text-neon-cyan"
                                style={{ textShadow: "0 0 20px rgba(0,245,255,0.5)" }}
                            >
                                {linkCode}
                            </div>
                            <div className="text-white/30 text-xs mt-2">
                                {copied ? "✅ Đã sao chép!" : "📋 Nhấn để sao chép"}
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mx-6 mb-4 p-4 rounded-xl bg-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/40">👧 Bé:</span>
                            <span className="text-neon-gold font-medium">{childName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/40">📧 Email PH:</span>
                            <span className="text-white/70">{parentEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-400 text-xs">✓</span>
                            <span className="text-white/50 text-xs">
                                Mã đã được gửi đến email phụ huynh
                            </span>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="mx-6 mb-6 p-4 rounded-xl bg-white/5">
                        <div className="text-white/50 text-xs font-medium mb-3">
                            📋 PHỤ HUYNH CẦN LÀM
                        </div>
                        <div className="space-y-2">
                            {[
                                "Đăng ký tài khoản Phụ huynh",
                                "Vào mục Liên kết trong Dashboard",
                                `Nhập mã ${linkCode}`,
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-neon-cyan font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-white/60 text-xs">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Button */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                            style={{
                                background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))",
                                color: "#0A0E27",
                                boxShadow: "0 4px 20px rgba(0,245,255,0.3)",
                            }}
                        >
                            Đã hiểu, tiếp tục! 🚀
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
