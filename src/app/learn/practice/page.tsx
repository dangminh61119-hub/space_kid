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
type PracticeMode = "select" | "flashcard" | "quiz" | "drill" | "ai-quiz" | "topic-quiz";

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
    const templates: Record<string, (FlashcardItem & { grade?: number })[]> = {
        math: [
            { id: "m1", front: "23 + 19 = ?", back: "42", subject: "math", emoji: "🔢", hint: "Nhớ cộng hàng đơn vị trước: 3+9=12, nhớ 1", grade: 2 },
            { id: "m2", front: "56 - 28 = ?", back: "28", subject: "math", emoji: "➖", hint: "6 < 8, cần mượn: 16-8=8, 4-2=2", grade: 2 },
            { id: "m3", front: "7 × 8 = ?", back: "56", subject: "math", emoji: "✖️", hint: "7×8 = 56 (nhớ: 56=7×8)", grade: 3 },
            { id: "m4", front: "100 cm = ? m", back: "1 m", subject: "math", emoji: "📏", hint: "100 cm luôn = 1 mét", grade: 3 },
            { id: "m5", front: "84 ÷ 4 = ?", back: "21", subject: "math", emoji: "➗", hint: "80÷4=20, 4÷4=1, tổng=21", grade: 3 },
            { id: "m6", front: "1000 g = ? kg", back: "1 kg", subject: "math", emoji: "⚖️", grade: 3 },
            { id: "m7", front: "Chu vi hình vuông cạnh 5cm?", back: "20 cm", subject: "math", emoji: "⬜", hint: "CV = 4 × cạnh = 4 × 5 = 20", grade: 3 },
            { id: "m8", front: "1/2 + 1/4 = ?", back: "3/4", subject: "math", emoji: "🔢", hint: "Quy đồng: 2/4 + 1/4 = 3/4", grade: 4 },
            { id: "m1a", front: "5 + 3 = ?", back: "8", subject: "math", emoji: "🔢", grade: 1 },
            { id: "m1b", front: "9 - 4 = ?", back: "5", subject: "math", emoji: "➖", grade: 1 },
            { id: "m1c", front: "2 + 7 = ?", back: "9", subject: "math", emoji: "🔢", grade: 1 },
            { id: "m5a", front: "3/5 + 1/5 = ?", back: "4/5", subject: "math", emoji: "🔢", grade: 5 },
            { id: "m5b", front: "25% của 200 = ?", back: "50", subject: "math", emoji: "📊", grade: 5 },
        ],
        english: [
            { id: "e1", front: "Cat", back: "Con mèo 🐱", subject: "english", emoji: "🐱", grade: 1 },
            { id: "e2", front: "Dog", back: "Con chó 🐶", subject: "english", emoji: "🐶", grade: 1 },
            { id: "e3", front: "Bird", back: "Con chim 🐦", subject: "english", emoji: "🐦", grade: 2 },
            { id: "e4", front: "Fish", back: "Con cá 🐟", subject: "english", emoji: "🐟", grade: 2 },
            { id: "e5", front: "Apple", back: "Quả táo 🍎", subject: "english", emoji: "🍎", grade: 1 },
            { id: "e6", front: "Hello!", back: "Xin chào! 👋", subject: "english", emoji: "👋", grade: 1 },
            { id: "e7", front: "Thank you", back: "Cảm ơn 🙏", subject: "english", emoji: "🙏", grade: 2 },
            { id: "e8", front: "Goodbye", back: "Tạm biệt 👋", subject: "english", emoji: "✨", grade: 2 },
            { id: "e3a", front: "Elephant", back: "Con voi 🐘", subject: "english", emoji: "🐘", grade: 3 },
            { id: "e4a", front: "Beautiful", back: "Xinh đẹp 🌸", subject: "english", emoji: "🌸", grade: 4 },
        ],
        vietnamese: [
            { id: "v1", front: "Từ \"sắc\" có dấu gì?", back: "Dấu sắc ( ́ )", subject: "vietnamese", emoji: "📖", grade: 1 },
            { id: "v2", front: "\"Quê hương\" nghĩa là gì?", back: "Homeland / Nơi sinh ra", subject: "vietnamese", emoji: "🏡", grade: 3 },
            { id: "v3", front: "Từ trái nghĩa của \"nóng\"?", back: "Lạnh ❄️", subject: "vietnamese", emoji: "🔥", grade: 2 },
            { id: "v4", front: "\"Biển\" thuộc loại từ gì?", back: "Danh từ", subject: "vietnamese", emoji: "🌊", grade: 3 },
            { id: "v5", front: "Tìm từ đồng nghĩa: \"xinh đẹp\"", back: "Đẹp, lộng lẫy, kiều diễm", subject: "vietnamese", emoji: "💐", grade: 4 },
            { id: "v1a", front: "Có mấy chữ cái trong bảng chữ cái?", back: "29 chữ cái", subject: "vietnamese", emoji: "📖", grade: 1 },
        ],
        science: [
            { id: "s1", front: "Cây cần gì để quang hợp?", back: "Ánh sáng + Nước + CO₂", subject: "science", emoji: "🌱", grade: 4 },
            { id: "s2", front: "Trái Đất quay quanh gì?", back: "Mặt Trời ☀️", subject: "science", emoji: "🌍", grade: 3 },
            { id: "s3", front: "Nước sôi ở bao nhiêu °C?", back: "100°C", subject: "science", emoji: "🌡️", grade: 3 },
            { id: "s4", front: "Động vật nào đẻ trứng?", back: "Gà, vịt, chim, rắn...", subject: "science", emoji: "🥚", grade: 2 },
        ],
        geography: [
            { id: "g1", front: "Thủ đô của Việt Nam?", back: "Hà Nội 🏙️", subject: "geography", emoji: "🇻🇳", grade: 3 },
            { id: "g2", front: "Sông dài nhất Việt Nam?", back: "Sông Mê Kông", subject: "geography", emoji: "🏞️", grade: 4 },
            { id: "g3", front: "Đà Nẵng thuộc miền nào?", back: "Miền Trung", subject: "geography", emoji: "🗺️", grade: 3 },
            { id: "g4", front: "Núi cao nhất Việt Nam?", back: "Fansipan (3143m)", subject: "geography", emoji: "⛰️", grade: 4 },
        ],
    };
    const all = templates[subject] || templates.math;
    const filtered = all.filter(c => !c.grade || c.grade === grade);
    return filtered; // only return grade-matched items, no fallback
}

