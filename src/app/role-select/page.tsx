"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/services/auth-context";

export default function RoleSelectPage() {
    const router = useRouter();
    const { user, loading, role, needsRoleSelect, createPlayerForOAuth } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Already has a role → redirect
    if (!loading && user && role && !needsRoleSelect) {
        if (role === "parent") {
            router.replace("/dashboard");
        } else {
            router.replace("/profile");
        }
        return null;
    }

    // Not logged in → redirect to login
    if (!loading && !user) {
        router.replace("/login");
        return null;
    }

    const handleSelect = async (selectedRole: "parent" | "child") => {
        setSubmitting(true);
        setError(null);

        try {
            const playerId = await createPlayerForOAuth(selectedRole);
            if (!playerId) {
                setError("Không thể tạo tài khoản. Vui lòng thử lại!");
                setSubmitting(false);
                return;
            }

            if (selectedRole === "parent") {
                router.push("/dashboard");
            } else {
                router.push("/profile");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại!");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <StarField count={40} />
                <div className="text-white text-xl animate-pulse">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-20">
            <StarField count={60} />

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4 animate-float">🌌</div>
                        <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text mb-2">
                            Chào mừng!
                        </h1>
                        <p className="text-white/50 text-sm">
                            Bạn là ai? Hãy chọn vai trò của mình
                        </p>
                    </div>

                    <GlassCard glow="cyan" className="space-y-4">
                        <p className="text-white/60 text-xs font-medium text-center mb-2">
                            Chọn vai trò để bắt đầu 🚀
                        </p>

                        {/* Child button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect("child")}
                            disabled={submitting}
                            className="w-full p-5 rounded-2xl border text-left transition-all flex items-center gap-4 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 disabled:opacity-50"
                        >
                            <div className="text-4xl">👧</div>
                            <div>
                                <div className="text-lg font-bold text-cyan-300">Học sinh</div>
                                <p className="text-white/40 text-xs mt-0.5">
                                    Chơi game, học bài, khám phá vũ trụ kiến thức!
                                </p>
                            </div>
                        </motion.button>

                        {/* Parent button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect("parent")}
                            disabled={submitting}
                            className="w-full p-5 rounded-2xl border text-left transition-all flex items-center gap-4 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 disabled:opacity-50"
                        >
                            <div className="text-4xl">👨‍👩‍👧</div>
                            <div>
                                <div className="text-lg font-bold text-purple-300">Phụ huynh</div>
                                <p className="text-white/40 text-xs mt-0.5">
                                    Theo dõi tiến độ, xem báo cáo, quản lý học tập
                                </p>
                            </div>
                        </motion.button>

                        {/* Loading state */}
                        {submitting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-neon-cyan text-sm py-2"
                            >
                                ⏳ Đang tạo tài khoản...
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20"
                            >
                                {error}
                            </motion.div>
                        )}
                    </GlassCard>

                    <p className="text-center text-white/25 text-xs mt-6">
                        Đăng nhập bằng: {user?.email}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
