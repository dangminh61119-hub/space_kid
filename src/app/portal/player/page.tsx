"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import AchievementBadge, { ACHIEVEMENTS } from "@/components/AchievementBadge";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Achievement unlock logic ─── */
function computeUnlockedAchievements(player: ReturnType<typeof useGame>["player"]): string[] {
    const unlocked: string[] = [...player.achievements];

    const addIfMissing = (id: string) => {
        if (!unlocked.includes(id)) unlocked.push(id);
    };

    // Journey-based achievements
    if (player.journeysCompleted >= 1 || player.cosmo >= 100) addIfMissing("first_win");

    // streak_3: đã chơi đủ 3 ngày liên tiếp
    if (player.streak >= 3) addIfMissing("streak_3");

    // cosmo_1000: tích lũy đủ Cosmo từ gameplay thực sự
    if (player.cosmo >= 1000) addIfMissing("xp_1000");

    // level_5: level cao từ gameplay thực
    if (player.level >= 5) addIfMissing("level_5");

    // planet_master: hoàn thành ít nhất 1 hành trình
    if (player.journeysCompleted >= 1) addIfMissing("planet_master");

    // multi_planet: hoàn thành 3 hành trình
    if (player.journeysCompleted >= 3) addIfMissing("multi_planet");

    // calm_explorer: đã kích hoạt calm mode (hành động có chủ đích)
    if (player.calmMode) addIfMissing("calm_explorer");

    // galaxy_legend: milestone lớn
    if (player.level >= 10) addIfMissing("galaxy_legend");

    return unlocked;
}

/* ─── Class title helper ─── */
const CLASS_TITLES: Record<string, string> = {
    warrior: "Chiến binh Sao Băng",
    wizard: "Phù thủy Tinh Vân",
    hunter: "Thợ săn Ngân Hà",
};

const GRADES = [1, 2, 3, 4, 5];
const MASCOT_OPTIONS = [
    { id: "cat" as const, emoji: "🐱", name: "Mèo Sao Băng" },
    { id: "dog" as const, emoji: "🐶", name: "Cún Tinh Vân" },
];
const CLASS_OPTIONS = [
    { id: "warrior" as const, emoji: "🛡️", name: "Chiến binh" },
    { id: "wizard" as const, emoji: "⏳", name: "Phù thủy" },
    { id: "hunter" as const, emoji: "🎯", name: "Thợ săn" },
];