function generateQuizQuestions(subject: string, grade: number): QuizQuestion[] {
    const templates: Record<string, (QuizQuestion & { grade?: number })[]> = {
        math: [
            { id: "mq1", question: "35 + 47 = ?", correctAnswer: "82", wrongAnswers: ["72", "81", "92"], subject: "math", bloomLevel: 1, explanation: "5+7=12, nhớ 1. 3+4+1=8. Vậy = 82", skillTag: "addition_carry", grade: 2 },
            { id: "mq2", question: "63 - 28 = ?", correctAnswer: "35", wrongAnswers: ["45", "25", "33"], subject: "math", bloomLevel: 1, explanation: "3<8, mượn 1: 13-8=5, 5-2=3. Vậy = 35", skillTag: "subtraction_borrow", grade: 2 },
            { id: "mq3", question: "6 × 7 = ?", correctAnswer: "42", wrongAnswers: ["36", "48", "49"], subject: "math", bloomLevel: 1, explanation: "6×7 = 42 (bảng cửu chương 6)", skillTag: "multiplication_table", grade: 3 },
            { id: "mq4", question: "3 km = ? m", correctAnswer: "3000", wrongAnswers: ["300", "30", "30000"], subject: "math", bloomLevel: 2, explanation: "1 km = 1000 m, nên 3 km = 3 × 1000 = 3000 m", skillTag: "unit_confusion", grade: 3 },
            { id: "mq5", question: "Diện tích hình vuông cạnh 6cm?", correctAnswer: "36 cm²", wrongAnswers: ["24 cm²", "12 cm²", "18 cm²"], subject: "math", bloomLevel: 2, explanation: "S = cạnh × cạnh = 6 × 6 = 36 cm²", grade: 3 },
            { id: "mq6", question: "45 + 38 = ?", correctAnswer: "83", wrongAnswers: ["73", "84", "93"], subject: "math", bloomLevel: 1, explanation: "5+8=13, nhớ 1. 4+3+1=8. Vậy = 83", skillTag: "addition_carry", grade: 2 },
            { id: "mq1a", question: "6 + 3 = ?", correctAnswer: "9", wrongAnswers: ["8", "7", "10"], subject: "math", bloomLevel: 1, explanation: "6 + 3 = 9", grade: 1 },
            { id: "mq1b", question: "8 - 5 = ?", correctAnswer: "3", wrongAnswers: ["2", "4", "5"], subject: "math", bloomLevel: 1, explanation: "8 - 5 = 3", grade: 1 },
            { id: "mq4a", question: "2/3 + 1/3 = ?", correctAnswer: "1", wrongAnswers: ["3/3", "2/6", "3/6"], subject: "math", bloomLevel: 2, explanation: "2/3 + 1/3 = 3/3 = 1", grade: 4 },
            { id: "mq5a", question: "15% của 200 = ?", correctAnswer: "30", wrongAnswers: ["15", "20", "35"], subject: "math", bloomLevel: 2, explanation: "15% × 200 = 0.15 × 200 = 30", grade: 5 },
        ],
        english: [
            { id: "eq1", question: "\"Elephant\" nghĩa là gì?", correctAnswer: "Con voi", wrongAnswers: ["Con hổ", "Con sư tử", "Con gấu"], subject: "english", bloomLevel: 1, skillTag: "vocabulary", grade: 3 },
            { id: "eq2", question: "Chọn từ đúng: \"She ___ a student\"", correctAnswer: "is", wrongAnswers: ["am", "are", "be"], subject: "english", bloomLevel: 2, grade: 4 },
            { id: "eq3", question: "\"Beautiful\" nghĩa là gì?", correctAnswer: "Xinh đẹp", wrongAnswers: ["Xấu xí", "Cao lớn", "Thông minh"], subject: "english", bloomLevel: 1, skillTag: "vocabulary", grade: 4 },
            { id: "eq4", question: "Đếm bằng tiếng Anh: 1, 2, ___, 4, 5", correctAnswer: "three", wrongAnswers: ["tree", "free", "thr"], subject: "english", bloomLevel: 1, grade: 2 },
            { id: "eq1a", question: "\"Cat\" nghĩa là gì?", correctAnswer: "Con mèo", wrongAnswers: ["Con chó", "Con cá", "Con gà"], subject: "english", bloomLevel: 1, grade: 1 },
            { id: "eq1b", question: "\"Red\" nghĩa là gì?", correctAnswer: "Màu đỏ", wrongAnswers: ["Màu xanh", "Màu vàng", "Màu trắng"], subject: "english", bloomLevel: 1, grade: 1 },
        ],
        vietnamese: [
            { id: "vq1", question: "\"Hòn ngọc Viễn Đông\" là thành phố nào?", correctAnswer: "TP. Hồ Chí Minh", wrongAnswers: ["Hà Nội", "Đà Nẵng", "Huế"], subject: "vietnamese", bloomLevel: 2, grade: 4 },
            { id: "vq2", question: "Từ nào là tính từ?", correctAnswer: "Xinh đẹp", wrongAnswers: ["Chạy", "Bàn", "Rất"], subject: "vietnamese", bloomLevel: 2, grade: 3 },
            { id: "vq3", question: "\"Mẹ\" có thanh gì?", correctAnswer: "Thanh nặng", wrongAnswers: ["Thanh sắc", "Thanh huyền", "Thanh hỏi"], subject: "vietnamese", bloomLevel: 1, skillTag: "dau_thanh", grade: 1 },
            { id: "vq1a", question: "Chữ cái đầu tiên trong bảng chữ cái là?", correctAnswer: "A", wrongAnswers: ["B", "Ă", "Â"], subject: "vietnamese", bloomLevel: 1, grade: 1 },
        ],
        science: [
            { id: "sq1", question: "Bộ phận nào giúp cây hấp thụ nước?", correctAnswer: "Rễ cây", wrongAnswers: ["Lá cây", "Thân cây", "Hoa"], subject: "science", bloomLevel: 1, grade: 2 },
            { id: "sq2", question: "Vì sao có mưa?", correctAnswer: "Nước bốc hơi, ngưng tụ thành mây, rơi xuống", wrongAnswers: ["Trời buồn nên khóc", "Gió thổi mạnh", "Mặt trăng gần trái đất"], subject: "science", bloomLevel: 3, skillTag: "cause_effect", grade: 4 },
        ],
        geography: [
            { id: "gq1", question: "Huế thuộc miền nào?", correctAnswer: "Miền Trung", wrongAnswers: ["Miền Bắc", "Miền Nam", "Tây Nguyên"], subject: "geography", bloomLevel: 1, skillTag: "location_confusion", grade: 3 },
            { id: "gq2", question: "Đồng bằng rộng nhất VN?", correctAnswer: "Đồng bằng sông Cửu Long", wrongAnswers: ["Đồng bằng sông Hồng", "Đồng bằng Duyên hải", "Tây Nguyên"], subject: "geography", bloomLevel: 2, grade: 4 },
        ],
    };
    const all = templates[subject] || templates.math;
    const filtered = all.filter(q => !q.grade || q.grade === grade);
    return filtered; // only return grade-matched items, no fallback
}

