"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import LessonPlayer, { type LessonData } from "@/components/learn/LessonPlayer";
import { getStudentProfile, getTopErrors, formatErrorType, type StudentProfile } from "@/lib/services/student-profile-service";
import { startSession, endSession } from "@/lib/services/learning-session-service";

/* ─── Full lesson catalog ─── */
const LESSON_CATALOG: LessonData[] = [
    // ── TOÁN ──
    { id: "m01", title: "Phép cộng có nhớ", subject: "math", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "12 phút", durationSeconds: 720, description: "Cách thực hiện phép cộng khi tổng hàng đơn vị ≥ 10", relatedPractice: "addition_carry", chapter: "Chương 2", tags: ["cộng", "nhớ", "số học"] },
    { id: "m02", title: "Phép cộng có nhớ nâng cao", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "14 phút", durationSeconds: 840, description: "Phép cộng có nhớ với số có 3-4 chữ số", relatedPractice: "addition_carry", chapter: "Chương 2", tags: ["cộng", "nhớ", "nâng cao"] },
    { id: "m03", title: "Phép trừ có nhớ", subject: "math", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "10 phút", durationSeconds: 600, description: "Hiểu rõ cách mượn và trừ với số có 2 chữ số", relatedPractice: "subtraction_borrow", chapter: "Chương 3", tags: ["trừ", "mượn"] },
    { id: "m04", title: "Phép trừ có nhớ nâng cao", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "13 phút", durationSeconds: 780, description: "Trừ số có 3-4 chữ số với đa lượt mượn", relatedPractice: "subtraction_borrow", chapter: "Chương 3", tags: ["trừ", "nâng cao"] },
    { id: "m05", title: "Bảng cửu chương 2, 3, 4, 5", subject: "math", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "15 phút", durationSeconds: 900, description: "Bảng cửu chương cơ bản và mẹo nhớ nhanh", relatedPractice: "multiplication_table", chapter: "Chương 5", tags: ["nhân", "bảng cửu chương"] },
    { id: "m06", title: "Bảng cửu chương 6, 7, 8, 9", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "14 phút", durationSeconds: 840, description: "Mẹo nhớ nhanh bảng cửu chương 6, 7, 8, 9", relatedPractice: "multiplication_table", chapter: "Chương 5", tags: ["nhân", "nâng cao"] },
    { id: "m07", title: "Đơn vị đo độ dài", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "11 phút", durationSeconds: 660, description: "mm, cm, dm, m, km — cách chuyển đổi dễ hiểu", relatedPractice: "unit_confusion", chapter: "Chương 4", tags: ["đo lường", "đơn vị", "độ dài"] },
    { id: "m08", title: "Đơn vị đo khối lượng", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "9 phút", durationSeconds: 540, description: "g, kg, tấn — khi nào dùng đơn vị nào?", relatedPractice: "unit_confusion", chapter: "Chương 4", tags: ["đo lường", "khối lượng"] },
    { id: "m09", title: "Hình vuông và hình chữ nhật", subject: "math", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "12 phút", durationSeconds: 720, description: "Chu vi và diện tích hình vuông, hình chữ nhật", chapter: "Chương 6", tags: ["hình học", "chu vi", "diện tích"] },
    { id: "m10", title: "Phân số cơ bản", subject: "math", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "16 phút", durationSeconds: 960, description: "Hiểu phân số, so sánh phân số, quy đồng", chapter: "Chương 7", tags: ["phân số", "so sánh"] },

    // ── TIẾNG VIỆT ──
    { id: "v01", title: "Dấu thanh tiếng Việt", subject: "vietnamese", grade: 1, youtubeId: "dQw4w9WgXcQ", duration: "9 phút", durationSeconds: 540, description: "Luyện phát âm và viết đúng 6 thanh điệu", relatedPractice: "dau_thanh", chapter: "Phần 1", tags: ["dấu thanh", "phát âm"] },
    { id: "v02", title: "Tập viết chữ hoa", subject: "vietnamese", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "10 phút", durationSeconds: 600, description: "Cách viết 29 chữ cái hoa theo đúng quy tắc", chapter: "Phần 2", tags: ["viết", "chữ hoa"] },
    { id: "v03", title: "Từ đồng nghĩa & trái nghĩa", subject: "vietnamese", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "11 phút", durationSeconds: 660, description: "Cách phân biệt và sử dụng từ đồng nghĩa, trái nghĩa", chapter: "Phần 3", tags: ["từ vựng", "đồng nghĩa", "trái nghĩa"] },
    { id: "v04", title: "Câu kể, câu hỏi, câu cảm thán", subject: "vietnamese", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "8 phút", durationSeconds: 480, description: "Nhận biết và đặt các loại câu", chapter: "Phần 4", tags: ["ngữ pháp", "loại câu"] },
    { id: "v05", title: "Tập đọc diễn cảm", subject: "vietnamese", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "13 phút", durationSeconds: 780, description: "Kỹ thuật đọc diễn cảm, ngắt nghỉ đúng chỗ", chapter: "Phần 5", tags: ["đọc", "diễn cảm"] },

    // ── TIẾNG ANH ──
    { id: "e01", title: "Animals — Từ vựng con vật", subject: "english", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "8 phút", durationSeconds: 480, description: "Học từ vựng về con vật qua hình ảnh và âm thanh", relatedPractice: "vocabulary_meaning", chapter: "Unit 3", tags: ["vocabulary", "animals"] },
    { id: "e02", title: "Colors & Shapes", subject: "english", grade: 1, youtubeId: "dQw4w9WgXcQ", duration: "7 phút", durationSeconds: 420, description: "Tên các màu sắc và hình dạng bằng tiếng Anh", relatedPractice: "vocabulary_meaning", chapter: "Unit 2", tags: ["vocabulary", "colors", "shapes"] },
    { id: "e03", title: "Family Members", subject: "english", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "9 phút", durationSeconds: 540, description: "Father, mother, sister, brother... và cách giới thiệu gia đình", chapter: "Unit 5", tags: ["vocabulary", "family"] },
    { id: "e04", title: "Numbers 1-100", subject: "english", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "10 phút", durationSeconds: 600, description: "Đếm số từ 1 đến 100, nhận biết và phát âm", chapter: "Unit 1", tags: ["numbers", "counting"] },
    { id: "e05", title: "Present Simple Tense", subject: "english", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "12 phút", durationSeconds: 720, description: "Thì hiện tại đơn — cấu trúc và cách dùng", chapter: "Unit 7", tags: ["grammar", "tenses"] },

    // ── KHOA HỌC ──
    { id: "s01", title: "Cây cần gì để sống?", subject: "science", grade: 2, youtubeId: "dQw4w9WgXcQ", duration: "10 phút", durationSeconds: 600, description: "Tìm hiểu về nhu cầu của cây: nước, ánh sáng, đất, không khí", chapter: "Bài 5", tags: ["thực vật", "quang hợp"] },
    { id: "s02", title: "Cơ thể người", subject: "science", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "14 phút", durationSeconds: 840, description: "Các bộ phận và chức năng cơ bản của cơ thể", chapter: "Bài 1", tags: ["cơ thể", "sinh học"] },
    { id: "s03", title: "Vòng tuần hoàn nước", subject: "science", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "12 phút", durationSeconds: 720, description: "Nước bốc hơi, ngưng tụ, tạo mây và mưa", relatedPractice: "cause_effect", chapter: "Bài 8", tags: ["nước", "tuần hoàn", "khí hậu"] },

    // ── ĐỊA LÝ ──
    { id: "g01", title: "Bản đồ Việt Nam", subject: "geography", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "15 phút", durationSeconds: 900, description: "Khám phá vị trí 63 tỉnh thành trên bản đồ", relatedPractice: "location_confusion", chapter: "Bài 3", tags: ["bản đồ", "tỉnh thành"] },
    { id: "g02", title: "Ba miền Việt Nam", subject: "geography", grade: 3, youtubeId: "dQw4w9WgXcQ", duration: "11 phút", durationSeconds: 660, description: "Đặc điểm Bắc, Trung, Nam — văn hoá, khí hậu, con người", relatedPractice: "location_confusion", chapter: "Bài 2", tags: ["miền", "văn hoá"] },
    { id: "g03", title: "Sông ngòi Việt Nam", subject: "geography", grade: 4, youtubeId: "dQw4w9WgXcQ", duration: "13 phút", durationSeconds: 780, description: "Các con sông lớn và vai trò trong đời sống", chapter: "Bài 5", tags: ["sông", "tự nhiên"] },
];