export default function PlayerPage() {
    const router = useRouter();
    const { player, updatePlayer, resetGame, unlockAchievement } = useGame();
    const { linkCode, regenerateLinkCode } = useAuth();

    /* ── Edit form state ── */
    const [editName, setEditName] = useState(player.name);
    const [editGrade, setEditGrade] = useState(player.grade);
    const [editMascot, setEditMascot] = useState(player.mascot);
    const [editClass, setEditClass] = useState(player.playerClass);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    /* ── Reset confirmation ── */
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    /* ── Compute achievements ── */
    const unlockedIds = computeUnlockedAchievements(player);

    /* Sync achievements to context when computed */
    useEffect(() => {
        unlockedIds.forEach((id) => unlockAchievement(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cosmoProgress = ((player.cosmo % 500) / 500) * 100;
    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const classInfo = player.playerClass ? CLASS_ABILITIES[player.playerClass] : null;


    /* ── Save handler ── */
    const handleSave = () => {
        setSaving(true);
        updatePlayer({
            name: editName.trim() || player.name,
            grade: editGrade,
            mascot: editMascot,
            playerClass: editClass,
        });
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 600);
    };

    /* ── Reset handler ── */
    const handleReset = async () => {
        await resetGame();
        router.push("/onboarding");
    };

    return (
        <div className="min-h-screen relative">
            <StarField count={60} />
            <Navbar />

            <div className="relative z-10 pt-20 pb-16 max-w-4xl mx-auto px-4">
                {/* Back link */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Link
                        href="/portal"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
                    >
                        ← Bản đồ Vũ trụ
                    </Link>
                </motion.div>

                {/* ── Hero: Avatar + Name + Level ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-8"
                >
                    <GlassCard glow="magenta" className="relative overflow-hidden">
                        {/* BG gradient */}
                        <div
                            className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(ellipse at top left, var(--neon-magenta), transparent 60%), radial-gradient(ellipse at bottom right, var(--neon-cyan), transparent 60%)",
                            }}
                        />

                        <div className="relative flex flex-col sm:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center text-6xl animate-float"
                                    style={{
                                        background: "rgba(255,107,255,0.1)",
                                        border: "2px solid rgba(255,107,255,0.3)",
                                        boxShadow: "0 0 30px rgba(255,107,255,0.2)",
                                    }}
                                >
                                    {mascotEmoji}
                                </div>
                                {/* Level badge */}
                                <div
                                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{
                                        background: "var(--neon-gold)",
                                        color: "#0A0E27",
                                        boxShadow: "0 0 12px rgba(255,224,102,0.6)",
                                    }}
                                >
                                    {player.level}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-white mb-0.5">
                                    {player.name}
                                </h1>
                                <p className="text-white/50 text-sm mb-3">
                                    {player.playerClass
                                        ? CLASS_TITLES[player.playerClass]
                                        : "Tân Binh"}{" "}
                                    · Lớp {player.grade}
                                </p>

                                {/* Link Code for parents */}
                                <div className="mb-3">
                                    {linkCode ? (
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2">
                                            <span className="text-white/40 text-xs">🔗 Mã liên kết:</span>
                                            <span
                                                className="text-neon-cyan font-bold font-mono tracking-[0.2em] text-sm cursor-pointer hover:text-white transition-colors"
                                                title="Nhấn để sao chép"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(linkCode);
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                }}
                                            >
                                                {linkCode}
                                            </span>
                                            <span className="text-white/30 text-[10px]">{copied ? "✅" : "📋"}</span>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2">
                                            <span className="text-white/40 text-xs">🔗 Mã đã được sử dụng</span>
                                            <button
                                                onClick={async () => {
                                                    setRegenerating(true);
                                                    await regenerateLinkCode();
                                                    setRegenerating(false);
                                                }}
                                                disabled={regenerating}
                                                className="text-xs font-medium text-neon-cyan hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                {regenerating ? "⏳" : "🔄 Tạo mã mới"}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-white/25 text-[10px] mt-1">
                                        Gửi mã này cho phụ huynh để liên kết tài khoản
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-white/50 mb-1.5">
                                        <span>Level {player.level}</span>
                                        <span>
                                            {player.cosmo % 500} / 500 ✦ để lên cấp
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background:
                                                    "linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta))",
                                                boxShadow: "0 0 8px rgba(0,245,255,0.5)",
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cosmoProgress}%` }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Class ability badge */}
                            {classInfo && (
                                <div
                                    className="shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl"
                                    style={{
                                        background: "rgba(255,224,102,0.08)",
                                        border: "1px solid rgba(255,224,102,0.2)",
                                    }}
                                >
                                    <span className="text-2xl">{classInfo.icon}</span>
                                    <span className="text-[10px] text-amber-400 font-bold text-center max-w-[80px] leading-tight">
                                        {classInfo.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* ── Stats Grid ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
                >
                    {[
                        { label: "Cấp độ", value: player.level, icon: "⭐", color: "var(--neon-gold)" },
                        { label: "Tổng ✦", value: player.cosmo.toLocaleString(), icon: "✦", color: "var(--neon-cyan)" },
                        { label: "Streak", value: `${player.streak} 🔥`, icon: "🔥", color: "#FF6B6B" },
                        { label: "Hành trình", value: `${player.journeysCompleted}/10`, icon: "🗺️", color: "var(--neon-magenta)" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                        >
                            <GlassCard glow="none" className="!p-4 text-center">
                                <div
                                    className="text-2xl font-bold mb-1"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ── Achievements ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <GlassCard glow="cyan">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold font-[var(--font-heading)] text-white">
                                    🏅 Thành tích
                                </h2>
                                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                    {unlockedIds.length}/{ACHIEVEMENTS.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {ACHIEVEMENTS.map((ach, i) => (
                                    <AchievementBadge
                                        key={ach.id}
                                        achievement={ach}
                                        unlocked={unlockedIds.includes(ach.id)}
                                        index={i}
                                    />
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* ── Planet Progress ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GlassCard glow="none">
                            <h2 className="text-lg font-bold font-[var(--font-heading)] text-white mb-5">
                                🗺️ Hành trình Di sản
                            </h2>
                            <div className="text-center py-8">
                                <div className="text-5xl mb-3">🗺️</div>
                                <p className="text-white/50 text-sm">
                                    {player.journeysCompleted > 0
                                        ? `Đã hoàn thành ${player.journeysCompleted}/10 hành trình`
                                        : "Chưa hoàn thành hành trình nào"}
                                </p>
                                <p className="text-white/25 text-xs mt-1">Vào Bản đồ để bắt đầu hành trình!</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* ── Edit Profile ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-6"
                >
                    <GlassCard glow="gold">
                        <h2 className="text-lg font-bold font-[var(--font-heading)] text-white mb-5">
                            ✏️ Chỉnh sửa Hồ sơ
                        </h2>

                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                    Tên phi hành gia 🧑‍🚀
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Tên của em..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm"
                                />
                            </div>

                            {/* Grade */}
                            <div>
                                <label className="block text-white/60 text-xs mb-2 font-medium">
                                    Lớp đang học 📚
                                </label>
                                <div className="flex gap-2">
                                    {GRADES.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setEditGrade(g)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${editGrade === g
                                                ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-105"
                                                : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mascot */}
                            <div>
                                <label className="block text-white/60 text-xs mb-2 font-medium">
                                    Mascot đồng hành 🐾
                                </label>
                                <div className="flex gap-3">
                                    {MASCOT_OPTIONS.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setEditMascot(m.id)}
                                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${editMascot === m.id
                                                ? "bg-pink-500/15 border-pink-500/40 scale-105"
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                                }`}
                                        >
                                            <span className="text-2xl">{m.emoji}</span>
                                            <span
                                                className={`text-[11px] font-medium ${editMascot === m.id ? "text-pink-300" : "text-white/50"
                                                    }`}
                                            >
                                                {m.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Class */}
                            <div>
                                <label className="block text-white/60 text-xs mb-2 font-medium">
                                    Lớp nhân vật ⚔️
                                </label>
                                <div className="flex gap-2">
                                    {CLASS_OPTIONS.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setEditClass(c.id)}
                                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${editClass === c.id
                                                ? "bg-cyan-500/15 border-cyan-500/40 scale-105"
                                                : "bg-white/5 border-white/10 hover:border-white/20"
                                                }`}
                                        >
                                            <span className="text-xl">{c.emoji}</span>
                                            <span
                                                className={`text-[11px] font-medium ${editClass === c.id ? "text-cyan-300" : "text-white/50"
                                                    }`}
                                            >
                                                {c.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="mt-6 flex items-center gap-3">
                            <NeonButton
                                variant="gold"
                                size="md"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Đang lưu..." : saved ? "✓ Đã lưu!" : "Lưu thay đổi"}
                            </NeonButton>

                            <AnimatePresence>
                                {saved && (
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm text-green-400"
                                    >
                                        ✨ Hồ sơ đã được cập nhật!
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* ── Danger Zone ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                >
                    <GlassCard glow="none" className="border border-red-500/20">
                        <h2 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
                            ⚠️ Vùng nguy hiểm
                        </h2>
                        <p className="text-white/40 text-sm mb-4">
                            Reset hành trình sẽ xóa toàn bộ tiến trình, Cosmo và thành tích. Không thể hoàn tác!
                        </p>
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all"
                        >
                            🔄 Reset Hành trình
                        </button>
                    </GlassCard>
                </motion.div>
            </div>

            {/* ── Reset Confirm Dialog ── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowResetConfirm(false)}
                        />
                        <motion.div
                            className="relative z-10 w-full max-w-sm"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <GlassCard glow="none" className="border border-red-500/30 text-center">
                                <div className="text-5xl mb-4">😱</div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Bạn có chắc không?
                                </h3>
                                <p className="text-white/50 text-sm mb-6">
                                    Chỉ huy Cú Mèo 🦉 sẽ rất buồn nếu em bỏ hành trình! Toàn bộ tiến trình sẽ bị xóa vĩnh viễn.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        className="flex-1 py-3 rounded-xl font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-all text-sm"
                                    >
                                        Không, ở lại!
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                                    >
                                        Xác nhận Reset
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
