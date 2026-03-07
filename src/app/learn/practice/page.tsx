"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import Flashcard, { type FlashcardItem } from "@/components/learn/Flashcard";
import SmartQuiz, { type QuizQuestion } from "@/components/learn/SmartQuiz";
import ErrorDrill from "@/components/learn/ErrorDrill";
import { getStudentProfile, getTopErrors, formatErrorType, type StudentProfile } from "@/lib/services/student-profile-service";
import { updateProfileAfterSession } from "@/lib/services/student-profile-service";
import { startSession, endSession } from "@/lib/services/learning-session-service";

/* ─── Practice Modes ─── */
type PracticeMode = "select" | "flashcard" | "quiz" | "drill";

/* ─── Subjects ─── */
const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢", color: "var(--learn-math)" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖", color: "var(--learn-vietnamese)" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍", color: "var(--learn-english)" },
    { id: "science", label: "Khoa học", emoji: "🔬", color: "var(--learn-science)" },
    { id: "geography", label: "Địa lý", emoji: "🗺️", color: "var(--learn-geography)" },
];

/* ─── Sample Data Generators ─── */

function generateFlashcards(subject: string, grade: number): FlashcardItem[] {
    const templates: Record<string, FlashcardItem[]> = {
        math: [
            { id: "m1", front: "23 + 19 = ?", back: "42", subject: "math", emoji: "🔢", hint: "Nhớ cộng hàng đơn vị trước: 3+9=12, nhớ 1" },
            { id: "m2", front: "56 - 28 = ?", back: "28", subject: "math", emoji: "➖", hint: "6 < 8, cần mượn: 16-8=8, 4-2=2" },
            { id: "m3", front: "7 × 8 = ?", back: "56", subject: "math", emoji: "✖️", hint: "7×8 = 56 (nhớ: 56=7×8)" },
            { id: "m4", front: "100 cm = ? m", back: "1 m", subject: "math", emoji: "📏", hint: "100 cm luôn = 1 mét" },
            { id: "m5", front: "84 ÷ 4 = ?", back: "21", subject: "math", emoji: "➗", hint: "80÷4=20, 4÷4=1, tổng=21" },
            { id: "m6", front: "1000 g = ? kg", back: "1 kg", subject: "math", emoji: "⚖️" },
            { id: "m7", front: "Chu vi hình vuông cạnh 5cm?", back: "20 cm", subject: "math", emoji: "⬜", hint: "CV = 4 × cạnh = 4 × 5 = 20" },
            { id: "m8", front: "1/2 + 1/4 = ?", back: "3/4", subject: "math", emoji: "🔢", hint: "Quy đồng: 2/4 + 1/4 = 3/4" },
        ],
        english: [
            { id: "e1", front: "Cat", back: "Con mèo 🐱", subject: "english", emoji: "🐱" },
            { id: "e2", front: "Dog", back: "Con chó 🐶", subject: "english", emoji: "🐶" },
            { id: "e3", front: "Bird", back: "Con chim 🐦", subject: "english", emoji: "🐦" },
            { id: "e4", front: "Fish", back: "Con cá 🐟", subject: "english", emoji: "🐟" },
            { id: "e5", front: "Apple", back: "Quả táo 🍎", subject: "english", emoji: "🍎" },
            { id: "e6", front: "Hello!", back: "Xin chào! 👋", subject: "english", emoji: "👋" },
            { id: "e7", front: "Thank you", back: "Cảm ơn 🙏", subject: "english", emoji: "🙏" },
            { id: "e8", front: "Goodbye", back: "Tạm biệt 👋", subject: "english", emoji: "✨" },
        ],
        vietnamese: [
            { id: "v1", front: "Từ \"sắc\" có dấu gì?", back: "Dấu sắc ( ́ )", subject: "vietnamese", emoji: "📖" },
            { id: "v2", front: "\"Quê hương\" nghĩa là gì?", back: "Homeland / Nơi sinh ra", subject: "vietnamese", emoji: "🏡" },
            { id: "v3", front: "Từ trái nghĩa của \"nóng\"?", back: "Lạnh ❄️", subject: "vietnamese", emoji: "🔥" },
            { id: "v4", front: "\"Biển\" thuộc loại từ gì?", back: "Danh từ", subject: "vietnamese", emoji: "🌊" },
            { id: "v5", front: "Tìm từ đồng nghĩa: \"xinh đẹp\"", back: "Đẹp, lộng lẫy, kiều diễm", subject: "vietnamese", emoji: "💐" },
        ],
        science: [
            { id: "s1", front: "Cây cần gì để quang hợp?", back: "Ánh sáng + Nước + CO₂", subject: "science", emoji: "🌱" },
            { id: "s2", front: "Trái Đất quay quanh gì?", back: "Mặt Trời ☀️", subject: "science", emoji: "🌍" },
            { id: "s3", front: "Nước sôi ở bao nhiêu °C?", back: "100°C", subject: "science", emoji: "🌡️" },
            { id: "s4", front: "Động vật nào đẻ trứng?", back: "Gà, vịt, chim, rắn...", subject: "science", emoji: "🥚" },
        ],
        geography: [
            { id: "g1", front: "Thủ đô của Việt Nam?", back: "Hà Nội 🏙️", subject: "geography", emoji: "🇻🇳" },
            { id: "g2", front: "Sông dài nhất Việt Nam?", back: "Sông Mê Kông", subject: "geography", emoji: "🏞️" },
            { id: "g3", front: "Đà Nẵng thuộc miền nào?", back: "Miền Trung", subject: "geography", emoji: "🗺️" },
            { id: "g4", front: "Núi cao nhất Việt Nam?", back: "Fansipan (3143m)", subject: "geography", emoji: "⛰️" },
        ],
    };
    return templates[subject] || templates.math;
}