const SUBJECT_FILTERS = [
    { id: "all", label: "Tất cả", emoji: "📚" },
    { id: "math", label: "Toán", emoji: "🔢" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍" },
    { id: "science", label: "Khoa học", emoji: "🔬" },
    { id: "geography", label: "Địa lý", emoji: "🗺️" },
];

const SUBJECT_COLORS: Record<string, string> = {
    math: "var(--learn-math)",
    vietnamese: "var(--learn-vietnamese)",
    english: "var(--learn-english)",
    science: "var(--learn-science)",
    geography: "var(--learn-geography)",
    history: "var(--learn-history)",
};

const GRADE_FILTERS = [
    { id: 0, label: "Tất cả lớp" },
    { id: 1, label: "Lớp 1" },
    { id: 2, label: "Lớp 2" },
    { id: 3, label: "Lớp 3" },
    { id: 4, label: "Lớp 4" },
    { id: 5, label: "Lớp 5" },
];

/* ─── Watch history local storage ─── */
const WATCH_KEY = "cosmomosaic_lesson_watch";

function getWatchHistory(): Record<string, { seconds: number; lastWatched: string }> {
    try {
        const saved = localStorage.getItem(WATCH_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
}

function saveWatchHistory(lessonId: string, seconds: number) {
    try {
        const history = getWatchHistory();
        history[lessonId] = {
            seconds: Math.max(history[lessonId]?.seconds || 0, seconds),
            lastWatched: new Date().toISOString(),
        };
        localStorage.setItem(WATCH_KEY, JSON.stringify(history));
    } catch { /* ignore */ }
}

/* ─── Page ─── */
export default function LearnLessonsPage() {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [gradeFilter, setGradeFilter] = useState(0); // will set to player.grade in useEffect
    const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [watchHistory, setWatchHistory] = useState<Record<string, { seconds: number; lastWatched: string }>>({});
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        setWatchHistory(getWatchHistory());
        getStudentProfile(playerDbId || "local").then(setProfile);
        if (player.grade >= 1 && player.grade <= 5) {
            setGradeFilter(player.grade);
        }
    }, [playerDbId, player.grade]);

    // AI recommendations based on error patterns
    const recommendations = useMemo(() => {
        if (!profile) return [];
        const topErrors = getTopErrors(profile, 3);
        const recommended: LessonData[] = [];

        for (const { type } of topErrors) {
            const match = LESSON_CATALOG.find(l =>
                l.relatedPractice === type &&
                !watchHistory[l.id]?.seconds
            );
            if (match) recommended.push(match);
        }

        return recommended;
    }, [profile, watchHistory]);

    // Filtered lessons
    const filteredLessons = useMemo(() => {
        return LESSON_CATALOG.filter(l => {
            if (subjectFilter !== "all" && l.subject !== subjectFilter) return false;
            if (gradeFilter > 0 && l.grade !== gradeFilter) return false;
            return true;
        });
    }, [subjectFilter, gradeFilter]);

    // Watch handler
    const handleWatched = async (lessonId: string, seconds: number) => {
        saveWatchHistory(lessonId, seconds);
        setWatchHistory(getWatchHistory());

        if (sessionId) {
            await endSession(playerDbId || "local", sessionId, {
                questionsTotal: 0,
                questionsCorrect: 0,
            });
            setSessionId(null);
        }
    };

    const handleOpenLesson = async (lesson: LessonData) => {
        setActiveLesson(lesson);
        const sid = await startSession(playerDbId || "local", "lesson", lesson.subject);
        setSessionId(sid);
    };

    const watchedCount = Object.keys(watchHistory).length;

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="learn-page-title">📺 Bài Giảng</h1>
            <p className="learn-page-subtitle">
                Video bài giảng theo chương trình SGK
                {watchedCount > 0 && <span style={{ marginLeft: 8, color: "var(--learn-success)" }}>• Đã xem {watchedCount} bài</span>}
            </p>

            {/* Active Player */}
            {activeLesson && (
                <LessonPlayer
                    lesson={activeLesson}
                    onClose={() => setActiveLesson(null)}
                    onWatched={handleWatched}
                />
            )}

            {/* AI Recommendations */}
            {!activeLesson && recommendations.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div className="learn-card" style={{ borderLeft: "4px solid var(--learn-accent)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <span style={{ fontSize: 32 }}>🦉</span>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                                    Cú Mèo gợi ý cho bạn
                                </h3>
                                <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 12 }}>
                                    Dựa trên những lỗi em hay gặp, hãy xem các bài giảng này:
                                </p>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {recommendations.map(lesson => (
                                        <motion.button
                                            key={lesson.id}
                                            className="learn-btn learn-btn-primary"
                                            style={{ fontSize: 12, padding: "8px 14px" }}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleOpenLesson(lesson)}
                                        >
                                            {SUBJECT_FILTERS.find(f => f.id === lesson.subject)?.emoji} {lesson.title}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cú Mèo tip when no recommendations */}
            {!activeLesson && recommendations.length === 0 && (
                <div className="learn-card" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: 36 }}>🦉</span>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>
                        Xem bài giảng rồi làm bài tập ngay sẽ nhớ lâu hơn! 🌟
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="lessons-filters">
                {/* Subject */}
                <div className="lessons-filter-row">
                    {SUBJECT_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSubjectFilter(f.id)}
                            className={`lessons-filter-btn ${subjectFilter === f.id ? "active" : ""}`}
                        >
                            <span>{f.emoji}</span> {f.label}
                        </button>
                    ))}
                </div>
                {/* Grade */}
                <div className="lessons-filter-row">
                    {GRADE_FILTERS.map(g => (
                        <button
                            key={g.id}
                            onClick={() => setGradeFilter(g.id)}
                            className={`lessons-filter-btn lessons-grade-btn ${gradeFilter === g.id ? "active" : ""}`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <p style={{ fontSize: 13, color: "var(--learn-text-secondary)", marginBottom: 12, fontWeight: 600 }}>
                {filteredLessons.length} bài giảng
            </p>

            {/* Lesson Grid */}
            <div className="lessons-grid">
                {filteredLessons.map((lesson, index) => {
                    const watched = watchHistory[lesson.id];
                    const isWatched = watched && lesson.durationSeconds > 0 && (watched.seconds / lesson.durationSeconds) >= 0.5;
                    const isActive = activeLesson?.id === lesson.id;

                    return (
                        <motion.div
                            key={lesson.id}
                            className={`learn-card lessons-card ${isActive ? "lessons-card-active" : ""}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOpenLesson(lesson)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Thumbnail */}
                            <div className="lessons-thumbnail" style={{ borderColor: SUBJECT_COLORS[lesson.subject] || "var(--learn-accent)" }}>
                                <span className="lessons-thumbnail-play">▶</span>
                                <span className="lessons-thumbnail-duration">{lesson.duration}</span>
                                {isWatched && <span className="lessons-thumbnail-watched">✅</span>}
                            </div>

                            <div className="lessons-card-content">
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <span
                                        className="learn-badge"
                                        style={{
                                            background: `${SUBJECT_COLORS[lesson.subject] || "var(--learn-accent)"}20`,
                                            color: SUBJECT_COLORS[lesson.subject] || "var(--learn-accent)",
                                            fontSize: 11, padding: "2px 8px",
                                        }}
                                    >
                                        {SUBJECT_FILTERS.find(f => f.id === lesson.subject)?.label || lesson.subject}
                                    </span>
                                    <span style={{ fontSize: 11, color: "var(--learn-text-secondary)" }}>Lớp {lesson.grade}</span>
                                    {lesson.chapter && (
                                        <span style={{ fontSize: 10, color: "var(--learn-text-secondary)", opacity: 0.7 }}>{lesson.chapter}</span>
                                    )}
                                </div>
                                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--learn-text)" }}>
                                    {lesson.title}
                                </h3>
                                {lesson.tags && (
                                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                                        {lesson.tags.slice(0, 3).map(tag => (
                                            <span key={tag} style={{ fontSize: 10, color: "var(--learn-accent)", background: "var(--learn-bg-alt)", padding: "1px 6px", borderRadius: 4 }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredLessons.length === 0 && (
                <div className="learn-card" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có bài giảng phù hợp</p>
                    <p style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>
                        Thử chọn lớp hoặc môn khác nhé!
                    </p>
                </div>
            )}

            <style jsx>{`
        .lessons-filters { margin-bottom: 16px; }

        .lessons-filter-row {
          display: flex; gap: 6px; margin-bottom: 8px; overflow-x: auto;
          padding-bottom: 2px; -ms-overflow-style: none; scrollbar-width: none;
        }
        .lessons-filter-row::-webkit-scrollbar { display: none; }

        .lessons-filter-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 7px 12px; border-radius: 99px;
          border: 1px solid var(--learn-border); background: var(--learn-card);
          color: var(--learn-text-secondary); font-size: 12px; font-weight: 600;
          white-space: nowrap; cursor: pointer; transition: all 0.2s;
        }
        .lessons-filter-btn:hover { border-color: var(--learn-accent-light); }
        .lessons-filter-btn.active {
          background: var(--learn-accent); color: white; border-color: var(--learn-accent);
        }
        .lessons-grade-btn.active {
          background: var(--learn-success); border-color: var(--learn-success);
        }

        .lessons-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;
        }

        .lessons-card { padding: 0; overflow: hidden; }
        .lessons-card-active { border-color: var(--learn-accent); box-shadow: 0 0 0 2px var(--learn-accent-light); }

        .lessons-thumbnail {
          position: relative; width: 100%; height: 130px;
          background: linear-gradient(135deg, var(--learn-bg-alt), var(--learn-border));
          display: flex; align-items: center; justify-content: center;
          border-bottom: 3px solid;
        }
        .lessons-thumbnail-play {
          width: 42px; height: 42px; background: var(--learn-accent); color: white;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 15px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .lessons-thumbnail-duration {
          position: absolute; bottom: 6px; right: 6px;
          background: rgba(0,0,0,0.75); color: white;
          padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600;
        }
        .lessons-thumbnail-watched {
          position: absolute; top: 6px; right: 6px; font-size: 18px;
          background: white; border-radius: 50%; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .lessons-card-content { padding: 10px 12px; }

        @media (max-width: 768px) {
          .lessons-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .lessons-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </motion.div>
    );
}