/* ─── Practice Page Content ─── */
function PracticeContent() {
    const { player } = useGame();
    const { playerDbId, session } = useAuth();
    const searchParams = useSearchParams();
    const token = session?.access_token;

    const [mode, setMode] = useState<PracticeMode>("select");
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [drillErrorType, setDrillErrorType] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const playerId = playerDbId || "local";

    // AI quiz state
    const [aiQuizQuestions, setAiQuizQuestions] = useState<QuizQuestion[]>([]);
    const [aiQuizLoading, setAiQuizLoading] = useState(false);
    const [aiQuizTopic, setAiQuizTopic] = useState<string | null>(null);
    const [fromBaoBai, setFromBaoBai] = useState(false);
    const [baoBaiSessionId, setBaoBaiSessionId] = useState<string | null>(null);

    // Topic-based quiz state (from question_bank)
    const [topicQuizQuestions, setTopicQuizQuestions] = useState<QuizQuestion[]>([]);
    const [topicQuizLoading, setTopicQuizLoading] = useState(false);
    const [topicQuizId, setTopicQuizId] = useState<string | null>(null);
    const [topicQuizName, setTopicQuizName] = useState<string | null>(null);

    // Load profile & check URL params
    useEffect(() => {
        async function load() {
            const p = await getStudentProfile(playerId);
            setProfile(p);

            const focusParam = searchParams.get("focus");
            const subjectParam = searchParams.get("subject");
            const topicParam = searchParams.get("topic");
            const topicIdParam = searchParams.get("topic_id");
            const fromParam = searchParams.get("from");
            const sessionParam = searchParams.get("session");

            if (topicIdParam) {
                // Coming from SmartRecommendations → load from question_bank
                setTopicQuizId(topicIdParam);
                if (topicParam) setTopicQuizName(topicParam);
                if (subjectParam) setSelectedSubject(subjectParam);
                loadTopicQuiz(topicIdParam, subjectParam || undefined);
            } else if (topicParam && fromParam === "bao-bai") {
                // Coming from Báo bài → auto-start AI quiz
                setAiQuizTopic(topicParam);
                setFromBaoBai(true);
                if (subjectParam) setSelectedSubject(subjectParam);
                if (sessionParam) setBaoBaiSessionId(sessionParam);
                loadAiQuiz(topicParam, player.grade, subjectParam || undefined);
            } else if (focusParam) {
                setDrillErrorType(focusParam);
                setMode("drill");
            } else if (subjectParam) {
                setSelectedSubject(subjectParam);
            }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId]);

    // Load AI-generated quiz from SGK
    const loadAiQuiz = useCallback(async (topic: string, grade: number, subject?: string) => {
        setAiQuizLoading(true);
        setMode("ai-quiz");
        // Start learning session for tracking (BUG-7 fix)
        const sid = await startSession(playerId, "study", subject || "mixed");
        setSessionId(sid);
        try {
            const res = await fetch("/api/ai/practice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ topic, grade, subject, count: 5 }),
            });
            const data = await res.json();
            if (data.questions?.length > 0) {
                const formatted: QuizQuestion[] = data.questions.map((q: { question: string; options: string[]; correct: number; hint?: string; explanation?: string }, i: number) => ({
                    id: `ai-${i}`,
                    question: q.question,
                    correctAnswer: q.options[q.correct],
                    wrongAnswers: q.options.filter((_: string, idx: number) => idx !== q.correct),
                    subject: subject || "mixed",
                    bloomLevel: 2,
                    explanation: q.explanation || q.hint || "",
                }));
                setAiQuizQuestions(formatted);
            } else {
                setAiQuizQuestions([]);
            }
        } catch (err) {
            console.error("AI quiz error:", err);
            setAiQuizQuestions([]);
        } finally {
            setAiQuizLoading(false);
        }
    }, [playerId, token]);

    // Load topic-based quiz from question_bank
    const loadTopicQuiz = useCallback(async (topicId: string, subject?: string) => {
        setTopicQuizLoading(true);
        setMode("topic-quiz");
        // Start learning session for tracking (BUG-7 fix)
        const sid = await startSession(playerId, "study", subject || "mixed");
        setSessionId(sid);
        try {
            const params = new URLSearchParams({ topic_id: topicId, count: "10" });
            if (subject) params.set("subject", subject);
            const res = await fetch(`/api/practice/questions?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.questions?.length > 0) {
                setTopicQuizQuestions(data.questions.map((q: { id: string; question: string; correctAnswer: string; wrongAnswers: string[]; subject: string; bloomLevel: number; explanation: string }) => ({
                    id: q.id,
                    question: q.question,
                    correctAnswer: q.correctAnswer,
                    wrongAnswers: q.wrongAnswers,
                    subject: q.subject,
                    bloomLevel: q.bloomLevel,
                    explanation: q.explanation,
                })));
            } else {
                setTopicQuizQuestions([]);
            }
        } catch (err) {
            console.error("Topic quiz error:", err);
            setTopicQuizQuestions([]);
        } finally {
            setTopicQuizLoading(false);
        }
    }, [playerId, token]);

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
    const handleComplete = useCallback(async (results: {
        correct: number;
        incorrect: number;
        answers?: Array<{ questionId: string; isCorrect: boolean }>;
    }) => {
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

        // Update topic mastery if doing topic-based practice
        if (topicQuizId && token) {
            try {
                await fetch("/api/mastery", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        player_id: playerId,
                        topic_id: topicQuizId,
                        correct: results.correct,
                        total: results.correct + results.incorrect,
                    }),
                });
            } catch { /* silent */ }
        }

        // Auto-calibrate question difficulty based on real answer stats
        if (results.answers && results.answers.length > 0 && token) {
            try {
                await fetch("/api/practice/calibrate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ answers: results.answers }),
                });
            } catch { /* silent — calibration is non-critical */ }
        }
    }, [sessionId, playerId, selectedSubject, topicQuizId, token]);

    const handleExit = useCallback(() => {
        setMode("select");
        setSelectedSubject(null);
        setDrillErrorType(null);
        setSessionId(null);
        setTopicQuizId(null);
        setTopicQuizName(null);
        setTopicQuizQuestions([]);
    }, []);

    // ─── Render based on mode ───

    // Topic-based quiz from question_bank
    if (mode === "topic-quiz") {
        if (topicQuizLoading) {
            return (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 48, display: "inline-block" }}>📝</motion.div>
                    <p style={{ fontWeight: 700, marginTop: 12 }}>Đang tải câu hỏi...</p>
                    {topicQuizName && <p style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>Chủ đề: <strong>{topicQuizName}</strong></p>}
                </div>
            );
        }
        if (topicQuizQuestions.length === 0) {
            return (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                    <p style={{ fontWeight: 700 }}>Chưa có câu hỏi cho chủ đề này</p>
                    <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginTop: 16 }}>← Quay lại</button>
                </div>
            );
        }
        return (
            <div>
                <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginBottom: 16 }}>
                    ← Quay lại
                </button>
                {topicQuizName && (
                    <div className="learn-card" style={{ padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>🎯</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Luyện tập theo chủ đề</div>
                            <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>{topicQuizName}</div>
                        </div>
                    </div>
                )}
                <SmartQuiz
                    questions={topicQuizQuestions}
                    onComplete={async (results) => {
                        await handleComplete({ correct: results.correct, incorrect: results.incorrect, answers: results.answers });
                    }}
                    onExit={handleExit}
                />
            </div>
        );
    }

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
                        await handleComplete({ correct: results.correct, incorrect: results.incorrect, answers: results.answers });
                    }}
                    onExit={handleExit}
                />
            </div>
        );
    }

    if (mode === "drill" && drillErrorType) {
        // Map error types to their actual subject (BUG-5 fix)
        const ERROR_SUBJECT_MAP: Record<string, string> = {
            addition_carry: "math",
            subtraction_borrow: "math",
            multiplication_table: "math",
            unit_confusion: "math",
            spelling_double_consonant: "english",
            vocabulary_meaning: "english",
            dau_thanh: "vietnamese",
            cause_effect: "science",
            location_confusion: "geography",
        };
        const drillSubject = ERROR_SUBJECT_MAP[drillErrorType] || "math";
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

    // AI Quiz mode
    if (mode === "ai-quiz") {
        if (aiQuizLoading) {
            return (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 48, display: "inline-block" }}>🦉</motion.div>
                    <p style={{ fontWeight: 700, marginTop: 12 }}>Cú Mèo đang tạo bài tập từ SGK...</p>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>
                        Đang phân tích nội dung: <strong>{aiQuizTopic}</strong>
                    </p>
                </div>
            );
        }

        if (aiQuizQuestions.length === 0) {
            return (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                    <p style={{ fontWeight: 700 }}>Chưa tìm thấy nội dung SGK phù hợp</p>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 16 }}>
                        Thử chủ đề khác hoặc quay lại báo bài
                    </p>
                    <button className="learn-btn learn-btn-secondary" onClick={handleExit}>← Quay lại</button>
                </div>
            );
        }

        return (
            <div>
                <button className="learn-btn learn-btn-secondary" onClick={handleExit} style={{ marginBottom: 16 }}>
                    ← Quay lại
                </button>
                {fromBaoBai && aiQuizTopic && (
                    <div className="learn-card" style={{ padding: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>📋</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Bài tập từ Báo bài</div>
                            <div style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>{aiQuizTopic}</div>
                        </div>
                    </div>
                )}
                <SmartQuiz
                    questions={aiQuizQuestions}
                    onComplete={async (results) => {
                        await handleComplete({ correct: results.correct, incorrect: results.incorrect, answers: results.answers });
                        // Mark báo bài session as practiced
                        if (baoBaiSessionId && token) {
                            try {
                                await fetch("/api/study-sessions", {
                                    method: "PATCH",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ sessionId: baoBaiSessionId, practiced: true }),
                                });
                            } catch { /* silent */ }
                        }
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

                {/* AI from SGK mode */}
                <div className="learn-card practice-mode-card" style={{ borderColor: "rgba(16,185,129,0.3)" }}>
                    <div className="practice-mode-header">
                        <span className="practice-mode-emoji">🤖</span>
                        <h3 className="practice-mode-title">AI từ SGK</h3>
                    </div>
                    <p className="practice-mode-desc">Cú Mèo tạo câu hỏi từ nội dung sách giáo khoa — đúng bài, đúng chương trình</p>
                    <div className="practice-mode-subjects">
                        {SUBJECTS.map(s => (
                            <button
                                key={s.id}
                                className="practice-subject-btn"
                                onClick={() => {
                                    setSelectedSubject(s.id);
                                    loadAiQuiz(`Ôn tập ${s.label} lớp ${player.grade}`, player.grade, s.id);
                                }}
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
          gap: 12px;
        }
        .practice-drill-card { padding: 16px 18px; }

        .practice-modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }
        .practice-mode-card { 
          padding: 24px; 
          border-left: 4px solid var(--learn-accent-light);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .practice-mode-card:hover {
          border-left-color: var(--learn-accent);
        }

        .practice-mode-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .practice-mode-emoji { 
          font-size: 32px; 
          background: linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05));
          width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 16px;
          border: 1px solid var(--learn-card-border);
        }
        .practice-mode-title {
          font-family: var(--font-heading);
          font-size: 19px;
          font-weight: 800;
          color: var(--learn-text);
        }
        .practice-mode-desc {
          font-size: 13px;
          color: var(--learn-text-secondary);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .practice-mode-subjects {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .practice-subject-btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid;
          background: var(--learn-card-solid);
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-heading);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--learn-text);
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .practice-subject-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
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