function generateQuizQuestions(subject: string, grade: number): QuizQuestion[] {
    const templates: Record<string, QuizQuestion[]> = {
        math: [
            { id: "mq1", question: "35 + 47 = ?", correctAnswer: "82", wrongAnswers: ["72", "81", "92"], subject: "math", bloomLevel: 1, explanation: "5+7=12, nhớ 1. 3+4+1=8. Vậy = 82", skillTag: "addition_carry" },
            { id: "mq2", question: "63 - 28 = ?", correctAnswer: "35", wrongAnswers: ["45", "25", "33"], subject: "math", bloomLevel: 1, explanation: "3<8, mượn 1: 13-8=5, 5-2=3. Vậy = 35", skillTag: "subtraction_borrow" },
            { id: "mq3", question: "6 × 7 = ?", correctAnswer: "42", wrongAnswers: ["36", "48", "49"], subject: "math", bloomLevel: 1, explanation: "6×7 = 42 (bảng cửu chương 6)", skillTag: "multiplication_table" },
            { id: "mq4", question: "3 km = ? m", correctAnswer: "3000", wrongAnswers: ["300", "30", "30000"], subject: "math", bloomLevel: 2, explanation: "1 km = 1000 m, nên 3 km = 3 × 1000 = 3000 m", skillTag: "unit_confusion" },
            { id: "mq5", question: "Diện tích hình vuông cạnh 6cm?", correctAnswer: "36 cm²", wrongAnswers: ["24 cm²", "12 cm²", "18 cm²"], subject: "math", bloomLevel: 2, explanation: "S = cạnh × cạnh = 6 × 6 = 36 cm²" },
            { id: "mq6", question: "45 + 38 = ?", correctAnswer: "83", wrongAnswers: ["73", "84", "93"], subject: "math", bloomLevel: 1, explanation: "5+8=13, nhớ 1. 4+3+1=8. Vậy = 83", skillTag: "addition_carry" },
        ],
        english: [
            { id: "eq1", question: "\"Elephant\" nghĩa là gì?", correctAnswer: "Con voi", wrongAnswers: ["Con hổ", "Con sư tử", "Con gấu"], subject: "english", bloomLevel: 1, skillTag: "vocabulary" },
            { id: "eq2", question: "Chọn từ đúng: \"She ___ a student\"", correctAnswer: "is", wrongAnswers: ["am", "are", "be"], subject: "english", bloomLevel: 2 },
            { id: "eq3", question: "\"Beautiful\" nghĩa là gì?", correctAnswer: "Xinh đẹp", wrongAnswers: ["Xấu xí", "Cao lớn", "Thông minh"], subject: "english", bloomLevel: 1, skillTag: "vocabulary" },
            { id: "eq4", question: "Đếm bằng tiếng Anh: 1, 2, ___, 4, 5", correctAnswer: "three", wrongAnswers: ["tree", "free", "thr"], subject: "english", bloomLevel: 1 },
        ],
        vietnamese: [
            { id: "vq1", question: "\"Hòn ngọc Viễn Đông\" là thành phố nào?", correctAnswer: "TP. Hồ Chí Minh", wrongAnswers: ["Hà Nội", "Đà Nẵng", "Huế"], subject: "vietnamese", bloomLevel: 2 },
            { id: "vq2", question: "Từ nào là tính từ?", correctAnswer: "Xinh đẹp", wrongAnswers: ["Chạy", "Bàn", "Rất"], subject: "vietnamese", bloomLevel: 2 },
            { id: "vq3", question: "\"Mẹ\" có thanh gì?", correctAnswer: "Thanh nặng", wrongAnswers: ["Thanh sắc", "Thanh huyền", "Thanh hỏi"], subject: "vietnamese", bloomLevel: 1, skillTag: "dau_thanh" },
        ],
        science: [
            { id: "sq1", question: "Bộ phận nào giúp cây hấp thụ nước?", correctAnswer: "Rễ cây", wrongAnswers: ["Lá cây", "Thân cây", "Hoa"], subject: "science", bloomLevel: 1 },
            { id: "sq2", question: "Vì sao có mưa?", correctAnswer: "Nước bốc hơi, ngưng tụ thành mây, rơi xuống", wrongAnswers: ["Trời buồn nên khóc", "Gió thổi mạnh", "Mặt trăng gần trái đất"], subject: "science", bloomLevel: 3, skillTag: "cause_effect" },
        ],
        geography: [
            { id: "gq1", question: "Huế thuộc miền nào?", correctAnswer: "Miền Trung", wrongAnswers: ["Miền Bắc", "Miền Nam", "Tây Nguyên"], subject: "geography", bloomLevel: 1, skillTag: "location_confusion" },
            { id: "gq2", question: "Đồng bằng rộng nhất VN?", correctAnswer: "Đồng bằng sông Cửu Long", wrongAnswers: ["Đồng bằng sông Hồng", "Đồng bằng Duyên hải", "Tây Nguyên"], subject: "geography", bloomLevel: 2 },
        ],
    };
    return templates[subject] || templates.math;
}

