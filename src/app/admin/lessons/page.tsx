"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";

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

const SUBJECT_KEYS = Object.keys(SUBJECT_LABELS);

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LessonsAdmin() {
    const { session } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [gradeFilter, setGradeFilter] = useState(2);
    const [subjectFilter, setSubjectFilter] = useState("");
    const [showForm, setShowForm] = useState(false);
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
            setLessons((data || []).filter((l: Lesson) => l.curriculum_topics?.grade === gradeFilter));
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradeFilter, session]);

    useEffect(() => {
        if (session?.access_token) { fetchTopics(); fetchLessons(); }
    }, [session, fetchTopics, fetchLessons]);

    // Clear msg after 4s
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); } }, [msg]);

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
                setMsg({ type: "ok", text: "✅ Đã thêm bài giảng mới" });
                setShowForm(false);
                setEditLesson(null);
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
                setMsg({ type: "ok", text: "✅ Đã cập nhật bài giảng" });
                setEditLesson(null);
                setShowForm(false);
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
        setMsg({ type: "ok", text: "🗑️ Đã xóa bài giảng" });
    }

    // Filtered lessons
    const filteredLessons = subjectFilter
        ? lessons.filter(l => l.curriculum_topics?.subject === subjectFilter)
        : lessons;

    // Stats
    const statsBySubject = SUBJECT_KEYS.reduce((acc, s) => {
        acc[s] = lessons.filter(l => l.curriculum_topics?.subject === s).length;
        return acc;
    }, {} as Record<string, number>);

    const filteredTopics = subjectFilter
        ? topics.filter(t => t.subject === subjectFilter)
        : topics;

    return (
        <div className="lv">
            {/* ─── Header ─── */}
            <div className="lv-header">
                <div className="lv-header-info">
                    <h1 className="lv-title">🎬 Quản lý Video Bài giảng</h1>
                    <p className="lv-subtitle">Gán link YouTube vào chủ đề curriculum • Tóm tắt nội dung để đề xuất cho học sinh</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditLesson(null); }}
                    className="lv-btn-add"
                >
                    <span>➕</span> Thêm bài giảng
                </button>
            </div>

            {/* ─── Stats Row ─── */}
            <div className="lv-stats">
                <div className="lv-stat-card lv-stat-total">
                    <div className="lv-stat-num">{lessons.length}</div>
                    <div className="lv-stat-label">Tổng video</div>
                </div>
                {SUBJECT_KEYS.map(s => (
                    <div key={s} className={`lv-stat-card ${subjectFilter === s ? "lv-stat-active" : ""}`}
                        onClick={() => setSubjectFilter(subjectFilter === s ? "" : s)}
                    >
                        <div className="lv-stat-num">{statsBySubject[s]}</div>
                        <div className="lv-stat-label">{SUBJECT_LABELS[s]}</div>
                    </div>
                ))}
            </div>

            {/* ─── Toast ─── */}
            {msg && <div className={`lv-toast ${msg.type}`} onClick={() => setMsg(null)}>{msg.text}</div>}

            {/* ─── Filters ─── */}
            <div className="lv-filters">
                <div className="lv-filter-group">
                    <label className="lv-filter-label">Lớp</label>
                    <div className="lv-grade-pills">
                        {[1, 2, 3, 4, 5].map(g => (
                            <button key={g}
                                className={`lv-grade-pill ${gradeFilter === g ? "active" : ""}`}
                                onClick={() => setGradeFilter(g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lv-filter-group">
                    <label className="lv-filter-label">Môn</label>
                    <div className="lv-subject-pills">
                        <button
                            className={`lv-subject-pill ${!subjectFilter ? "active" : ""}`}
                            onClick={() => setSubjectFilter("")}
                        >Tất cả</button>
                        {SUBJECT_KEYS.map(s => (
                            <button key={s}
                                className={`lv-subject-pill ${subjectFilter === s ? "active" : ""}`}
                                onClick={() => setSubjectFilter(s)}
                            >{SUBJECT_LABELS[s]}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Create/Edit Form (slide-down panel) ─── */}
            {(showForm || editLesson) && (
                <div className="lv-form-panel">
                    <div className="lv-form-header">
                        <h3>{editLesson ? "✏️ Sửa bài giảng" : "➕ Thêm bài giảng mới"}</h3>
                        <button onClick={() => { setShowForm(false); setEditLesson(null); }} className="lv-form-close">✕</button>
                    </div>
                    <form onSubmit={editLesson ? handleUpdate : handleCreate} className="lv-form-grid">
                        {/* Row 1: Topic selector — full width */}
                        <div className="lv-field lv-field-full">
                            <label className="lv-field-label">📐 Chủ đề Curriculum</label>
                            <select name="topic_id" defaultValue={editLesson?.topic_id || ""} required className="lv-select">
                                <option value="" disabled>Chọn chủ đề...</option>
                                {filteredTopics.map(t => (
                                    <option key={t.id} value={t.id}>{SUBJECT_LABELS[t.subject] || t.subject} — {t.chapter} — {t.topic_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2: Title — full width */}
                        <div className="lv-field lv-field-full">
                            <label className="lv-field-label">📝 Tên bài giảng</label>
                            <input name="title" defaultValue={editLesson?.title || ""} placeholder="VD: Phép cộng có nhớ trong phạm vi 100" required className="lv-input" />
                        </div>

                        {/* Row 3: YouTube ID + Duration — 2 columns */}
                        <div className="lv-field">
                            <label className="lv-field-label">▶️ YouTube Video ID</label>
                            <input name="youtube_id" defaultValue={editLesson?.youtube_id || ""} placeholder="dQw4w9WgXcQ" className="lv-input" />
                            <span className="lv-field-hint">Lấy từ URL: youtube.com/watch?v=<b>ID_NÀY</b></span>
                        </div>
                        <div className="lv-field">
                            <label className="lv-field-label">⏱ Thời lượng (giây)</label>
                            <input name="duration" type="number" defaultValue={editLesson?.duration_seconds || ""} placeholder="360" className="lv-input" />
                            <span className="lv-field-hint">VD: 360 = 6 phút</span>
                        </div>

                        {/* Row 4: Summary — full width */}
                        <div className="lv-field lv-field-full">
                            <label className="lv-field-label">📋 Tóm tắt nội dung</label>
                            <textarea name="summary" defaultValue={editLesson?.summary || ""} placeholder="Mô tả ngắn về nội dung video (sẽ hiển thị khi đề xuất cho học sinh)" className="lv-textarea" rows={3} />
                        </div>

                        {/* Actions */}
                        <div className="lv-form-actions">
                            <button type="submit" className="lv-btn lv-btn-save">
                                💾 {editLesson ? "Cập nhật" : "Thêm bài giảng"}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditLesson(null); }} className="lv-btn lv-btn-cancel">
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Lesson Grid ─── */}
            <div className="lv-grid">
                {filteredLessons.length === 0 ? (
                    <div className="lv-empty">
                        <div className="lv-empty-icon">🎬</div>
                        <div className="lv-empty-text">
                            Chưa có bài giảng nào cho Lớp {gradeFilter}
                            {subjectFilter ? ` • ${SUBJECT_LABELS[subjectFilter]}` : ""}
                        </div>
                        <button onClick={() => { setShowForm(true); setEditLesson(null); }} className="lv-btn lv-btn-add-sm">
                            ➕ Thêm bài giảng đầu tiên
                        </button>
                    </div>
                ) : filteredLessons.map(l => (
                    <div key={l.id} className="lv-card">
                        {/* Thumbnail */}
                        <div className="lv-card-thumb">
                            {l.youtube_id ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={`https://img.youtube.com/vi/${l.youtube_id}/mqdefault.jpg`} alt={l.title} />
                                    <a href={`https://youtube.com/watch?v=${l.youtube_id}`} target="_blank" rel="noreferrer" className="lv-card-play">
                                        <svg viewBox="0 0 24 24" fill="white" width="28" height="28"><path d="M8 5v14l11-7z" /></svg>
                                    </a>
                                    {l.duration_seconds && (
                                        <div className="lv-card-dur-badge">
                                            {formatDuration(l.duration_seconds)}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="lv-card-no-thumb">
                                    <span>🎬</span>
                                    <span className="lv-card-no-text">Chưa có video</span>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="lv-card-body">
                            <div className="lv-card-title">{l.title}</div>

                            {l.curriculum_topics && (
                                <div className="lv-card-topic-badge">
                                    <span className="lv-badge-subject">{SUBJECT_LABELS[l.curriculum_topics.subject] || l.curriculum_topics.subject}</span>
                                    <span className="lv-badge-dot">·</span>
                                    <span className="lv-badge-name">{l.curriculum_topics.topic_name}</span>
                                </div>
                            )}

                            {l.summary && (
                                <div className="lv-card-summary">{l.summary}</div>
                            )}

                            <div className="lv-card-footer">
                                <div className="lv-card-actions">
                                    <button onClick={() => { setEditLesson(l); setShowForm(true); }} className="lv-action-btn lv-action-edit" title="Sửa">
                                        ✏️ Sửa
                                    </button>
                                    <button onClick={() => handleDelete(l.id)} className="lv-action-btn lv-action-del" title="Xóa">
                                        🗑️ Xóa
                                    </button>
                                    {l.youtube_id && (
                                        <a href={`https://youtube.com/watch?v=${l.youtube_id}`} target="_blank" rel="noreferrer" className="lv-action-btn lv-action-link">
                                            🔗 Xem
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                /* ─── Root ─── */
                .lv { animation: lvFadeIn 0.3s ease; }
                @keyframes lvFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }

                /* ─── Header ─── */
                .lv-header {
                    display:flex; justify-content:space-between; align-items:flex-start;
                    margin-bottom:24px; gap:16px; flex-wrap:wrap;
                }
                .lv-header-info { flex:1; min-width:0; }
                .lv-title {
                    font-size:26px; font-weight:800; color:#f8fafc;
                    margin:0 0 6px; letter-spacing:-0.02em;
                }
                .lv-subtitle {
                    font-size:13px; color:#64748b; margin:0;
                    max-width:520px; line-height:1.5;
                }
                .lv-btn-add {
                    display:flex; align-items:center; gap:6px;
                    padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700;
                    background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white;
                    border:none; cursor:pointer; transition:all 0.2s;
                    box-shadow:0 4px 12px rgba(99,102,241,0.25);
                    white-space:nowrap;
                }
                .lv-btn-add:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.35); }

                /* ─── Stats Row ─── */
                .lv-stats {
                    display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));
                    gap:10px; margin-bottom:20px;
                }
                .lv-stat-card {
                    background:rgba(255,255,255,0.03); border-radius:12px;
                    padding:14px 16px; border:1px solid rgba(255,255,255,0.06);
                    cursor:pointer; transition:all 0.2s; text-align:center;
                }
                .lv-stat-card:hover { background:rgba(255,255,255,0.06); transform:translateY(-1px); }
                .lv-stat-active {
                    background:rgba(139,92,246,0.12) !important;
                    border-color:rgba(139,92,246,0.3) !important;
                    box-shadow:0 0 16px rgba(139,92,246,0.1);
                }
                .lv-stat-total {
                    background:linear-gradient(135deg, rgba(245,158,11,0.08), rgba(139,92,246,0.08));
                    border-color:rgba(245,158,11,0.15);
                }
                .lv-stat-num { font-size:22px; font-weight:800; color:#f8fafc; }
                .lv-stat-label { font-size:11px; color:#64748b; font-weight:600; margin-top:2px; }

                /* ─── Toast ─── */
                .lv-toast {
                    padding:12px 18px; border-radius:12px; font-size:13px;
                    font-weight:600; cursor:pointer; margin-bottom:16px;
                    animation:lvSlideDown 0.25s ease;
                }
                @keyframes lvSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; } }
                .lv-toast.ok { background:rgba(34,197,94,0.1); color:#4ade80; border:1px solid rgba(34,197,94,0.2); }
                .lv-toast.err { background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2); }

                /* ─── Filters ─── */
                .lv-filters {
                    display:flex; flex-direction:column; gap:12px;
                    background:rgba(255,255,255,0.02); border-radius:14px;
                    padding:16px 20px; border:1px solid rgba(255,255,255,0.06);
                    margin-bottom:20px;
                }
                .lv-filter-group { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
                .lv-filter-label {
                    font-size:11px; font-weight:700; color:#475569;
                    text-transform:uppercase; letter-spacing:0.08em;
                    min-width:32px;
                }
                .lv-grade-pills, .lv-subject-pills { display:flex; gap:6px; flex-wrap:wrap; }
                .lv-grade-pill, .lv-subject-pill {
                    padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600;
                    background:rgba(255,255,255,0.04); color:#94a3b8;
                    border:1px solid rgba(255,255,255,0.06); cursor:pointer;
                    transition:all 0.15s;
                }
                .lv-grade-pill:hover, .lv-subject-pill:hover {
                    background:rgba(255,255,255,0.08); color:#e2e8f0;
                }
                .lv-grade-pill.active {
                    background:linear-gradient(135deg,#f59e0b,#d97706); color:white;
                    border-color:transparent; box-shadow:0 2px 8px rgba(245,158,11,0.25);
                }
                .lv-subject-pill.active {
                    background:linear-gradient(135deg,#8b5cf6,#6366f1); color:white;
                    border-color:transparent; box-shadow:0 2px 8px rgba(139,92,246,0.25);
                }

                /* ─── Form Panel ─── */
                .lv-form-panel {
                    background:rgba(255,255,255,0.03); border-radius:16px;
                    border:1px solid rgba(255,255,255,0.08); padding:24px;
                    margin-bottom:24px; animation:lvSlideDown 0.25s ease;
                }
                .lv-form-header {
                    display:flex; justify-content:space-between; align-items:center;
                    margin-bottom:20px;
                }
                .lv-form-header h3 { font-size:16px; font-weight:700; color:#f8fafc; margin:0; }
                .lv-form-close {
                    width:32px; height:32px; border-radius:8px; border:none;
                    background:rgba(255,255,255,0.06); color:#94a3b8;
                    cursor:pointer; font-size:14px; transition:all 0.15s;
                    display:flex; align-items:center; justify-content:center;
                }
                .lv-form-close:hover { background:rgba(255,255,255,0.12); color:#f8fafc; }

                .lv-form-grid {
                    display:grid; grid-template-columns:1fr 1fr;
                    gap:16px;
                }
                .lv-field { display:flex; flex-direction:column; gap:6px; }
                .lv-field-full { grid-column:1/-1; }
                .lv-field-label {
                    font-size:12px; font-weight:600; color:#94a3b8;
                    letter-spacing:0.02em;
                }
                .lv-field-hint { font-size:10px; color:#475569; margin-top:-2px; }
                .lv-field-hint b { color:#64748b; }
                .lv-input, .lv-select, .lv-textarea {
                    width:100%; padding:10px 14px; border-radius:10px;
                    background:#0f1729; color:#e2e8f0; font-size:13px;
                    border:1px solid rgba(255,255,255,0.08);
                    transition:border-color 0.15s;
                }
                .lv-input:focus, .lv-select:focus, .lv-textarea:focus {
                    outline:none; border-color:rgba(139,92,246,0.5);
                    box-shadow:0 0 0 3px rgba(139,92,246,0.1);
                }
                .lv-textarea { resize:vertical; }
                .lv-form-actions {
                    grid-column:1/-1; display:flex; gap:10px; padding-top:4px;
                }
                .lv-btn {
                    padding:10px 20px; border-radius:10px; font-size:13px; font-weight:700;
                    border:none; cursor:pointer; transition:all 0.15s;
                }
                .lv-btn-save {
                    background:linear-gradient(135deg,#22c55e,#16a34a); color:white;
                    box-shadow:0 2px 8px rgba(34,197,94,0.2);
                }
                .lv-btn-save:hover { transform:translateY(-1px); }
                .lv-btn-cancel {
                    background:rgba(255,255,255,0.05); color:#94a3b8;
                    border:1px solid rgba(255,255,255,0.08);
                }
                .lv-btn-cancel:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }

                /* ─── Card Grid ─── */
                .lv-grid {
                    display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));
                    gap:16px;
                }

                /* ─── Empty State ─── */
                .lv-empty {
                    grid-column:1/-1; text-align:center; padding:60px 20px;
                    background:rgba(255,255,255,0.02); border-radius:16px;
                    border:1px dashed rgba(255,255,255,0.08);
                }
                .lv-empty-icon { font-size:40px; margin-bottom:12px; opacity:0.4; }
                .lv-empty-text { color:#475569; font-size:14px; margin-bottom:16px; }
                .lv-btn-add-sm {
                    padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;
                    background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white;
                    border:none; cursor:pointer; transition:all 0.15s;
                }
                .lv-btn-add-sm:hover { transform:translateY(-1px); }

                /* ─── Card ─── */
                .lv-card {
                    background:rgba(255,255,255,0.03); border-radius:14px; overflow:hidden;
                    border:1px solid rgba(255,255,255,0.06); transition:all 0.25s;
                    display:flex; flex-direction:column;
                }
                .lv-card:hover {
                    transform:translateY(-3px);
                    box-shadow:0 12px 32px rgba(0,0,0,0.4);
                    border-color:rgba(139,92,246,0.15);
                }

                /* Card Thumbnail */
                .lv-card-thumb {
                    position:relative; aspect-ratio:16/9; overflow:hidden;
                    background:#0a0e1a;
                }
                .lv-card-thumb img {
                    width:100%; height:100%; object-fit:cover;
                    transition:transform 0.3s;
                }
                .lv-card:hover .lv-card-thumb img { transform:scale(1.05); }
                .lv-card-play {
                    position:absolute; inset:0; display:flex;
                    align-items:center; justify-content:center;
                    background:rgba(0,0,0,0.4); opacity:0;
                    transition:opacity 0.25s; text-decoration:none;
                }
                .lv-card-play svg {
                    filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));
                    transition:transform 0.2s;
                }
                .lv-card:hover .lv-card-play { opacity:1; }
                .lv-card-play:hover svg { transform:scale(1.15); }
                .lv-card-dur-badge {
                    position:absolute; bottom:8px; right:8px;
                    background:rgba(0,0,0,0.8); color:white; font-size:11px;
                    padding:3px 8px; border-radius:6px; font-weight:600;
                    backdrop-filter:blur(4px);
                }
                .lv-card-no-thumb {
                    display:flex; flex-direction:column; align-items:center;
                    justify-content:center; height:100%; gap:6px;
                    color:#475569;
                }
                .lv-card-no-thumb span:first-child { font-size:28px; opacity:0.4; }
                .lv-card-no-text { font-size:11px; }

                /* Card Body */
                .lv-card-body {
                    padding:16px; display:flex; flex-direction:column;
                    gap:8px; flex:1;
                }
                .lv-card-title {
                    font-size:14px; font-weight:700; color:#e2e8f0;
                    line-height:1.4;
                }
                .lv-card-topic-badge {
                    display:flex; align-items:center; gap:6px;
                    font-size:11px; flex-wrap:wrap;
                }
                .lv-badge-subject {
                    color:#8b5cf6; font-weight:700;
                }
                .lv-badge-dot { color:#334155; }
                .lv-badge-name { color:#64748b; font-weight:500; }
                .lv-card-summary {
                    font-size:12px; color:#64748b; line-height:1.6;
                    display:-webkit-box; -webkit-line-clamp:3;
                    -webkit-box-orient:vertical; overflow:hidden;
                }

                /* Card Footer */
                .lv-card-footer {
                    margin-top:auto; padding-top:8px;
                    border-top:1px solid rgba(255,255,255,0.04);
                }
                .lv-card-actions { display:flex; gap:6px; }
                .lv-action-btn {
                    font-size:11px; padding:5px 10px; border-radius:7px; font-weight:600;
                    background:rgba(255,255,255,0.04); color:#94a3b8;
                    border:1px solid rgba(255,255,255,0.06); cursor:pointer;
                    text-decoration:none; transition:all 0.15s;
                }
                .lv-action-btn:hover { background:rgba(255,255,255,0.08); color:#e2e8f0; }
                .lv-action-edit:hover { color:#60a5fa; background:rgba(96,165,250,0.08); }
                .lv-action-del:hover { color:#f87171; background:rgba(248,113,113,0.08); }
                .lv-action-link:hover { color:#a78bfa; background:rgba(167,139,250,0.08); }

                /* ─── Responsive ─── */
                @media (max-width:768px) {
                    .lv-grid { grid-template-columns:1fr; }
                    .lv-form-grid { grid-template-columns:1fr; }
                    .lv-stats { grid-template-columns:repeat(3, 1fr); }
                    .lv-header { flex-direction:column; }
                }
                @media (max-width:480px) {
                    .lv-stats { grid-template-columns:repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
}
