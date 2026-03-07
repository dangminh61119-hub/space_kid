"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Types ─── */
interface Textbook {
    id: string;
    title: string;
    subject: string;
    grade: number;
    publisher?: string;
    total_chunks: number;
    status: string;
    created_at: string;
}

const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍" },
    { id: "science", label: "Khoa học", emoji: "🔬" },
    { id: "history", label: "Lịch sử & Địa lý", emoji: "🗺️" },
];

const GRADES = [1, 2, 3, 4, 5];

export default function AdminTextbooksPage() {
    const { session } = useAuth();
    const [textbooks, setTextbooks] = useState<Textbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [filterGrade, setFilterGrade] = useState<number | null>(null);
    const [filterSubject, setFilterSubject] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formSubject, setFormSubject] = useState("math");
    const [formGrade, setFormGrade] = useState(1);
    const [formPublisher, setFormPublisher] = useState("");
    const [formContent, setFormContent] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = session?.access_token;

    const fetchTextbooks = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterGrade) params.set("grade", String(filterGrade));
            if (filterSubject) params.set("subject", filterSubject);
            const res = await fetch(`/api/admin/textbooks?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTextbooks(data.textbooks || []);
        } catch (err) {
            console.error("Fetch textbooks error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, filterGrade, filterSubject]);

    useEffect(() => { fetchTextbooks(); }, [fetchTextbooks]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setError(""); setSuccess(""); setProcessing(true);
        try {
            const res = await fetch("/api/admin/textbooks", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: formTitle, subject: formSubject, grade: formGrade, publisher: formPublisher, content: formContent }),
            });

            // Handle non-JSON responses (e.g., Vercel timeout returns HTML)
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                const text = await res.text();
                if (res.status === 504 || text.includes("FUNCTION_INVOCATION_TIMEOUT")) {
                    setError(`⏰ Timeout (${res.status}): Nội dung quá dài. Hãy thử paste ít hơn 2000 từ.`);
                } else {
                    setError(`❌ Server error ${res.status}: ${res.statusText || text.slice(0, 200)}`);
                }
                return;
            }

            const data = await res.json();
            if (!res.ok) { setError(`❌ ${data.error || "Upload failed"}`); return; }
            setSuccess(`✅ Upload thành công! ${data.chunks} chunks đã được tạo.`);
            setFormTitle(""); setFormContent(""); setFormPublisher(""); setShowForm(false);
            fetchTextbooks();
        } catch (err) {
            setError("🔌 Network error: " + String(err));
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!token) return;
        if (!confirm(`Xóa sách "${title}"? Tất cả chunks sẽ bị xóa.`)) return;
        try {
            await fetch(`/api/admin/textbooks?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            fetchTextbooks();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const groupedByGrade = textbooks.reduce<Record<number, Textbook[]>>((acc, tb) => {
        if (!acc[tb.grade]) acc[tb.grade] = [];
        acc[tb.grade].push(tb);
        return acc;
    }, {});

    return (
        <div className="tb">
            {/* Header */}
            <div className="tb-header">
                <div>
                    <h1 className="tb-title">📚 Sách Giáo Khoa</h1>
                    <p className="tb-subtitle">Upload và quản lý nội dung SGK cho hệ thống RAG</p>
                </div>
                <button className={`tb-add-btn ${showForm ? "close" : ""}`} onClick={() => setShowForm(!showForm)}>
                    {showForm ? "✕ Đóng" : "+ Thêm SGK"}
                </button>
            </div>

            {/* Alerts */}
            {error && <div className="tb-alert tb-alert-error">❌ {error}</div>}
            {success && <div className="tb-alert tb-alert-success">{success}</div>}

            {/* Upload Form */}
            {showForm && (
                <form onSubmit={handleUpload} className="tb-form">
                    <h2 className="tb-form-title">📝 Thêm nội dung SGK mới</h2>

                    <div className="tb-form-grid">
                        <div className="tb-field">
                            <label>Tên sách / Chương</label>
                            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                                placeholder="VD: Toán 3 - Chương 5: Phép nhân" required />
                        </div>
                        <div className="tb-field">
                            <label>Nhà xuất bản</label>
                            <input type="text" value={formPublisher} onChange={e => setFormPublisher(e.target.value)}
                                placeholder="VD: NXB Giáo dục" />
                        </div>
                        <div className="tb-field">
                            <label>Môn học</label>
                            <select value={formSubject} onChange={e => setFormSubject(e.target.value)}>
                                {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
                            </select>
                        </div>
                        <div className="tb-field">
                            <label>Lớp</label>
                            <select value={formGrade} onChange={e => setFormGrade(parseInt(e.target.value))}>
                                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="tb-field">
                        <label>Nội dung SGK (paste text)</label>
                        <textarea value={formContent} onChange={e => setFormContent(e.target.value)}
                            placeholder={`Paste nội dung sách giáo khoa vào đây...\n\nVí dụ:\nChương 5: Phép nhân\n\nBài 25: Nhân số có hai chữ số với số có một chữ số\n\nĐể nhân số có hai chữ số với số có một chữ số, ta thực hiện:\n1. Nhân hàng đơn vị\n2. Nhân hàng chục\n...`}
                            required rows={10} />
                        <p className="tb-hint">💡 Hệ thống sẽ tự chia ~400 từ/chunk + tạo embedding. Nội dung càng chi tiết, kết quả càng chính xác.</p>
                    </div>

                    <button type="submit" disabled={processing || !formTitle || !formContent} className="tb-submit-btn">
                        {processing ? "⏳ Đang xử lý embedding..." : "🚀 Upload & Tạo Embedding"}
                    </button>
                </form>
            )}

            {/* Filters */}
            <div className="tb-filters">
                <div className="tb-filter-group">
                    <span className="tb-filter-label">Lớp:</span>
                    <button className={`tb-filter-btn ${filterGrade === null ? "active purple" : ""}`} onClick={() => setFilterGrade(null)}>Tất cả</button>
                    {GRADES.map(g => (
                        <button key={g} className={`tb-filter-btn ${filterGrade === g ? "active purple" : ""}`} onClick={() => setFilterGrade(g)}>
                            {g}
                        </button>
                    ))}
                </div>
                <div className="tb-filter-group">
                    <span className="tb-filter-label">Môn:</span>
                    <button className={`tb-filter-btn ${filterSubject === null ? "active amber" : ""}`} onClick={() => setFilterSubject(null)}>Tất cả</button>
                    {SUBJECTS.map(s => (
                        <button key={s.id} className={`tb-filter-btn ${filterSubject === s.id ? "active amber" : ""}`} onClick={() => setFilterSubject(s.id)}>
                            {s.emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="tb-stats">
                <div className="tb-stat">
                    <div className="tb-stat-value purple">{textbooks.length}</div>
                    <div className="tb-stat-label">Sách / Chương</div>
                </div>
                <div className="tb-stat">
                    <div className="tb-stat-value amber">{textbooks.reduce((s, t) => s + (t.total_chunks || 0), 0)}</div>
                    <div className="tb-stat-label">Tổng chunks</div>
                </div>
                <div className="tb-stat">
                    <div className="tb-stat-value green">{textbooks.filter(t => t.status === "ready").length}</div>
                    <div className="tb-stat-label">Sẵn sàng</div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="tb-empty">
                    <div className="tb-loading-spinner" />
                    <p>Đang tải...</p>
                </div>
            ) : textbooks.length === 0 ? (
                <div className="tb-empty">
                    <div className="tb-empty-icon">📚</div>
                    <p className="tb-empty-title">Chưa có sách giáo khoa nào</p>
                    <p className="tb-empty-sub">Nhấn &quot;+ Thêm SGK&quot; để upload nội dung</p>
                </div>
            ) : (
                Object.entries(groupedByGrade)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([grade, books]) => (
                        <div key={grade} className="tb-grade-section">
                            <h2 className="tb-grade-title">🎓 Lớp {grade} <span>({books.length})</span></h2>
                            <div className="tb-grid">
                                {books.map(tb => {
                                    const subj = SUBJECTS.find(s => s.id === tb.subject);
                                    return (
                                        <div key={tb.id} className="tb-card">
                                            <div className="tb-card-header">
                                                <div className="tb-card-info">
                                                    <h3>{tb.title}</h3>
                                                    <div className="tb-card-tags">
                                                        <span className="tb-tag purple">{subj?.emoji} {subj?.label || tb.subject}</span>
                                                        <span className="tb-tag amber">Lớp {tb.grade}</span>
                                                        <span className={`tb-tag ${tb.status === "ready" ? "green" : tb.status === "error" ? "red" : "gray"}`}>
                                                            {tb.status === "ready" ? "✅" : tb.status === "error" ? "❌" : "⏳"} {tb.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDelete(tb.id, tb.title)} className="tb-delete-btn" title="Xóa">🗑️</button>
                                            </div>
                                            <div className="tb-card-meta">
                                                <span>📦 {tb.total_chunks} chunks</span>
                                                {tb.publisher && <span>🏢 {tb.publisher}</span>}
                                                <span>📅 {new Date(tb.created_at).toLocaleDateString("vi")}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
            )}

            <style jsx>{`
                .tb { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

                .tb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .tb-title { font-size: 24px; font-weight: 800; color: #f8fafc; margin: 0 0 4px; }
                .tb-subtitle { font-size: 13px; color: #64748b; margin: 0; }
                .tb-add-btn {
                    padding: 10px 20px; border-radius: 10px; border: none;
                    font-weight: 700; font-size: 13px; cursor: pointer;
                    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
                    color: white; transition: all 0.2s;
                }
                .tb-add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,92,246,0.3); }
                .tb-add-btn.close { background: linear-gradient(135deg, #dc2626, #ef4444); }

                /* Alerts */
                .tb-alert {
                    padding: 12px 16px; border-radius: 10px; margin-bottom: 16px;
                    font-size: 14px; font-weight: 500;
                    border: 1px solid; animation: fadeIn 0.2s ease;
                }
                .tb-alert-error { background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.3); color: #fca5a5; }
                .tb-alert-success { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #86efac; }

                /* Form */
                .tb-form {
                    background: rgba(255,255,255,0.02); border-radius: 16px;
                    padding: 24px; margin-bottom: 24px;
                    border: 1px solid rgba(255,255,255,0.06);
                    animation: fadeIn 0.3s ease;
                }
                .tb-form-title { font-size: 17px; font-weight: 700; margin: 0 0 20px; color: #e2e8f0; }
                .tb-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .tb-field { display: flex; flex-direction: column; gap: 6px; }
                .tb-field label { font-size: 12px; color: #94a3b8; font-weight: 600; }
                .tb-field input, .tb-field select, .tb-field textarea {
                    padding: 10px 14px; border-radius: 10px;
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    color: #e2e8f0; font-size: 14px; font-family: inherit;
                    transition: border-color 0.2s;
                }
                .tb-field input:focus, .tb-field select:focus, .tb-field textarea:focus {
                    outline: none; border-color: #8b5cf6;
                }
                .tb-field textarea { resize: vertical; font-family: 'JetBrains Mono', monospace; line-height: 1.6; }
                .tb-hint { font-size: 12px; color: #475569; margin-top: 4px; }
                .tb-submit-btn {
                    padding: 12px 28px; border-radius: 10px; border: none;
                    font-weight: 700; font-size: 14px; cursor: pointer;
                    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
                    color: white; transition: all 0.2s; margin-top: 8px;
                }
                .tb-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,92,246,0.3); }
                .tb-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                /* Filters */
                .tb-filters {
                    display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;
                    align-items: center;
                }
                .tb-filter-group { display: flex; align-items: center; gap: 4px; }
                .tb-filter-label { font-size: 12px; color: #475569; font-weight: 600; margin-right: 4px; }
                .tb-filter-btn {
                    padding: 5px 12px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: transparent; color: #64748b;
                    font-size: 12px; font-weight: 600; cursor: pointer;
                    transition: all 0.15s;
                }
                .tb-filter-btn:hover { border-color: rgba(255,255,255,0.12); color: #94a3b8; }
                .tb-filter-btn.active.purple { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.3); color: #c4b5fd; }
                .tb-filter-btn.active.amber { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #fcd34d; }

                /* Stats */
                .tb-stats {
                    display: flex; gap: 24px; margin-bottom: 24px; padding: 16px 20px;
                    background: rgba(255,255,255,0.02); border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .tb-stat-value {
                    font-size: 28px; font-weight: 800; line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                .tb-stat-value.purple { color: #a78bfa; }
                .tb-stat-value.amber { color: #fbbf24; }
                .tb-stat-value.green { color: #4ade80; }
                .tb-stat-label { font-size: 12px; color: #475569; margin-top: 4px; }

                /* Empty state */
                .tb-empty {
                    text-align: center; padding: 60px 20px;
                    background: rgba(255,255,255,0.02); border-radius: 16px;
                    border: 1px dashed rgba(255,255,255,0.1);
                }
                .tb-loading-spinner {
                    width: 32px; height: 32px; border-radius: 50%;
                    border: 3px solid #1e293b; border-top-color: #8b5cf6;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 12px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .tb-empty-icon { font-size: 48px; margin-bottom: 12px; }
                .tb-empty-title { font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
                .tb-empty-sub { color: #64748b; font-size: 14px; margin: 0; }

                /* Grade sections */
                .tb-grade-section { margin-bottom: 28px; }
                .tb-grade-title {
                    font-size: 15px; font-weight: 700; margin: 0 0 12px;
                    color: #c4b5fd;
                }
                .tb-grade-title span { color: #64748b; font-weight: 500; }

                /* Cards */
                .tb-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 12px;
                }
                .tb-card {
                    background: rgba(255,255,255,0.02); border-radius: 14px;
                    padding: 18px; border: 1px solid rgba(255,255,255,0.06);
                    transition: all 0.2s;
                }
                .tb-card:hover {
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .tb-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .tb-card-info { flex: 1; }
                .tb-card-info h3 { font-size: 14px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px; }
                .tb-card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
                .tb-tag {
                    font-size: 10px; padding: 3px 8px; border-radius: 6px;
                    font-weight: 600;
                }
                .tb-tag.purple { background: rgba(139,92,246,0.15); color: #c4b5fd; }
                .tb-tag.amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
                .tb-tag.green { background: rgba(34,197,94,0.15); color: #86efac; }
                .tb-tag.red { background: rgba(239,68,68,0.15); color: #fca5a5; }
                .tb-tag.gray { background: rgba(255,255,255,0.06); color: #94a3b8; }
                .tb-delete-btn {
                    background: none; border: none; cursor: pointer;
                    font-size: 16px; opacity: 0.4; transition: opacity 0.15s;
                    padding: 4px;
                }
                .tb-delete-btn:hover { opacity: 1; }
                .tb-card-meta {
                    display: flex; gap: 14px; font-size: 12px; color: #475569;
                    margin-top: 12px; padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }

                @media (max-width: 768px) {
                    .tb-header { flex-direction: column; gap: 12px; align-items: flex-start; }
                    .tb-form-grid { grid-template-columns: 1fr; }
                    .tb-grid { grid-template-columns: 1fr; }
                    .tb-stats { gap: 16px; }
                }
            `}</style>
        </div>
    );
}