/* ─── Practice Page Content ─── */
function PracticeContent() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const searchParams = useSearchParams();

    const [mode, setMode] = useState<PracticeMode>("select");
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [drillErrorType, setDrillErrorType] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const playerId = playerDbId || "local";

    // Load profile & check URL params
    useEffect(() => {
        async function load() {
            const p = await getStudentProfile(playerId);
            setProfile(p);

            const focusParam = searchParams.get("focus");
            const subjectParam = searchParams.get("subject");

            if (focusParam) {
                setDrillErrorType(focusParam);
                setMode("drill");
            } else if (subjectParam) {
                setSelectedSubject(subjectParam);
            }
        }
        load();
    }, [playerId, searchParams]);

    const topErrors = useMemo(() => profile ? getTopErrors(profile, 5) : [], [profile]);

    // Start a session when entering a practice mode
    const startPractice = useCallback(async (practiceMode: PracticeMode, subject?: string, errorType?: string) => {
        const sid = await startSession(playerId, "study", subject || "mixed");
        setSessionId(sid);
        setMode(practiceMode);
        if (subject) setSelectedSubject(subject);
        if (errorType) setDrillErrorType(errorType);
    }, [playerId]);

    // Handle completion
    const handleComplete = useCallback(async (results: { correct: number; incorrect: number }) => {
        if (sessionId) {
            await endSession(playerId, sessionId, {
                questionsTotal: results.correct + results.incorrect,
                questionsCorrect: results.correct,
            });
        }

        if (selectedSubject) {
            await updateProfileAfterSession(playerId, {
                subject: selectedSubject,
                questionsTotal: results.correct + results.incorrect,
                questionsCorrect: results.correct,
            });
        }
    }, [sessionId, playerId, selectedSubject]);

    const handleExit = useCallback(() => {
        setMode("select");
        setSelectedSubject(null);
        setDrillErrorType(null);
        setSessionId(null);
    }, []);

    // ─── Render based on mode ───

    if (mode === "flashcard" && selectedSubject) {
        const cards = generateFlashcards(selectedSubject, player.grade);
        return (
            <div>
                <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginBottom: 16 }}>
                    ← Quay lại
                </button>
                <Flashcard
                    cards={cards}
                    onComplete={async (results) => {
                        await handleComplete({ correct: results.correct, incorrect: results.incorrect });
                    }}
                    onExit={handleExit}
                />
            </div>
        );
    }

    if (mode === "quiz" && selectedSubject) {
        const questions = generateQuizQuestions(selectedSubject, player.grade);
        return (
            <div>
                <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginBottom: 16 }}>
                    ← Quay lại
                </button>
                <SmartQuiz
                    questions={questions}
                    onComplete={async (results) => {
                        await handleComplete({ correct: results.correct, incorrect: results.incorrect });
                    }}
                    onExit={handleExit}
                />
            </div>
        );
    }

    if (mode === "drill" && drillErrorType) {
        // Get questions for this error type (use math as fallback)
        const drillSubject = drillErrorType.split("_")[0] || "math";
        const questions = generateQuizQuestions(drillSubject, player.grade);
        return (
            <div>
                <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginBottom: 16 }}>
                    ← Quay lại
                </button>
                <ErrorDrill
                    errorType={drillErrorType}
                    questions={questions}
                    onComplete={async (results) => {
                        await handleComplete(results);
                    }}
                    onExit={handleExit}
                />
            </div>
        );
    }

    // ─── Mode Selection Screen ───
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="learn-page-title">📝 Luyện Tập</h1>
            <p className="learn-page-subtitle">Chọn chế độ luyện tập của bạn</p>

            {/* Error Drills — shown if student has tracked errors */}
            {topErrors.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h2 className="learn-card-title" style={{ marginBottom: 10 }}>🎯 Luyện sửa lỗi</h2>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 12 }}>
                        Bài tập được tạo đặc biệt cho những lỗi em hay mắc phải
                    </p>
                    <div className="practice-drills-grid">
                        {topErrors.map(({ type, pattern }) => (
                            <motion.div
                                key={type}
                                className="learn-card practice-drill-card"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => startPractice("drill", undefined, type)}
                                style={{ cursor: "pointer" }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>🎯 {formatErrorType(type)}</span>
                                    <span className="learn-badge learn-badge-warning">Sai {pattern.count}×</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Practice Modes */}
            <h2 className="learn-card-title" style={{ marginBottom: 10 }}>🎮 Chế độ luyện tập</h2>
            <div className="practice-modes-grid">
                {/* Flashcard mode */}
                <div className="learn-card practice-mode-card">
                    <div className="practice-mode-header">
                        <span className="practice-mode-emoji">🃏</span>
                        <h3 className="practice-mode-title">Flashcard</h3>
                    </div>
                    <p className="practice-mode-desc">Lật thẻ ôn nhanh — xem câu hỏi, lật để thấy đáp án</p>
                    <div className="practice-mode-subjects">
                        {SUBJECTS.map(s => (
                            <button
                                key={s.id}
                                className="practice-subject-btn"
                                onClick={() => startPractice("flashcard", s.id)}
                                style={{ borderColor: s.color }}
                            >
                                {s.emoji} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quiz mode */}
                <div className="learn-card practice-mode-card">
                    <div className="practice-mode-header">
                        <span className="practice-mode-emoji">📋</span>
                        <h3 className="practice-mode-title">Quiz trắc nghiệm</h3>
                    </div>
                    <p className="practice-mode-desc">Chọn đáp án đúng — có giải thích khi sai</p>
                    <div className="practice-mode-subjects">
                        {SUBJECTS.map(s => (
                            <button
                                key={s.id}
                                className="practice-subject-btn"
                                onClick={() => startPractice("quiz", s.id)}
                                style={{ borderColor: s.color }}
                            >
                                {s.emoji} {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .practice-drills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 10px;
        }
        .practice-drill-card { padding: 14px 16px; }

        .practice-modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .practice-mode-card { padding: 20px; }

        .practice-mode-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .practice-mode-emoji { font-size: 28px; }
        .practice-mode-title {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 700;
          color: var(--learn-text);
        }
        .practice-mode-desc {
          font-size: 13px;
          color: var(--learn-text-secondary);
          margin-bottom: 14px;
          line-height: 1.4;
        }

        .practice-mode-subjects {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .practice-subject-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: 2px solid;
          background: white;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--learn-text);
        }
        .practice-subject-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        @media (max-width: 768px) {
          .practice-modes-grid { grid-template-columns: 1fr; }
          .practice-drills-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </motion.div>
    );
}

/* ─── Page wrapper with Suspense ─── */
export default function LearnPracticePage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: "center", padding: 40 }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ fontSize: 48, display: "inline-block" }}
                >
                    🦉
                </motion.div>
                <p style={{ color: "var(--learn-text-secondary)", marginTop: 12 }}>Đang tải...</p>
            </div>
        }>
            <PracticeContent />
        </Suspense>
    );
}
