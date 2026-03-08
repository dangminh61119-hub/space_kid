"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

/* ─── Types ─── */
interface Topic {
    id: string;
    subject: string;
    grade: number;
    chapter: string | null;
    topic_name: string;
    topic_slug: string;
    description: string | null;
    bloom_max: number | null;
    sort_order: number;
    sgk_keywords: string[];
    question_count: number;
    lesson_count: number;
}

const SUBJECT_LABELS: Record<string, string> = {
    math: "🔢 Toán", vietnamese: "📖 Tiếng Việt", english: "🌍 Tiếng Anh",
    science: "🔬 Khoa học", geography: "🗺️ Địa lý",
};

export default function CurriculumAdmin() {
    const { session } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradeFilter, setGradeFilter] = useState<number | "">("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [showForm, setShowForm] = useState(false);

    const fetchTopics = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (gradeFilter) params.set("grade", String(gradeFilter));
            if (subjectFilter) params.set("subject", subjectFilter);
            const res = await fetch(`/api/admin/curriculum?${params}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const { data } = await res.json();
                setTopics(data || []);
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [session, gradeFilter, subjectFilter]);

    useEffect(() => { fetchTopics(); }, [fetchTopics]);

    /* ─── Create ─── */
    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const body = {
            subject: form.get("subject"),
            grade: form.get("grade"),
            chapter: form.get("chapter"),
            topic_name: form.get("topic_name"),
            topic_slug: form.get("topic_slug"),
            description: form.get("description"),
            bloom_max: form.get("bloom_max") || "3",
            sort_order: form.get("sort_order") || "0",
        };
        const res = await fetch("/api/admin/curriculum", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            setShowForm(false);
            fetchTopics();
        } else {
            const { error } = await res.json();
            alert("Lỗi: " + error);
        }
    }

    /* ─── Delete ─── */
    async function handleDelete(id: string) {
        if (!confirm("Xóa chủ đề này? Câu hỏi và bài giảng gắn sẽ mất liên kết.")) return;
        const res = await fetch("/api/admin/curriculum", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ ids: [id] }),
        });
        if (res.ok) fetchTopics();
    }

    // Group by subject
    const grouped = topics.reduce<Record<string, Topic[]>>((acc, t) => {
        const key = t.subject;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return (
        <div className="cr">
            <div className="cr-header">
                <div>
                    <h1 className="cr-title">📐 Chương trình Học</h1>
                    <p className="cr-sub">{topics.length} chủ đề curriculum</p>
                </div>
                <button className="cr-btn cr-btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "✕ Đóng" : "➕ Thêm chủ đề"}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form className="cr-form" onSubmit={handleCreate}>
                    <div className="cr-form-grid">
                        <div className="cr-field">
                            <label>Môn học *</label>
                            <select name="subject" required className="cr-input">
                                <option value="">Chọn...</option>
                                {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="cr-field">
                            <label>Lớp *</label>
                            <select name="grade" required className="cr-input">
                                {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                            </select>
                        </div>
                        <div className="cr-field">
                            <label>Chương</label>
                            <input name="chapter" className="cr-input" placeholder="VD: Chương 1: Số học" />
                        </div>
                        <div className="cr-field">
                            <label>Tên chủ đề *</label>
                            <input name="topic_name" required className="cr-input" placeholder="VD: Phép cộng có nhớ" />
                        </div>
                        <div className="cr-field">
                            <label>Slug *</label>
                            <input name="topic_slug" required className="cr-input" placeholder="VD: addition-carry" />
                        </div>
                        <div className="cr-field">
                            <label>Bloom Max</label>
                            <select name="bloom_max" className="cr-input" defaultValue="3">
                                {[1, 2, 3, 4, 5].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="cr-field" style={{ marginTop: 12 }}>
                        <label>Mô tả</label>
                        <input name="description" className="cr-input" placeholder="Mô tả ngắn về chủ đề..." />
                    </div>
                    <button type="submit" className="cr-btn cr-btn-primary" style={{ marginTop: 16 }}>
                        💾 Tạo chủ đề
                    </button>
                </form>
            )}

            {/* Filters */}
            <div className="cr-filters">
                <select className="cr-input" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Tất cả lớp</option>
                    {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
                <select className="cr-input" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="">Tất cả môn</option>
                    {Object.entries(SUBJECT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="cr-loading"><div className="cr-spinner" /><p>Đang tải...</p></div>
            ) : topics.length === 0 ? (
                <div className="cr-empty">Không tìm thấy chủ đề nào</div>
            ) : (
                Object.entries(grouped).map(([subject, items]) => (
                    <div key={subject} className="cr-section">
                        <h2 className="cr-section-title">{SUBJECT_LABELS[subject] || subject}</h2>
                        <div className="cr-table-wrap">
                            <table className="cr-table">
                                <thead>
                                    <tr>
                                        <th>Chương</th>
                                        <th>Chủ đề</th>
                                        <th>Lớp</th>
                                        <th>Bloom</th>
                                        <th>📋 CH</th>
                                        <th>🎬 Video</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(t => (
                                        <tr key={t.id}>
                                            <td className="cr-chapter">{t.chapter || "—"}</td>
                                            <td>
                                                <div className="cr-topic-name">{t.topic_name}</div>
                                                <div className="cr-topic-slug">{t.topic_slug}</div>
                                            </td>
                                            <td><span className="cr-grade">Lớp {t.grade}</span></td>
                                            <td className="cr-num">{t.bloom_max || "—"}</td>
                                            <td>
                                                <Link href={`/admin/question-bank?topic=${t.topic_slug}`} className="cr-count-link">
                                                    {t.question_count}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link href={`/admin/lessons?topic=${t.topic_slug}`} className="cr-count-link">
                                                    {t.lesson_count}
                                                </Link>
                                            </td>
                                            <td>
                                                <button className="cr-btn-del" onClick={() => handleDelete(t.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            <style jsx>{`
                .cr { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

                .cr-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
                }
                .cr-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 4px; }
                .cr-sub { font-size: 13px; color: #64748b; margin: 0; }

                .cr-btn {
                    border: none; cursor: pointer; font-size: 13px; font-weight: 600;
                    padding: 8px 18px; border-radius: 10px; transition: all 0.2s;
                }
                .cr-btn-primary {
                    background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1a2e;
                }
                .cr-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245,158,11,0.3); }

                .cr-form {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; padding: 20px; margin-bottom: 20px;
                }
                .cr-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
                .cr-field label {
                    display: block; font-size: 11px; font-weight: 700; color: #64748b;
                    margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;
                }
                .cr-input {
                    width: 100%; background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0;
                    padding: 8px 12px; border-radius: 8px; font-size: 13px;
                    outline: none; transition: border-color 0.2s;
                }
                .cr-input:focus { border-color: #f59e0b; }

                .cr-filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }

                .cr-loading { text-align: center; padding: 60px 0; color: #64748b; }
                .cr-spinner {
                    width: 32px; height: 32px; border-radius: 50%;
                    border: 3px solid #1e293b; border-top-color: #f59e0b;
                    animation: spin 0.8s linear infinite; margin: 0 auto 12px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .cr-empty {
                    text-align: center; padding: 60px; color: #475569;
                    background: rgba(255,255,255,0.02); border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06);
                }

                .cr-section { margin-bottom: 28px; }
                .cr-section-title {
                    font-size: 16px; font-weight: 700; color: #e2e8f0; margin: 0 0 12px;
                }

                .cr-table-wrap {
                    background: rgba(255,255,255,0.02); border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06); overflow-x: auto;
                }
                .cr-table { width: 100%; border-collapse: collapse; min-width: 600px; }
                .cr-table th {
                    padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700;
                    color: #475569; text-transform: uppercase; letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .cr-table td {
                    padding: 12px 14px; font-size: 13px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .cr-table tr:hover td { background: rgba(255,255,255,0.02); }
                .cr-table tr:last-child td { border-bottom: none; }

                .cr-chapter { color: #64748b; font-size: 12px; max-width: 140px; }
                .cr-topic-name { font-weight: 600; color: #e2e8f0; }
                .cr-topic-slug { font-size: 11px; color: #475569; font-family: monospace; }
                .cr-grade {
                    font-size: 12px; font-weight: 600; padding: 3px 10px;
                    border-radius: 8px; background: rgba(59,130,246,0.1); color: #60a5fa;
                }
                .cr-num { color: #cbd5e1; font-weight: 500; }
                .cr-count-link {
                    color: #fbbf24; text-decoration: none; font-weight: 700;
                    padding: 2px 8px; border-radius: 6px; transition: background 0.15s;
                }
                .cr-count-link:hover { background: rgba(251,191,36,0.1); }
                .cr-btn-del {
                    background: none; border: none; cursor: pointer; font-size: 16px;
                    opacity: 0.4; transition: opacity 0.15s;
                }
                .cr-btn-del:hover { opacity: 1; }

                @media (max-width: 768px) {
                    .cr-header { flex-direction: column; }
                    .cr-form-grid { grid-template-columns: 1fr; }
                    .cr-filters { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
