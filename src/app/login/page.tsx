"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { useAuth } from "@/lib/services/auth-context";

type AuthTab = "login" | "register";
type RegisterRole = "child" | "parent";

export default function LoginPage() {
    const router = useRouter();
    const { signUp, signIn, signInWithGoogle, signInWithFacebook, loading: authLoading, user, role, needsRoleSelect, profileCompleted, surveyCompleted, onboardingComplete } = useAuth();

    const [tab, setTab] = useState<AuthTab>("login");
    const [registerRole, setRegisterRole] = useState<RegisterRole>("child");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    // If already logged in, redirect based on role & status
    useEffect(() => {
        if (user) {
            if (needsRoleSelect || !role) {
                router.push("/role-select");
            } else if (role === 'parent') {
                router.push("/dashboard");
            } else if (!profileCompleted) {
                router.push("/profile");
            } else if (!onboardingComplete) {
                router.push("/onboarding");
            } else {
                router.push("/portal");
            }
        }
    }, [user, role, needsRoleSelect, profileCompleted, onboardingComplete, router]);

    /** Determine where to redirect after successful auth */
    const getRedirectPath = (isProfileDone: boolean, _isSurveyDone: boolean, isOnboardingDone: boolean): string => {
        if (!isProfileDone) return "/profile";
        // Survey is now optional — skip it in registration flow
        if (!isOnboardingDone) return "/onboarding";
        return "/portal";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (tab === "register") {
                const result = await signUp(email, password, email.split("@")[0], 3, registerRole);
                if (result.error) {
                    setError(result.error);
                } else if (result.needsEmailConfirmation) {
                    setSuccess("📧 Đã gửi email xác nhận! Vui lòng kiểm tra hộp thư (và thư rác) để kích hoạt tài khoản.");
                } else {
                    setSuccess("Đăng ký thành công!");
                    if (registerRole === 'parent') {
                        setTimeout(() => router.push("/dashboard/link"), 800);
                    } else {
                        setTimeout(() => router.push("/profile"), 800);
                    }
                }
            } else {
                const { error: err } = await signIn(email, password);
                if (err) {
                    setError(err);
                } else {
                    // Existing user → redirect based on completion status
                    // After signIn, auth state updates; use current known values
                    const path = getRedirectPath(profileCompleted, surveyCompleted, onboardingComplete);
                    router.push(path);
                }
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại!");
        }
        setLoading(false);
    };

    const handleOAuth = async (provider: "google" | "facebook") => {
        setError(null);
        const fn = provider === "google" ? signInWithGoogle : signInWithFacebook;
        const { error: err } = await fn();
        if (err) setError(err);
    };

    if (authLoading) {
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
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-3 animate-float">🌌</div>
                        <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text">
                            CosmoMosaic
                        </h1>
                        <p className="text-white/50 text-sm mt-1">Ghép tri thức, thắp sáng vũ trụ!</p>
                    </div>

                    <GlassCard glow="cyan" className="!p-0 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {(["login", "register"] as AuthTab[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                                    className={`flex-1 py-3 text-sm font-semibold transition-all relative ${tab === t ? "text-neon-cyan" : "text-white/40 hover:text-white/60"
                                        }`}
                                >
                                    {t === "login" ? "Đăng nhập" : "Đăng ký"}
                                    {tab === t && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, x: tab === "register" ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: tab === "register" ? -20 : 20 }}
                                    className="space-y-4"
                                >
                                    {/* Role selector for register */}
                                    {tab === "register" && (
                                        <div>
                                            <label className="block text-white/60 text-xs mb-2 font-medium">
                                                Bạn là ai? 🌟
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setRegisterRole("child")}
                                                    className={`p-3 rounded-xl border text-center transition-all ${registerRole === "child"
                                                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="text-2xl mb-1">👧</div>
                                                    <div className="text-xs font-bold">Học sinh</div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegisterRole("parent")}
                                                    className={`p-3 rounded-xl border text-center transition-all ${registerRole === "parent"
                                                        ? "border-purple-500/60 bg-purple-500/10 text-purple-300"
                                                        : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className="text-2xl mb-1">👨‍👩‍👧</div>
                                                    <div className="text-xs font-bold">Phụ huynh</div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email */}
                                    <div>
                                        <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                            Email 📧
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                            Mật khẩu 🔑
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu..."
                                            minLength={6}
                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                                            required
                                        />
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Error/Success */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-green-400 text-sm text-center bg-green-500/10 py-2 px-3 rounded-lg border border-green-500/20"
                                >
                                    {success}
                                </motion.div>
                            )}

                            {/* Submit */}
                            <NeonButton
                                variant="cyan"
                                size="lg"
                                onClick={() => handleSubmit(new Event('click') as unknown as React.FormEvent)}
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : tab === "login" ? "Đăng nhập 🚀" : "Đăng ký 🌟"}
                            </NeonButton>
                        </form>

                        {/* Divider */}
                        <div className="px-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/30 text-xs">hoặc</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* OAuth buttons */}
                        <div className="p-6 pt-4 space-y-3">
                            <button
                                onClick={() => handleOAuth("google")}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                Google
                            </button>
                            <button
                                onClick={() => handleOAuth("facebook")}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                Facebook
                            </button>
                        </div>
                    </GlassCard>

                    {/* Footer link */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => router.push("/")}
                            className="text-white/40 text-xs hover:text-white/60 transition-colors"
                        >
                            ← Quay lại trang chủ
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
