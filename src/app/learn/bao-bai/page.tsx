"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Types ─── */
interface RAGSource {
    content: string;
    chapter?: string;
    sectionTitle?: string;
    similarity: number;
    textbookTitle?: string;
    subject: string;
}

interface HomeworkSession {
    id: string;
    query: string;
    lesson: string;
    sources: RAGSource[];
    date: string;
    subject?: string;
}

const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢", color: "#8b5cf6" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖", color: "#ec4899" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍", color: "#06b6d4" },
    { id: "science", label: "Khoa học", emoji: "🔬", color: "#22c55e" },
    { id: "history", label: "Lịch sử & Địa lý", emoji: "🗺️", color: "#f59e0b" },
];

const QUICK_PROMPTS = [
    "Hôm nay em học phép cộng có nhớ",
    "Cô dạy bài tập đọc mới",
    "Hôm nay học về bảng cửu chương 7",
    "Em muốn ôn bài làm văn",
    "Thầy dạy bài về hình học",
];

export default function BaoBaiPage() {
    const { player } = useGame();
    const { session } = useAuth();
    const [query, setQuery] = useState("");
    const [subject, setSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ lesson: string; sources: RAGSource[] } | null>(null);
    const [sessions, setSessions] = useState<HomeworkSession[]>([]);
    const [showSources, setShowSources] = useState(false);
    const [error, setError] = useState("");

    const token = session?.access_token;

    // Load past sessions from localStorage 
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`bao_bai_${player.grade}`);
            if (saved) setSessions(JSON.parse(saved));
        } catch { /* ignore */ }
    }, [player.grade]);

    const saveSession = useCallback((newSession: HomeworkSession) => {
        setSessions(prev => {
            const updated = [newSession, ...prev].slice(0, 20); // Keep last 20
            localStorage.setItem(`bao_bai_${player.grade}`, JSON.stringify(updated));
            return updated;
        });
    }, [player.grade]);

    const handleSubmit = async (queryText?: string) => {
        const q = queryText || query;
        if (!q.trim() || !token) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/ai/rag", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: q,
                    grade: player.grade,
                    subject: subject || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Có lỗi xảy ra");
                return;
            }

            setResult({
                lesson: data.lesson,
                sources: data.sources || [],
            });

            // Save to history
            saveSession({
                id: Date.now().toString(),
                query: q,
                lesson: data.lesson,
                sources: data.sources || [],
                date: new Date().toISOString(),
                subject: subject || undefined,
            });
        } catch (err) {
            setError("Lỗi kết nối: " + String(err));
        } finally {
            setLoading(false);
        }
    };

    const todaySessions = sessions.filter(s => {
        const d = new Date(s.date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="learn-page-title">📋 Báo Bài Hằng Ngày</h1>
            <p className="learn-page-subtitle">
                Cho Cú Mèo biết hôm nay em học gì, Cú Mèo sẽ tìm bài trong sách giáo khoa cho em! 🦉
            </p>

            {/* Subject chooser */}
            <div className="learn-card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--learn-text-secondary)" }}>
                    📚 Chọn môn học (tùy chọn):
                </div>
                <div className="bao-bai-subjects">
                    {SUBJECTS.map(s => (
                        <motion.button
                            key={s.id}
                            className={`bao-bai-subject-btn ${subject === s.id ? "selected" : ""}`}
                            onClick={() => setSubject(subject === s.id ? null : s.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                "--subject-color": s.color,
                            } as React.CSSProperties}
                        >
                            <span style={{ fontSize: 20 }}>{s.emoji}</span>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Query input */}
            <div className="learn-card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "var(--learn-text-secondary)" }}>
                    ✏️ Hôm nay em học gì?
                </div>
                <div className="bao-bai-input-row">
                    <textarea
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="VD: Hôm nay thầy dạy bài nhân số có hai chữ số..."
                        rows={3}
                        className="bao-bai-textarea"
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <motion.button
                        className="learn-btn learn-btn-primary bao-bai-submit"
                        onClick={() => handleSubmit()}
                        disabled={loading || !query.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{ display: "inline-block" }}
                            >
                                🔍
                            </motion.span>
                        ) : "🚀 Tìm bài"}
                    </motion.button>
                </div>

                {/* Quick prompts */}
                <div className="bao-bai-quick-prompts">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={i}
                            className="bao-bai-quick-btn"
                            onClick={() => {
                                setQuery(prompt);
                                handleSubmit(prompt);
                            }}
                        >
                            💡 {prompt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="learn-card" style={{
                    padding: 16, marginBottom: 16,
                    borderColor: "#ef4444", background: "rgba(239,68,68,0.1)",
                }}>
                    <p style={{ color: "#fca5a5" }}>❌ {error}</p>
                </div>
            )}

            {/* Loading state */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="learn-card"
                        style={{ padding: 32, textAlign: "center", marginBottom: 16 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ fontSize: 48, marginBottom: 12 }}
                        >
                            🦉
                        </motion.div>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>Cú Mèo đang tìm bài trong sách giáo khoa...</p>
                        <p style={{ fontSize: 13, color: "var(--learn-text-secondary)" }}>
                            Đang phân tích nội dung và tạo bài học cho em
                        </p>
                        <div className="bao-bai-loading-bar">
                            <motion.div
                                className="bao-bai-loading-fill"
                                animate={{ width: ["0%", "70%", "90%", "95%"] }}
                                transition={{ duration: 8, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Lesson content */}
                        <div className="learn-card bao-bai-result" style={{ padding: 20, marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: 32 }}>🦉</span>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: 16 }}>Bài học từ Cú Mèo</h3>
                                    <p style={{ fontSize: 12, color: "var(--learn-text-secondary)" }}>
                                        Dựa trên sách giáo khoa Lớp {player.grade}
                                    </p>
                                </div>
                            </div>

                            <div className="bao-bai-lesson-content">
                                {result.lesson.split("\n").map((line, i) => {
                                    if (line.startsWith("##")) {
                                        return <h3 key={i} className="bao-bai-heading">{line.replace(/^#+\s*/, "")}</h3>;
                                    }
                                    if (line.startsWith("**") && line.endsWith("**")) {
                                        return <p key={i} style={{ fontWeight: 700, marginBottom: 8 }}>{line.replace(/\*\*/g, "")}</p>;
                                    }
                                    if (line.startsWith("- ") || line.startsWith("• ")) {
                                        return <li key={i} className="bao-bai-list-item">{line.replace(/^[-•]\s*/, "")}</li>;
                                    }
                                    if (line.trim() === "") return <br key={i} />;
                                    return <p key={i} className="bao-bai-paragraph">{line}</p>;
                                })}
                            </div>
                        </div>

                        {/* Sources */}
                        {result.sources.length > 0 && (
                            <div className="learn-card" style={{ padding: 16, marginBottom: 16 }}>
                                <button
                                    className="bao-bai-sources-toggle"
                                    onClick={() => setShowSources(!showSources)}
                                >
                                    <span>📚 Nguồn SGK ({result.sources.length} phần)</span>
                                    <span>{showSources ? "▲" : "▼"}</span>
                                </button>

                                <AnimatePresence>
                                    {showSources && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            {result.sources.map((src, i) => (
                                                <div key={i} className="bao-bai-source-item">
                                                    <div className="bao-bai-source-header">
                                                        <span className="bao-bai-source-title">
                                                            {src.textbookTitle || "SGK"}
                                                            {src.chapter && ` • ${src.chapter}`}
                                                        </span>
                                                        <span className="bao-bai-source-score">
                                                            {Math.round(src.similarity * 100)}% khớp
                                                        </span>
                                                    </div>
                                                    {src.sectionTitle && (
                                                        <div className="bao-bai-source-section">
                                                            📄 {src.sectionTitle}
                                                        </div>
                                                    )}
                                                    <p className="bao-bai-source-content">
                                                        {src.content.substring(0, 200)}...
                                                    </p>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* New query button */}
                        <motion.button
                            className="learn-btn learn-btn-secondary"
                            onClick={() => { setResult(null); setQuery(""); }}
                            style={{ width: "100%", padding: 14 }}
                            whileHover={{ scale: 1.01 }}
                        >
                            📝 Báo bài mới
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Today's sessions */}
            {!result && !loading && todaySessions.length > 0 && (
                <div className="learn-card" style={{ padding: 16, marginTop: 16 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                        📅 Bài đã báo hôm nay ({todaySessions.length})
                    </h3>
                    {todaySessions.map(s => (
                        <button
                            key={s.id}
                            className="bao-bai-history-item"
                            onClick={() => setResult({ lesson: s.lesson, sources: s.sources })}
                        >
                            <span className="bao-bai-history-query">{s.query}</span>
                            <span className="bao-bai-history-time">
                                {new Date(s.date).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <style jsx>{`
                .bao-bai-subjects {
                    display: flex; gap: 8px; flex-wrap: wrap;
                }
                .bao-bai-subject-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                    padding: 12px 16px; border-radius: 12px;
                    border: 2px solid var(--learn-border); background: var(--learn-card);
                    cursor: pointer; transition: all 0.2s; min-width: 80px;
                }
                .bao-bai-subject-btn:hover {
                    border-color: var(--subject-color, var(--learn-accent));
                    transform: translateY(-1px);
                }
                .bao-bai-subject-btn.selected {
                    border-color: var(--subject-color, var(--learn-accent));
                    background: color-mix(in srgb, var(--subject-color, var(--learn-accent)) 15%, transparent);
                    box-shadow: 0 0 12px color-mix(in srgb, var(--subject-color, var(--learn-accent)) 20%, transparent);
                }

                .bao-bai-input-row {
                    display: flex; gap: 10px; align-items: flex-end;
                }
                .bao-bai-textarea {
                    flex: 1; padding: 12px; border-radius: 10px;
                    border: 2px solid var(--learn-border); background: var(--learn-bg-alt);
                    color: var(--learn-text); font-size: 15px; resize: none;
                    font-family: inherit; line-height: 1.5;
                    transition: border-color 0.2s;
                }
                .bao-bai-textarea:focus {
                    outline: none; border-color: var(--learn-accent);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
                }
                .bao-bai-submit {
                    padding: 12px 24px !important; white-space: nowrap;
                    font-size: 15px !important; height: fit-content;
                }

                .bao-bai-quick-prompts {
                    display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px;
                }
                .bao-bai-quick-btn {
                    padding: 6px 12px; border-radius: 20px;
                    border: 1px solid var(--learn-border); background: var(--learn-bg-alt);
                    color: var(--learn-text-secondary); font-size: 12px;
                    cursor: pointer; transition: all 0.2s;
                }
                .bao-bai-quick-btn:hover {
                    background: var(--learn-accent-light); 
                    border-color: var(--learn-accent);
                    color: var(--learn-text);
                }

                .bao-bai-loading-bar {
                    width: 200px; height: 4px; background: var(--learn-border);
                    border-radius: 2px; margin: 16px auto 0; overflow: hidden;
                }
                .bao-bai-loading-fill {
                    height: 100%; background: linear-gradient(90deg, var(--learn-accent), #8b5cf6);
                    border-radius: 2px;
                }

                .bao-bai-result {
                    border-left: 4px solid var(--learn-accent);
                }
                .bao-bai-lesson-content {
                    line-height: 1.8; font-size: 15px;
                }
                .bao-bai-heading {
                    font-family: var(--font-heading); font-weight: 800;
                    font-size: 17px; margin: 16px 0 8px; color: var(--learn-accent);
                }
                .bao-bai-list-item {
                    margin-left: 20px; margin-bottom: 4px;
                    list-style-type: disc;
                }
                .bao-bai-paragraph {
                    margin-bottom: 8px;
                }

                .bao-bai-sources-toggle {
                    display: flex; justify-content: space-between; align-items: center;
                    width: 100%; padding: 8px 4px; background: none; border: none;
                    color: var(--learn-text-secondary); cursor: pointer;
                    font-size: 14px; font-weight: 600;
                }
                .bao-bai-source-item {
                    padding: 12px; margin-top: 8px; border-radius: 8px;
                    background: var(--learn-bg-alt); border: 1px solid var(--learn-border);
                }
                .bao-bai-source-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 4px;
                }
                .bao-bai-source-title {
                    font-weight: 700; font-size: 13px;
                }
                .bao-bai-source-score {
                    font-size: 11px; padding: 2px 8px; border-radius: 4px;
                    background: rgba(34,197,94,0.15); color: #86efac;
                }
                .bao-bai-source-section {
                    font-size: 12px; color: var(--learn-text-secondary); margin-bottom: 6px;
                }
                .bao-bai-source-content {
                    font-size: 12px; color: var(--learn-text-secondary);
                    line-height: 1.4; white-space: pre-wrap;
                }

                .bao-bai-history-item {
                    display: flex; justify-content: space-between; align-items: center;
                    width: 100%; padding: 10px 12px; margin-bottom: 6px;
                    border-radius: 8px; border: 1px solid var(--learn-border);
                    background: var(--learn-bg-alt); cursor: pointer;
                    transition: all 0.2s; text-align: left;
                }
                .bao-bai-history-item:hover {
                    border-color: var(--learn-accent);
                    background: var(--learn-accent-light);
                }
                .bao-bai-history-query {
                    font-size: 13px; font-weight: 600; color: var(--learn-text);
                }
                .bao-bai-history-time {
                    font-size: 11px; color: var(--learn-text-secondary);
                }

                @media (max-width: 768px) {
                    .bao-bai-input-row { flex-direction: column; }
                    .bao-bai-submit { width: 100%; }
                    .bao-bai-subjects { gap: 6px; }
                    .bao-bai-subject-btn { min-width: 60px; padding: 8px 10px; }
                }
            `}</style>
        </motion.div>
    );
}
