"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

/* ─── Types ─── */
interface Topic { id: string; subject: string; grade: number; chapter: string; topic_name: string; topic_slug: string; }
interface Lesson {
    id: string; topic_id: string; resource_type: string;
    youtube_id: string | null; title: string; summary: string | null;
    thumbnail_url: string | null; duration_seconds: number | null;
    active: boolean;
    curriculum_topics?: { topic_name: string; topic_slug: string; subject: string; grade: number };
}

const SUBJECT_LABELS: Record<string, string> = {
    math: "🔢 Toán", vietnamese: "📖 Tiếng Việt", english: "🌍 Tiếng Anh", science: "🔬 Khoa học",
};

export default function LessonsAdmin() {
    const { session } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [gradeFilter, setGradeFilter] = useState(2);
    const [showCreate, setShowCreate] = useState(false);
    const [editLesson, setEditLesson] = useState<Lesson | null>(null);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const authHeaders = { Authorization: `Bearer ${session?.access_token}` };

    const fetchTopics = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/curriculum?grade=${gradeFilter}`, { headers: authHeaders });
            const { data } = await res.json();
            setTopics(data || []);
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradeFilter, session]);

    const fetchLessons = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/lesson-resources`, { headers: authHeaders });
            const { data } = await res.json();
            // Filter by grade on client
            setLessons((data || []).filter((l: Lesson) => l.curriculum_topics?.grade === gradeFilter));
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradeFilter, session]);

    useEffect(() => {
        if (session?.access_token) { fetchTopics(); fetchLessons(); }
    }, [session, fetchTopics, fetchLessons]);

    /* ─── Create ─── */
    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            const res = await fetch("/api/admin/lesson-resources", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic_id: fd.get("topic_id"),
                    resource_type: "youtube",
                    youtube_id: fd.get("youtube_id"),
                    title: fd.get("title"),
                    summary: fd.get("summary"),
                    duration_seconds: fd.get("duration") ? parseInt(fd.get("duration") as string) : null,
                }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: "✅ Đã thêm bài giảng" });
                setShowCreate(false);
                fetchLessons();
            } else {
                const { error } = await res.json();
                setMsg({ type: "err", text: error });
            }
        } catch (err) { setMsg({ type: "err", text: String(err) }); }
    }

    /* ─── Update ─── */
    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editLesson) return;
        const fd = new FormData(e.currentTarget);
        try {
            const res = await fetch("/api/admin/lesson-resources", {
                method: "PUT",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editLesson.id,
                    topic_id: fd.get("topic_id"),
                    youtube_id: fd.get("youtube_id"),
                    title: fd.get("title"),
                    summary: fd.get("summary"),
                    duration_seconds: fd.get("duration") ? parseInt(fd.get("duration") as string) : null,
                }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: "✅ Đã cập nhật" });
                setEditLesson(null);
                fetchLessons();
            }
        } catch { /* ignore */ }
    }

    /* ─── Delete ─── */
    async function handleDelete(id: string) {
        if (!confirm("Xóa bài giảng này?")) return;
        await fetch("/api/admin/lesson-resources", {
            method: "DELETE",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [id] }),
        });
        setLessons(l => l.filter(x => x.id !== id));
    }

    /* ─── Render ─── */
    const LessonForm = ({ lesson, onSubmit }: { lesson?: Lesson; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
        <form onSubmit={onSubmit} className="lr-form">
            <select name="topic_id" defaultValue={lesson?.topic_id || ""} required className="lr-select">
                <option value="" disabled>Chọn chủ đề...</option>
                {topics.map(t => <option key={t.id} value={t.id}>{SUBJECT_LABELS[t.subject]} — {t.topic_name}</option>)}
            </select>
            <input name="title" defaultValue={lesson?.title || ""} placeholder="Tên bài giảng" required className="lr-input" />
            <input name="youtube_id" defaultValue={lesson?.youtube_id || ""} placeholder="YouTube Video ID (ví dụ: dQw4w9WgXcQ)" className="lr-input" />
            <textarea name="summary" defaultValue={lesson?.summary || ""} placeholder="Tóm tắt nội dung (dùng để đề xuất cho học sinh)" className="lr-textarea" rows={3} />
            <input name="duration" type="number" defaultValue={lesson?.duration_seconds || ""} placeholder="Thời lượng (giây)" className="lr-input" />
            <div className="lr-form-actions">
                <button type="submit" className="lr-btn lr-btn-save">💾 Lưu</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditLesson(null); }} className="lr-btn lr-btn-cancel">Hủy</button>
            </div>
        </form>
    );

    return (
        <div className="lr">
            <div className="lr-header">
                <div>
                    <h1 className="lr-title">🎬 Quản lý Bài giảng</h1>
                    <p className="lr-sub">Link YouTube video vào chủ đề, thêm tóm tắt nội dung để đề xuất cho học sinh</p>
                </div>
                <div className="lr-header-right">
                    <Link href="/admin" className="lr-back">← Dashboard</Link>
                </div>
            </div>

            {msg && <div className={`lr-msg ${msg.type}`} onClick={() => setMsg(null)}>{msg.text}</div>}

            <div className="lr-filters">
                <select value={gradeFilter} onChange={e => setGradeFilter(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
                <button onClick={() => { setShowCreate(true); setEditLesson(null); }} className="lr-btn lr-btn-add">
                    ➕ Thêm bài giảng
                </button>
            </div>

            {showCreate && !editLesson && <LessonForm onSubmit={handleCreate} />}
            {editLesson && <LessonForm lesson={editLesson} onSubmit={handleUpdate} />}

            {/* Lesson Grid */}
            <div className="lr-grid">
                {lessons.length === 0 ? (
                    <div className="lr-empty">Chưa có bài giảng nào cho Lớp {gradeFilter}. Nhấn ➕ để thêm.</div>
                ) : lessons.map(l => (
                    <div key={l.id} className="lr-card">
                        {l.youtube_id && (
                            <div className="lr-thumb">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`https://img.youtube.com/vi/${l.youtube_id}/mqdefault.jpg`} alt={l.title} />
                                <div className="lr-play">▶</div>
                            </div>
                        )}
                        <div className="lr-card-body">
                            <div className="lr-card-title">{l.title}</div>
                            {l.curriculum_topics && (
                                <div className="lr-card-topic">
                                    {SUBJECT_LABELS[l.curriculum_topics.subject]} — {l.curriculum_topics.topic_name}
                                </div>
                            )}
                            {l.summary && <div className="lr-card-summary">{l.summary}</div>}
                            {l.duration_seconds && (
                                <div className="lr-card-dur">⏱ {Math.floor(l.duration_seconds / 60)}:{String(l.duration_seconds % 60).padStart(2, "0")}</div>
                            )}
                            <div className="lr-card-actions">
                                <button onClick={() => { setEditLesson(l); setShowCreate(false); }} className="lr-btn-sm">✏️ Sửa</button>
                                <button onClick={() => handleDelete(l.id)} className="lr-btn-sm lr-btn-del">🗑️ Xóa</button>
                                {l.youtube_id && (
                                    <a href={`https://youtube.com/watch?v=${l.youtube_id}`} target="_blank" rel="noreferrer" className="lr-btn-sm">
                                        🔗 Xem
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .lr { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }
                .lr-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
                .lr-title { font-size:24px; font-weight:800; color:#f8fafc; margin:0 0 4px; }
                .lr-sub { font-size:13px; color:#64748b; margin:0; max-width:500px; }
                .lr-header-right { display:flex; gap:8px; }
                .lr-back {
                    font-size:12px; color:#f59e0b; text-decoration:none; font-weight:600;
                    padding:8px 14px; border-radius:8px; background:rgba(245,158,11,0.1);
                    border:1px solid rgba(245,158,11,0.2); transition:all 0.15s;
                }
                .lr-back:hover { background:rgba(245,158,11,0.2); }

                .lr-msg { padding:10px 16px; border-radius:10px; margin-bottom:16px; font-size:13px; cursor:pointer; font-weight:600; }
                .lr-msg.ok { background:rgba(34,197,94,0.1); color:#4ade80; border:1px solid rgba(34,197,94,0.2); }
                .lr-msg.err { background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2); }

                .lr-filters { display:flex; gap:10px; align-items:center; margin-bottom:16px; }
                .lr-filters select {
                    padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
                    background:#0f1729; color:#e2e8f0; border:1px solid rgba(255,255,255,0.08);
                }
                .lr-btn {
                    padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;
                    border:none; cursor:pointer; transition:all 0.15s;
                }
                .lr-btn-add { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; }
                .lr-btn-add:hover { transform:translateY(-1px); }
                .lr-btn-save { background:linear-gradient(135deg,#22c55e,#16a34a); color:white; }
                .lr-btn-cancel { background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.08); }

                .lr-form {
                    background:rgba(255,255,255,0.03); border-radius:14px; padding:20px;
                    margin-bottom:20px; border:1px solid rgba(255,255,255,0.08);
                    display:flex; flex-direction:column; gap:10px;
                }
                .lr-input, .lr-select {
                    width:100%; padding:10px 14px; border-radius:10px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08);
                }
                .lr-textarea {
                    width:100%; padding:10px 14px; border-radius:10px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08); resize:vertical;
                }
                .lr-form-actions { display:flex; gap:8px; }

                .lr-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
                .lr-empty { color:#475569; font-size:14px; text-align:center; padding:60px; grid-column:1/-1; }

                .lr-card {
                    background:rgba(255,255,255,0.03); border-radius:14px; overflow:hidden;
                    border:1px solid rgba(255,255,255,0.06); transition:all 0.2s;
                }
                .lr-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
                .lr-thumb {
                    position:relative; aspect-ratio:16/9; overflow:hidden; background:#0a0e1a;
                }
                .lr-thumb img { width:100%; height:100%; object-fit:cover; }
                .lr-play {
                    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                    font-size:32px; color:white; opacity:0; transition:opacity 0.2s;
                    background:rgba(0,0,0,0.4);
                }
                .lr-card:hover .lr-play { opacity:1; }
                .lr-card-body { padding:14px; }
                .lr-card-title { font-size:14px; font-weight:700; color:#e2e8f0; margin-bottom:4px; }
                .lr-card-topic { font-size:11px; color:#8b5cf6; font-weight:600; margin-bottom:6px; }
                .lr-card-summary { font-size:12px; color:#64748b; margin-bottom:8px; line-height:1.5; }
                .lr-card-dur { font-size:11px; color:#475569; margin-bottom:8px; }
                .lr-card-actions { display:flex; gap:6px; }
                .lr-btn-sm {
                    font-size:11px; padding:4px 10px; border-radius:6px; font-weight:600;
                    background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.08);
                    cursor:pointer; text-decoration:none; transition:all 0.15s;
                }
                .lr-btn-sm:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }
                .lr-btn-del:hover { background:rgba(239,68,68,0.15); color:#f87171; }

                @media (max-width:768px) { .lr-grid { grid-template-columns:1fr; } }
            `}</style>
        </div>
    );
}
