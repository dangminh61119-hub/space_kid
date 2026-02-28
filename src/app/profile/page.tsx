"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { useGame } from "@/lib/game-context";
import { useAuth, saveProfileData, type ProfileFormData } from "@/lib/auth-context";

const GRADES = [1, 2, 3, 4, 5];
const SUBJECTS = [
    { id: "toan", label: "Toán", emoji: "🔢" },
    { id: "tieng-viet", label: "Tiếng Việt", emoji: "📖" },
    { id: "tu-nhien", label: "Tự nhiên & XH", emoji: "🌿" },
    { id: "tieng-anh", label: "Tiếng Anh", emoji: "🌍" },
    { id: "khoa-hoc", label: "Khoa học", emoji: "🔬" },
];

const steps = ["child", "school", "parent"] as const;
type Step = (typeof steps)[number];

export default function ProfilePage() {
    const router = useRouter();
    const { updatePlayer } = useGame();
    const { playerDbId, profileCompleted, setProfileDone } = useAuth();

    const [currentStep, setCurrentStep] = useState<Step>("child");
    const [childName, setChildName] = useState("");
    const [grade, setGrade] = useState(3);
    const [birthday, setBirthday] = useState("");
    const [school, setSchool] = useState("");
    const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
    const [parentEmail, setParentEmail] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already completed
    useEffect(() => {
        if (profileCompleted) {
            router.push("/survey");
        }
    }, [profileCompleted, router]);

    const stepIndex = steps.indexOf(currentStep);

    const nextStep = () => {
        const next = steps[stepIndex + 1];
        if (next) setCurrentStep(next);
    };

    const prevStep = () => {
        const prev = steps[stepIndex - 1];
        if (prev) setCurrentStep(prev);
    };

    const toggleSubject = (id: string) => {
        setFavoriteSubjects((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!parentEmail.trim()) {
            setError("Vui lòng nhập email phụ huynh!");
            return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
            setError("Email không hợp lệ!");
            return;
        }
        setError(null);
        setSaving(true);

        const data: ProfileFormData = {
            childName: childName.trim() || "Tân Binh",
            grade,
            birthday: birthday || undefined,
            school: school.trim() || undefined,
            favoriteSubjects: favoriteSubjects.length > 0 ? favoriteSubjects : undefined,
            parentEmail: parentEmail.trim(),
            parentName: parentName.trim() || undefined,
            parentPhone: parentPhone.trim() || undefined,
        };

        try {
            if (playerDbId) {
                await saveProfileData(playerDbId, data);
            }
            updatePlayer({
                name: data.childName,
                grade: data.grade,
                profileCompleted: true,
                birthday: data.birthday,
                school: data.school,
                parentEmail: data.parentEmail,
                parentName: data.parentName,
                parentPhone: data.parentPhone,
                favoriteSubjects: data.favoriteSubjects
            });
            setProfileDone();
            router.push("/survey");
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại!");
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-20">
            <StarField count={60} />

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-neon-gold to-neon-orange"
                    animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                <AnimatePresence mode="wait">
                    {/* ─── STEP 1: Child Info ─── */}
                    {currentStep === "child" && (
                        <motion.div
                            key="child"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-float">👩‍🚀</div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-2">
                                Thông tin Phi hành gia
                            </h1>
                            <p className="text-white/50 text-sm mb-6">
                                Cho chúng mình biết thêm về em nhé!
                            </p>

                            <GlassCard glow="gold" className="text-left space-y-5 mb-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Tên học sinh 🧑‍🚀
                                    </label>
                                    <input
                                        type="text"
                                        value={childName}
                                        onChange={(e) => setChildName(e.target.value)}
                                        placeholder="Nhập tên của em..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>

                                {/* Grade */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Lớp đang học 📚
                                    </label>
                                    <div className="flex gap-2">
                                        {GRADES.map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGrade(g)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${grade === g
                                                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-105"
                                                    : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                                                    }`}
                                            >
                                                Lớp {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Birthday */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Ngày sinh 🎂 <span className="text-white/30">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={birthday}
                                        onChange={(e) => setBirthday(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </GlassCard>

                            <NeonButton variant="gold" size="lg" onClick={nextStep}>
                                Tiếp tục →
                            </NeonButton>
                        </motion.div>
                    )}

                    {/* ─── STEP 2: School & Subjects ─── */}
                    {currentStep === "school" && (
                        <motion.div
                            key="school"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-float">🏫</div>
                            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-2">
                                Trường học & Sở thích
                            </h2>
                            <p className="text-white/50 text-sm mb-6">
                                Giúp chúng mình tạo trải nghiệm tốt hơn!
                            </p>

                            <GlassCard glow="cyan" className="text-left space-y-5 mb-6">
                                {/* School */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Trường học 🏫 <span className="text-white/30">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={school}
                                        onChange={(e) => setSchool(e.target.value)}
                                        placeholder="VD: Trường TH Nguyễn Du"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                                    />
                                </div>

                                {/* Favorite Subjects */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-2 font-medium">
                                        Môn yêu thích 💕 <span className="text-white/30">(chọn nhiều nếu muốn)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => toggleSubject(s.id)}
                                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${favoriteSubjects.includes(s.id)
                                                    ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 scale-105"
                                                    : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                                                    }`}
                                            >
                                                <span>{s.emoji}</span>
                                                <span>{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>

                            <div className="flex gap-3">
                                <button
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    ← Quay lại
                                </button>
                                <div className="flex-1">
                                    <NeonButton variant="cyan" size="lg" onClick={nextStep}>
                                        Tiếp tục →
                                    </NeonButton>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STEP 3: Parent Info ─── */}
                    {currentStep === "parent" && (
                        <motion.div
                            key="parent"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-float">👨‍👩‍👧</div>
                            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-2">
                                Thông tin Phụ huynh
                            </h2>
                            <p className="text-white/50 text-sm mb-6">
                                Để gửi báo cáo tiến độ học tập cho bố mẹ!
                            </p>

                            <GlassCard glow="magenta" className="text-left space-y-5 mb-6">
                                {/* Parent Email - Required */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Email phụ huynh 📧 <span className="text-neon-magenta">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={parentEmail}
                                        onChange={(e) => { setParentEmail(e.target.value); setError(null); }}
                                        placeholder="email@example.com"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-white/30 text-[10px] mt-1">
                                        Chúng tôi sẽ gửi báo cáo tiến độ học tập qua email này
                                    </p>
                                </div>

                                {/* Parent Name */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Tên phụ huynh 👤 <span className="text-white/30">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={parentName}
                                        onChange={(e) => setParentName(e.target.value)}
                                        placeholder="Nhập tên bố/mẹ..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                    />
                                </div>

                                {/* Parent Phone */}
                                <div>
                                    <label className="block text-white/60 text-xs mb-1.5 font-medium">
                                        Số điện thoại 📱 <span className="text-white/30">(không bắt buộc)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={parentPhone}
                                        onChange={(e) => setParentPhone(e.target.value)}
                                        placeholder="0912 345 678"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                    />
                                </div>
                            </GlassCard>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20 mb-4"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    ← Quay lại
                                </button>
                                <div className="flex-1">
                                    <NeonButton
                                        variant="magenta"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={saving}
                                    >
                                        {saving ? "Đang lưu..." : "Hoàn tất ✨"}
                                    </NeonButton>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
