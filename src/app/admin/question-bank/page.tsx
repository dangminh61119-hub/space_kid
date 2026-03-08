"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

/* ─── Types ─── */
interface Topic {
    id: string;
    subject: string;
    grade: number;
    chapter: string;
    topic_name: string;
    topic_slug: string;
    question_count: number;
    lesson_count: number;
}

interface Question {
    id: string;
    topic_id: string;
    question_text: string;
    options: string[];
    correct_index: number;
    explanation: string;
    hint: string;
    bloom_level: number;
    difficulty: number;
    active: boolean;
    attempt_count?: number;
    correct_count?: number;
    calibrated_difficulty?: number | null;
    curriculum_topics?: { topic_name: string; chapter: string };
}

const SUBJECT_LABELS: Record<string, string> = {
    math: "🔢 Toán",
    vietnamese: "📖 Tiếng Việt",
    english: "🌍 Tiếng Anh",
    science: "🔬 Khoa học",
};

const BLOOM_LABELS = ["", "Nhớ", "Hiểu", "Vận dụng", "Phân tích", "Đánh giá", "Sáng tạo"];
const DIFF_LABELS = ["", "Dễ", "Trung bình", "Khó"];

export default function QuestionBankAdmin() {
    const { session } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [gradeFilter, setGradeFilter] = useState(2);
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genCount, setGenCount] = useState(10);
    const [showCreate, setShowCreate] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const authHeaders = { Authorization: `Bearer ${session?.access_token}` };

    const fetchTopics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("grade", String(gradeFilter));
            if (subjectFilter !== "all") params.set("subject", subjectFilter);
            const res = await fetch(`/api/admin/curriculum?${params}`, { headers: authHeaders });
            const { data } = await res.json();
            setTopics(data || []);
        } catch { /* ignore */ }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradeFilter, subjectFilter, session]);

    const fetchQuestions = useCallback(async (topicId: string) => {
        try {
            const res = await fetch(`/api/admin/question-bank?topic_id=${topicId}&limit=200`, { headers: authHeaders });
            const { data } = await res.json();
            setQuestions(data || []);
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    useEffect(() => {
        if (session?.access_token) fetchTopics();
    }, [session, fetchTopics]);

    useEffect(() => {
        if (selectedTopic) fetchQuestions(selectedTopic.id);
    }, [selectedTopic, fetchQuestions]);

    /* ─── AI Generate ─── */
    async function handleGenerate() {
        if (!selectedTopic) return;
        setGenerating(true);
        setMsg(null);
        try {
            const res = await fetch("/api/admin/question-bank", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "ai-generate",
                    topic_id: selectedTopic.id,
                    topic_name: selectedTopic.topic_name,
                    subject: selectedTopic.subject,
                    grade: selectedTopic.grade,
                    count: genCount,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ type: "ok", text: `✅ Đã tạo ${data.generated} câu hỏi` });
                fetchQuestions(selectedTopic.id);
                fetchTopics();
            } else {
                setMsg({ type: "err", text: data.error || "Lỗi tạo câu hỏi" });
            }
        } catch (err) {
            setMsg({ type: "err", text: String(err) });
        }
        setGenerating(false);
    }

    /* ─── Manual Create ─── */
    async function handleManualCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedTopic) return;
        const fd = new FormData(e.currentTarget);
        const opts = [fd.get("opt0"), fd.get("opt1"), fd.get("opt2"), fd.get("opt3")].map(String);
        try {
            const res = await fetch("/api/admin/question-bank", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic_id: selectedTopic.id,
                    question_text: fd.get("question_text"),
                    options: opts,
                    correct_index: parseInt(fd.get("correct_index") as string),
                    explanation: fd.get("explanation"),
                    hint: fd.get("hint"),
                    bloom_level: parseInt(fd.get("bloom_level") as string),
                    difficulty: parseInt(fd.get("difficulty") as string),
                    grade: selectedTopic.grade,
                    subject: selectedTopic.subject,
                }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: "✅ Đã thêm câu hỏi" });
                setShowCreate(false);
                fetchQuestions(selectedTopic.id);
                fetchTopics();
            }
        } catch { /* ignore */ }
    }

    /* ─── Delete ─── */
    async function handleDelete(id: string) {
        if (!confirm("Xóa câu hỏi này?")) return;
        await fetch("/api/admin/question-bank", {
            method: "DELETE",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [id] }),
        });
        setQuestions(q => q.filter(x => x.id !== id));
        fetchTopics();
    }

    return (
        <div className="qb">
            <div className="qb-header">
                <div>
                    <h1 className="qb-title">🧩 Ngân hàng Câu hỏi</h1>
                    <p className="qb-sub">Quản lý câu hỏi luyện tập theo chủ đề curriculum</p>
                </div>
                <Link href="/admin" className="qb-back">← Dashboard</Link>
            </div>

            {msg && (
                <div className={`qb-msg ${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text}
                </div>
            )}

            {/* Filters */}
            <div className="qb-filters">
                <select value={gradeFilter} onChange={e => setGradeFilter(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                    <option value="all">Tất cả môn</option>
                    {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            <div className="qb-layout">
                {/* Topic List */}
                <div className="qb-topics">
                    <h3 className="qb-panel-title">📚 Chủ đề ({topics.length})</h3>
                    {loading ? <p className="qb-loading">Đang tải...</p> : (
                        topics.map(t => (
                            <div
                                key={t.id}
                                className={`qb-topic-card ${selectedTopic?.id === t.id ? "active" : ""}`}
                                onClick={() => setSelectedTopic(t)}
                            >
                                <div className="qb-topic-name">{t.topic_name}</div>
                                <div className="qb-topic-meta">
                                    <span>{SUBJECT_LABELS[t.subject] || t.subject}</span>
                                    <span>📝 {t.question_count} câu</span>
                                    <span>🎬 {t.lesson_count} bài giảng</span>
                                </div>
                                {t.chapter && <div className="qb-topic-chapter">{t.chapter}</div>}
                            </div>
                        ))
                    )}
                </div>

                {/* Question Panel */}
                <div className="qb-questions">
                    {!selectedTopic ? (
                        <div className="qb-empty">← Chọn chủ đề để xem câu hỏi</div>
                    ) : (
                        <>
                            <div className="qb-q-header">
                                <h3 className="qb-panel-title">{selectedTopic.topic_name}</h3>
                                <div className="qb-q-actions">
                                    <div className="qb-gen-row">
                                        <input
                                            type="number" min={1} max={30} value={genCount}
                                            onChange={e => setGenCount(Number(e.target.value))}
                                            className="qb-gen-input"
                                        />
                                        <button onClick={handleGenerate} disabled={generating} className="qb-btn qb-btn-ai">
                                            {generating ? "⏳ Đang sinh..." : "🤖 AI sinh câu hỏi"}
                                        </button>
                                    </div>
                                    <button onClick={() => setShowCreate(!showCreate)} className="qb-btn qb-btn-create">
                                        ➕ Thêm thủ công
                                    </button>
                                </div>
                            </div>

                            {/* Manual Create Form */}
                            {showCreate && (
                                <form onSubmit={handleManualCreate} className="qb-create-form">
                                    <textarea name="question_text" placeholder="Câu hỏi..." required className="qb-textarea" />
                                    <div className="qb-opts-grid">
                                        {[0, 1, 2, 3].map(i => (
                                            <input key={i} name={`opt${i}`} placeholder={`Đáp án ${i + 1}`} required className="qb-input" />
                                        ))}
                                    </div>
                                    <div className="qb-form-row">
                                        <select name="correct_index" className="qb-select">
                                            {[0, 1, 2, 3].map(i => <option key={i} value={i}>Đáp án đúng: {i + 1}</option>)}
                                        </select>
                                        <select name="bloom_level" className="qb-select">
                                            {[1, 2, 3].map(i => <option key={i} value={i}>{BLOOM_LABELS[i]}</option>)}
                                        </select>
                                        <select name="difficulty" className="qb-select">
                                            {[1, 2, 3].map(i => <option key={i} value={i}>{DIFF_LABELS[i]}</option>)}
                                        </select>
                                    </div>
                                    <input name="explanation" placeholder="Giải thích đáp án" className="qb-input" />
                                    <input name="hint" placeholder="Gợi ý" className="qb-input" />
                                    <button type="submit" className="qb-btn qb-btn-save">💾 Lưu</button>
                                </form>
                            )}

                            {/* Questions List */}
                            <div className="qb-q-list">
                                {questions.length === 0 ? (
                                    <div className="qb-empty">Chưa có câu hỏi. Dùng AI sinh hoặc thêm thủ công.</div>
                                ) : questions.map((q, idx) => (
                                    <div key={q.id} className="qb-q-card">
                                        <div className="qb-q-num">#{idx + 1}</div>
                                        <div className="qb-q-body">
                                            <div className="qb-q-text">{q.question_text}</div>
                                            <div className="qb-q-opts">
                                                {q.options.map((opt, i) => (
                                                    <span key={i} className={`qb-q-opt ${i === q.correct_index ? "correct" : ""}`}>
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                            {q.explanation && <div className="qb-q-explain">💡 {q.explanation}</div>}
                                            <div className="qb-q-tags">
                                                <span className="qb-tag bloom">{BLOOM_LABELS[q.bloom_level]}</span>
                                                <span className="qb-tag diff">{DIFF_LABELS[q.difficulty]}</span>
                                                {q.calibrated_difficulty != null ? (
                                                    <span className="qb-tag calibrated" title={`Calibrated từ ${q.attempt_count} lượt trả lời (${q.correct_count} đúng)`}>
                                                        📊 Calibrated: {DIFF_LABELS[q.calibrated_difficulty]} ({q.attempt_count} lượt)
                                                    </span>
                                                ) : (q.attempt_count ?? 0) > 0 ? (
                                                    <span className="qb-tag stats" title={`${q.correct_count}/${q.attempt_count} đúng — cần ${20 - (q.attempt_count || 0)} lượt nữa để calibrate`}>
                                                        📈 {q.attempt_count} lượt
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(q.id)} className="qb-q-del" title="Xóa">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .qb { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }
                .qb-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
                .qb-title { font-size:24px; font-weight:800; color:#f8fafc; margin:0 0 4px; }
                .qb-sub { font-size:13px; color:#64748b; margin:0; }
                .qb-back {
                    font-size:12px; color:#f59e0b; text-decoration:none; font-weight:600;
                    padding:8px 14px; border-radius:8px; background:rgba(245,158,11,0.1);
                    border:1px solid rgba(245,158,11,0.2); transition:all 0.15s;
                }
                .qb-back:hover { background:rgba(245,158,11,0.2); }

                .qb-msg {
                    padding:10px 16px; border-radius:10px; margin-bottom:16px; font-size:13px;
                    cursor:pointer; font-weight:600;
                }
                .qb-msg.ok { background:rgba(34,197,94,0.1); color:#4ade80; border:1px solid rgba(34,197,94,0.2); }
                .qb-msg.err { background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2); }

                .qb-filters { display:flex; gap:10px; margin-bottom:16px; }
                .qb-filters select {
                    padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
                    background:#0f1729; color:#e2e8f0;
                    border:1px solid rgba(255,255,255,0.08); cursor:pointer;
                }

                .qb-layout { display:grid; grid-template-columns:320px 1fr; gap:16px; min-height:500px; }
                @media (max-width:900px) { .qb-layout { grid-template-columns:1fr; } }

                .qb-topics {
                    background:rgba(255,255,255,0.02); border-radius:14px;
                    border:1px solid rgba(255,255,255,0.06); padding:16px;
                    max-height:calc(100vh - 200px); overflow-y:auto;
                }
                .qb-panel-title { font-size:14px; font-weight:700; color:#94a3b8; margin:0 0 12px; }
                .qb-loading { color:#64748b; font-size:13px; }

                .qb-topic-card {
                    padding:12px; border-radius:10px; margin-bottom:8px; cursor:pointer;
                    border:1px solid rgba(255,255,255,0.04); transition:all 0.15s;
                }
                .qb-topic-card:hover { background:rgba(255,255,255,0.04); }
                .qb-topic-card.active {
                    background:rgba(99,102,241,0.12);
                    border-color:rgba(99,102,241,0.3);
                }
                .qb-topic-name { font-size:13px; font-weight:700; color:#e2e8f0; margin-bottom:6px; }
                .qb-topic-meta { display:flex; gap:10px; font-size:11px; color:#64748b; }
                .qb-topic-chapter { font-size:11px; color:#475569; margin-top:4px; }

                .qb-questions {
                    background:rgba(255,255,255,0.02); border-radius:14px;
                    border:1px solid rgba(255,255,255,0.06); padding:16px;
                    max-height:calc(100vh - 200px); overflow-y:auto;
                }
                .qb-empty { color:#475569; font-size:14px; text-align:center; padding:40px; }

                .qb-q-header { margin-bottom:16px; }
                .qb-q-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
                .qb-gen-row { display:flex; gap:6px; align-items:center; }
                .qb-gen-input {
                    width:60px; padding:6px 10px; border-radius:8px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08); text-align:center;
                }

                .qb-btn {
                    padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;
                    border:none; cursor:pointer; transition:all 0.15s;
                }
                .qb-btn:disabled { opacity:0.5; cursor:not-allowed; }
                .qb-btn-ai { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; }
                .qb-btn-ai:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 12px rgba(99,102,241,0.4); }
                .qb-btn-create { background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3); }
                .qb-btn-save { background:linear-gradient(135deg,#22c55e,#16a34a); color:white; width:100%; margin-top:8px; }

                .qb-create-form {
                    background:rgba(255,255,255,0.03); border-radius:12px; padding:16px;
                    margin-bottom:16px; border:1px solid rgba(255,255,255,0.06);
                    display:flex; flex-direction:column; gap:8px;
                }
                .qb-textarea {
                    width:100%; min-height:60px; padding:10px; border-radius:8px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08); resize:vertical;
                }
                .qb-opts-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
                .qb-input {
                    width:100%; padding:8px 12px; border-radius:8px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08);
                }
                .qb-form-row { display:flex; gap:6px; }
                .qb-select {
                    flex:1; padding:8px 10px; border-radius:8px; font-size:12px;
                    background:#0f1729; color:#e2e8f0;
                    border:1px solid rgba(255,255,255,0.08);
                }

                .qb-q-list { display:flex; flex-direction:column; gap:8px; }
                .qb-q-card {
                    display:flex; gap:12px; padding:12px; border-radius:10px;
                    background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04);
                    transition:all 0.15s;
                }
                .qb-q-card:hover { background:rgba(255,255,255,0.04); }
                .qb-q-num { font-size:11px; font-weight:800; color:#475569; min-width:28px; padding-top:2px; }
                .qb-q-body { flex:1; }
                .qb-q-text { font-size:13px; color:#e2e8f0; font-weight:600; margin-bottom:8px; line-height:1.5; }
                .qb-q-opts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
                .qb-q-opt {
                    font-size:12px; padding:4px 10px; border-radius:6px;
                    background:rgba(255,255,255,0.04); color:#94a3b8;
                    border:1px solid rgba(255,255,255,0.06);
                }
                .qb-q-opt.correct { background:rgba(34,197,94,0.15); color:#4ade80; border-color:rgba(34,197,94,0.3); }
                .qb-q-explain { font-size:11px; color:#64748b; margin-bottom:6px; }
                .qb-q-tags { display:flex; gap:6px; }
                .qb-tag {
                    font-size:10px; padding:2px 8px; border-radius:4px; font-weight:700;
                }
                .qb-tag.bloom { background:rgba(99,102,241,0.15); color:#a78bfa; }
                .qb-tag.diff { background:rgba(245,158,11,0.15); color:#fbbf24; }
                .qb-tag.calibrated { background:rgba(34,197,94,0.15); color:#4ade80; }
                .qb-tag.stats { background:rgba(99,102,241,0.1); color:#818cf8; }
                .qb-q-del {
                    background:none; border:none; cursor:pointer; font-size:16px;
                    opacity:0.3; transition:opacity 0.15s; padding:4px;
                }
                .qb-q-del:hover { opacity:1; }
            `}</style>
        </div>
    );
}
