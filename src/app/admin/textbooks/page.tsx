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

    // Filters
    const [filterGrade, setFilterGrade] = useState<number | null>(null);
    const [filterSubject, setFilterSubject] = useState<string | null>(null);

    // Upload form
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
            console.error("Failed to fetch textbooks:", err);
        } finally {
            setLoading(false);
        }
    }, [token, filterGrade, filterSubject]);

    useEffect(() => {
        fetchTextbooks();
    }, [fetchTextbooks]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setError("");
        setSuccess("");
        setProcessing(true);

        try {
            const res = await fetch("/api/admin/textbooks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: formTitle,
                    subject: formSubject,
                    grade: formGrade,
                    publisher: formPublisher,
                    content: formContent,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Upload failed");
                return;
            }

            setSuccess(`✅ Upload thành công! ${data.chunks} chunks đã được tạo.`);
            setFormTitle("");
            setFormContent("");
            setFormPublisher("");
            setShowForm(false);
            fetchTextbooks();
        } catch (err) {
            setError("Network error: " + String(err));
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!token) return;
        if (!confirm(`Xóa sách "${title}"? Tất cả chunks sẽ bị xóa.`)) return;

        try {
            await fetch(`/api/admin/textbooks?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTextbooks();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // Group textbooks by grade
    const groupedByGrade = textbooks.reduce<Record<number, Textbook[]>>((acc, tb) => {
        if (!acc[tb.grade]) acc[tb.grade] = [];
        acc[tb.grade].push(tb);
        return acc;
    }, {});

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>📚 Quản lý Sách Giáo Khoa</h1>
                    <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>
                        Upload và quản lý nội dung SGK cho hệ thống RAG
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? "#ef4444" : "#8b5cf6",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    {showForm ? "✕ Đóng" : "+ Thêm SGK"}
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div style={{ background: "#7f1d1d", border: "1px solid #dc2626", borderRadius: 8, padding: 12, marginBottom: 16, color: "#fca5a5" }}>
                    ❌ {error}
                </div>
            )}
            {success && (
                <div style={{ background: "#14532d", border: "1px solid #22c55e", borderRadius: 8, padding: 12, marginBottom: 16, color: "#86efac" }}>
                    {success}
                </div>
            )}

            {/* Upload Form */}
            {showForm && (
                <form onSubmit={handleUpload} style={{
                    background: "#1f2937",
                    borderRadius: 12,
                    padding: 24,
                    marginBottom: 24,
                    border: "1px solid #374151",
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📝 Thêm nội dung SGK mới</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: "block", fontSize: 13, color: "#d1d5db", marginBottom: 4 }}>Tên sách / Chương</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                placeholder="VD: Toán 3 - Chương 5: Phép nhân"
                                required
                                style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 6,
                                    background: "#111827", border: "1px solid #4b5563",
                                    color: "white", fontSize: 14,
                                }}
                            />
                        </div>

                        {/* Publisher */}
                        <div>
                            <label style={{ display: "block", fontSize: 13, color: "#d1d5db", marginBottom: 4 }}>Nhà xuất bản</label>
                            <input
                                type="text"
                                value={formPublisher}
                                onChange={e => setFormPublisher(e.target.value)}
                                placeholder="VD: NXB Giáo dục"
                                style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 6,
                                    background: "#111827", border: "1px solid #4b5563",
                                    color: "white", fontSize: 14,
                                }}
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label style={{ display: "block", fontSize: 13, color: "#d1d5db", marginBottom: 4 }}>Môn học</label>
                            <select
                                value={formSubject}
                                onChange={e => setFormSubject(e.target.value)}
                                style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 6,
                                    background: "#111827", border: "1px solid #4b5563",
                                    color: "white", fontSize: 14,
                                }}
                            >
                                {SUBJECTS.map(s => (
                                    <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Grade */}
                        <div>
                            <label style={{ display: "block", fontSize: 13, color: "#d1d5db", marginBottom: 4 }}>Lớp</label>
                            <select
                                value={formGrade}
                                onChange={e => setFormGrade(parseInt(e.target.value))}
                                style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 6,
                                    background: "#111827", border: "1px solid #4b5563",
                                    color: "white", fontSize: 14,
                                }}
                            >
                                {GRADES.map(g => (
                                    <option key={g} value={g}>Lớp {g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content textarea */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, color: "#d1d5db", marginBottom: 4 }}>
                            Nội dung SGK (paste text)
                        </label>
                        <textarea
                            value={formContent}
                            onChange={e => setFormContent(e.target.value)}
                            placeholder={`Paste nội dung sách giáo khoa vào đây...\n\nVí dụ:\nChương 5: Phép nhân\n\nBài 25: Nhân số có hai chữ số với số có một chữ số\n\nĐể nhân số có hai chữ số với số có một chữ số, ta thực hiện:\n1. Nhân hàng đơn vị\n2. Nhân hàng chục\n...`}
                            required
                            rows={12}
                            style={{
                                width: "100%", padding: "12px", borderRadius: 6,
                                background: "#111827", border: "1px solid #4b5563",
                                color: "white", fontSize: 14, resize: "vertical",
                                fontFamily: "monospace", lineHeight: 1.6,
                            }}
                        />
                        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            💡 Hệ thống sẽ tự động chia nhỏ nội dung (~400 từ/chunk) và tạo embedding cho tìm kiếm.
                            Nội dung càng chi tiết, kết quả tìm kiếm càng chính xác.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !formTitle || !formContent}
                        style={{
                            background: processing ? "#6b7280" : "#8b5cf6",
                            color: "white",
                            padding: "10px 24px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 600,
                            cursor: processing ? "not-allowed" : "pointer",
                            fontSize: 14,
                        }}
                    >
                        {processing ? "⏳ Đang xử lý..." : "🚀 Upload & Tạo Embedding"}
                    </button>
                </form>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ color: "#9ca3af", fontSize: 13, alignSelf: "center" }}>Lọc:</span>

                {/* Grade filter */}
                <button
                    onClick={() => setFilterGrade(null)}
                    style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid",
                        borderColor: filterGrade === null ? "#8b5cf6" : "#4b5563",
                        background: filterGrade === null ? "#8b5cf620" : "transparent",
                        color: filterGrade === null ? "#c4b5fd" : "#9ca3af",
                        fontSize: 13, cursor: "pointer",
                    }}
                >
                    Tất cả lớp
                </button>
                {GRADES.map(g => (
                    <button
                        key={g}
                        onClick={() => setFilterGrade(g)}
                        style={{
                            padding: "6px 14px", borderRadius: 6, border: "1px solid",
                            borderColor: filterGrade === g ? "#8b5cf6" : "#4b5563",
                            background: filterGrade === g ? "#8b5cf620" : "transparent",
                            color: filterGrade === g ? "#c4b5fd" : "#9ca3af",
                            fontSize: 13, cursor: "pointer",
                        }}
                    >
                        Lớp {g}
                    </button>
                ))}

                <div style={{ width: 1, background: "#374151", margin: "0 4px" }} />

                {/* Subject filter */}
                <button
                    onClick={() => setFilterSubject(null)}
                    style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid",
                        borderColor: filterSubject === null ? "#f59e0b" : "#4b5563",
                        background: filterSubject === null ? "#f59e0b20" : "transparent",
                        color: filterSubject === null ? "#fcd34d" : "#9ca3af",
                        fontSize: 13, cursor: "pointer",
                    }}
                >
                    Tất cả môn
                </button>
                {SUBJECTS.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setFilterSubject(s.id)}
                        style={{
                            padding: "6px 14px", borderRadius: 6, border: "1px solid",
                            borderColor: filterSubject === s.id ? "#f59e0b" : "#4b5563",
                            background: filterSubject === s.id ? "#f59e0b20" : "transparent",
                            color: filterSubject === s.id ? "#fcd34d" : "#9ca3af",
                            fontSize: 13, cursor: "pointer",
                        }}
                    >
                        {s.emoji} {s.label}
                    </button>
                ))}
            </div>

            {/* Stats bar */}
            <div style={{
                display: "flex", gap: 16, marginBottom: 20, padding: 16,
                background: "#1f2937", borderRadius: 10, border: "1px solid #374151",
            }}>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#8b5cf6" }}>{textbooks.length}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Sách / Chương</div>
                </div>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>
                        {textbooks.reduce((s, t) => s + (t.total_chunks || 0), 0)}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Tổng chunks</div>
                </div>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
                        {textbooks.filter(t => t.status === "ready").length}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Sẵn sàng</div>
                </div>
            </div>

            {/* Textbook list grouped by grade */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                    ⏳ Đang tải...
                </div>
            ) : textbooks.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: 60,
                    background: "#1f2937", borderRadius: 12,
                    border: "1px dashed #4b5563",
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có sách giáo khoa nào</p>
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>
                        Nhấn &quot;+ Thêm SGK&quot; để upload nội dung sách giáo khoa
                    </p>
                </div>
            ) : (
                Object.entries(groupedByGrade)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([grade, books]) => (
                        <div key={grade} style={{ marginBottom: 24 }}>
                            <h2 style={{
                                fontSize: 16, fontWeight: 700, marginBottom: 10,
                                padding: "8px 14px", background: "#1e1b4b",
                                borderRadius: 8, display: "inline-block",
                                color: "#a78bfa",
                            }}>
                                🎓 Lớp {grade} ({books.length} sách)
                            </h2>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: 12,
                            }}>
                                {books.map(tb => {
                                    const subjectInfo = SUBJECTS.find(s => s.id === tb.subject);
                                    return (
                                        <div
                                            key={tb.id}
                                            style={{
                                                background: "#1f2937",
                                                borderRadius: 10,
                                                padding: 16,
                                                border: "1px solid #374151",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                                                        {tb.title}
                                                    </h3>
                                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                        <span style={{
                                                            fontSize: 11, padding: "2px 8px", borderRadius: 4,
                                                            background: "#8b5cf620", color: "#c4b5fd",
                                                        }}>
                                                            {subjectInfo?.emoji} {subjectInfo?.label || tb.subject}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 11, padding: "2px 8px", borderRadius: 4,
                                                            background: "#f59e0b20", color: "#fcd34d",
                                                        }}>
                                                            Lớp {tb.grade}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 11, padding: "2px 8px", borderRadius: 4,
                                                            background: tb.status === "ready" ? "#22c55e20" : tb.status === "error" ? "#ef444420" : "#6b728020",
                                                            color: tb.status === "ready" ? "#86efac" : tb.status === "error" ? "#fca5a5" : "#d1d5db",
                                                        }}>
                                                            {tb.status === "ready" ? "✅" : tb.status === "error" ? "❌" : "⏳"} {tb.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(tb.id, tb.title)}
                                                    style={{
                                                        background: "none", border: "none",
                                                        color: "#ef4444", cursor: "pointer",
                                                        fontSize: 16, padding: "4px",
                                                    }}
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            <div style={{
                                                display: "flex", gap: 12, fontSize: 12,
                                                color: "#9ca3af", marginTop: 8,
                                            }}>
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
        </div>
    );
}
