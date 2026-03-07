"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import AITutorChat from "@/components/learn/AITutorChat";
import { getStudentProfile, getAIContext, getTopErrors, formatErrorType, type StudentProfile } from "@/lib/services/student-profile-service";

/* ─── Subjects for topic chooser ─── */
const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍" },
    { id: "science", label: "Khoa học", emoji: "🔬" },
    { id: "geography", label: "Địa lý", emoji: "🗺️" },
    { id: "history", label: "Lịch sử", emoji: "📜" },
    { id: null, label: "Tự do", emoji: "💬" },
];

export default function LearnTutorPage() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const [loading, setLoading] = useState(true);

    const playerId = playerDbId || "local";

    useEffect(() => {
        getStudentProfile(playerId).then(p => {
            setProfile(p);
            setLoading(false);
        });
    }, [playerId]);

    // Build student context for AI
    const studentContext = useMemo(() => ({
        name: player.name,
        grade: player.grade,
        profileContext: profile ? getAIContext(profile) : "",
        currentSubject: selectedSubject || undefined,
    }), [player.name, player.grade, profile, selectedSubject]);

    // Suggested topics based on errors
    const suggestedTopics = useMemo(() => {
        const topics: string[] = [];
        if (profile) {
            const errors = getTopErrors(profile, 2);
            for (const { type } of errors) {
                const label = formatErrorType(type);
                topics.push(`Em hay sai về ${label}, giúp em cách khắc phục`);
            }
        }

        // Add subject-specific suggestions
        if (selectedSubject === "math") {
            topics.push("Giải thích phép cộng có nhớ cho em");
            topics.push("Cho em bài tập về bảng cửu chương");
        } else if (selectedSubject === "vietnamese") {
            topics.push("Giúp em phân biệt dấu hỏi và dấu ngã");
            topics.push("Dạy em cách đặt câu có từ đồng nghĩa");
        } else if (selectedSubject === "english") {
            topics.push("Teach me 5 new words about animals");
            topics.push("Giúp em chia động từ 'to be'");
        } else if (selectedSubject === "science") {
            topics.push("Tại sao trời lại mưa?");
            topics.push("Cây cần gì để sống?");
        } else {
            topics.push("Em muốn ôn bài hôm nay");
            topics.push("Cho em một câu đố vui");
        }

        return topics.slice(0, 4);
    }, [profile, selectedSubject]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 60 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ fontSize: 48, display: "inline-block" }}>🦉</motion.div>
                <p style={{ color: "var(--learn-text-secondary)", marginTop: 12 }}>Cú Mèo đang chuẩn bị...</p>
            </div>
        );
    }

    // Subject selection screen
    if (!started) {
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="learn-page-title">🤖 Gia sư Cú Mèo</h1>
                <p className="learn-page-subtitle">AI trợ giảng cá nhân, hiểu rõ cách học của {player.name}</p>

                {/* Owl card */}
                <div className="learn-card tutor-intro-card">
                    <div className="tutor-intro-header">
                        <motion.span
                            className="tutor-intro-owl"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            🦉
                        </motion.span>
                        <div>
                            <h2 className="tutor-intro-title">Xin chào, {player.name}!</h2>
                            <p className="tutor-intro-desc">
                                Cú Mèo biết rõ điểm mạnh, điểm yếu của em và sẽ dạy theo cách phù hợp nhất.
                                Hãy chọn môn muốn học hoặc chat tự do!
                            </p>
                        </div>
                    </div>

                    {/* AI capabilities */}
                    <div className="tutor-capabilities">
                        <div className="tutor-cap-item">
                            <span>🧠</span>
                            <span>Phương pháp Socratic</span>
                        </div>
                        <div className="tutor-cap-item">
                            <span>📊</span>
                            <span>Hiểu hồ sơ học tập</span>
                        </div>
                        <div className="tutor-cap-item">
                            <span>💡</span>
                            <span>Giải thích từng bước</span>
                        </div>
                        <div className="tutor-cap-item">
                            <span>🎯</span>
                            <span>Sửa lỗi thường gặp</span>
                        </div>
                    </div>
                </div>

                {/* Subject chooser */}
                <h3 className="tutor-section-title">📚 Chọn môn học</h3>
                <div className="tutor-subject-grid">
                    {SUBJECTS.map(s => (
                        <motion.button
                            key={s.id || "free"}
                            className={`tutor-subject-btn ${selectedSubject === s.id ? "selected" : ""}`}
                            onClick={() => setSelectedSubject(s.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span className="tutor-subject-emoji">{s.emoji}</span>
                            <span className="tutor-subject-label">{s.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Start */}
                <motion.button
                    className="learn-btn learn-btn-primary tutor-start-btn"
                    onClick={() => setStarted(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    💬 Bắt đầu trò chuyện
                </motion.button>

                <style jsx>{`
          .tutor-intro-card { padding: 24px; margin-bottom: 24px; }
          .tutor-intro-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
          .tutor-intro-owl { font-size: 44px; display: inline-block; }
          .tutor-intro-title { font-family: var(--font-heading); font-size: 20px; font-weight: 800; margin-bottom: 4px; }
          .tutor-intro-desc { font-size: 14px; color: var(--learn-text-secondary); line-height: 1.5; }

          .tutor-capabilities {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
          }
          .tutor-cap-item {
            display: flex; align-items: center; gap: 8px; padding: 10px 14px;
            background: var(--learn-bg-alt); border-radius: 10px;
            font-size: 13px; font-weight: 600;
          }

          .tutor-section-title {
            font-family: var(--font-heading); font-size: 16px; font-weight: 700;
            margin-bottom: 12px;
          }

          .tutor-subject-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px; margin-bottom: 24px;
          }
          .tutor-subject-btn {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            padding: 16px 12px; border-radius: 14px;
            border: 2px solid var(--learn-border); background: var(--learn-card);
            cursor: pointer; transition: all 0.2s;
          }
          .tutor-subject-btn:hover { border-color: var(--learn-accent-light); }
          .tutor-subject-btn.selected {
            border-color: var(--learn-accent); background: var(--learn-accent-light);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
          }
          .tutor-subject-emoji { font-size: 28px; }
          .tutor-subject-label { font-size: 13px; font-weight: 700; color: var(--learn-text); }

          .tutor-start-btn {
            width: 100%; padding: 16px; font-size: 17px;
            display: flex; justify-content: center;
          }

          @media (max-width: 768px) {
            .tutor-capabilities { grid-template-columns: 1fr; }
            .tutor-subject-grid { grid-template-columns: repeat(3, 1fr); }
          }
        `}</style>
            </motion.div>
        );
    }

    // Chat mode
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                    <h1 className="learn-page-title" style={{ marginBottom: 2 }}>
                        🦉 Cú Mèo {selectedSubject ? `• ${SUBJECTS.find(s => s.id === selectedSubject)?.label}` : "• Chat tự do"}
                    </h1>
                </div>
                <button
                    className="learn-btn learn-btn-secondary"
                    onClick={() => setStarted(false)}
                    style={{ fontSize: 12 }}
                >
                    ← Đổi môn
                </button>
            </div>
            <AITutorChat
                studentContext={studentContext}
                suggestedTopics={suggestedTopics}
            />
        </div>
    );
}
