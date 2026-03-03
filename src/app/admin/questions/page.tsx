"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

interface Question {
    id: string;
    planet_id: string;
    subject: string;
    grade: number;
    type: "word" | "math" | "open-ended";
    status: "draft" | "review" | "approved";
    bloom_level: number;
    difficulty: string;
    question_text: string | null;
    correct_word: string | null;
    wrong_words: string[] | null;
    equation: string | null;
    answer: number | null;
    options: number[] | null;
    accept_answers: string[] | null;
    difficulty_score: number;
    curriculum_ref: string;
    reviewed_by_teacher: boolean;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const PLANET_OPTIONS = [
    { id: "ha-long", name: "Vịnh Hạ Long" },
    { id: "hue", name: "Cố đô Huế" },
    { id: "giong", name: "Làng Gióng" },
    { id: "phong-nha", name: "Phong Nha" },
    { id: "hoi-an", name: "Hội An" },
    { id: "sapa", name: "Sa Pa" },
    { id: "hanoi", name: "Hà Nội" },
    { id: "mekong", name: "Mê Kông" },
];

function QuestionsContent() {
    const { session } = useAuth();
    const searchParams = useSearchParams();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showCreate, setShowCreate] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Filters
    const [filterPlanet, setFilterPlanet] = useState(searchParams.get("planet") || "");
    const [filterGrade, setFilterGrade] = useState(searchParams.get("grade") || "");
    const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
    const [filterType, setFilterType] = useState(searchParams.get("type") || "");

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
    }), [session]);

    const fetchQuestions = useCallback(async (page = 1) => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "50" });
            if (filterPlanet) params.set("planet", filterPlanet);
            if (filterGrade) params.set("grade", filterGrade);
            if (filterStatus) params.set("status", filterStatus);
            if (filterType) params.set("type", filterType);

            const res = await fetch(`/api/admin/questions?${params}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const json = await res.json();
            setQuestions(json.data || []);
            setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
        } catch {
            showMessage("error", "Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [session, filterPlanet, filterGrade, filterStatus, filterType]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    function showMessage(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    }

    // ─── Bulk Actions ───
    async function handleBulkApprove() {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        const res = await fetch("/api/admin/questions/approve", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ ids, action: "approve" }),
        });
        const json = await res.json();
        if (res.ok) {
            showMessage("success", json.message);
            setSelected(new Set());
            fetchQuestions(pagination.page);
        } else {
            showMessage("error", json.error);
        }
    }

    async function handleBulkReject() {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        const res = await fetch("/api/admin/questions/approve", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ ids, action: "reject" }),
        });
        const json = await res.json();
        if (res.ok) {
            showMessage("success", json.message);
            setSelected(new Set());
            fetchQuestions(pagination.page);
        } else {
            showMessage("error", json.error);
        }
    }

    async function handleBulkDelete() {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        if (!confirm(`Xóa ${ids.length} câu hỏi? Hành động này không thể hoàn tác!`)) return;
        const res = await fetch("/api/admin/questions", {
            method: "DELETE",
            headers: authHeaders(),
            body: JSON.stringify({ ids }),
        });
        const json = await res.json();
        if (res.ok) {
            showMessage("success", json.message);
            setSelected(new Set());
            fetchQuestions(pagination.page);
        } else {
            showMessage("error", json.error);
        }
    }

    // ─── Select All ───
    function toggleSelectAll() {
        if (selected.size === questions.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(questions.map(q => q.id)));
        }
    }

    function toggleSelect(id: string) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý câu hỏi</h2>
                    <p className="text-gray-400 text-sm">Tổng: {pagination.total} câu hỏi</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowImport(true)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
                        📥 Import
                    </button>
                    <button onClick={() => setShowCreate(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors">
                        ➕ Tạo mới
                    </button>
                </div>
            </div>

            {/* Message toast */}
            {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-900/50 text-green-300 border border-green-800" : "bg-red-900/50 text-red-300 border border-red-800"}`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-gray-900 p-3 rounded-lg border border-gray-800">
                <select value={filterPlanet} onChange={e => setFilterPlanet(e.target.value)} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700">
                    <option value="">Tất cả hành tinh</option>
                    {PLANET_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700">
                    <option value="">Tất cả lớp</option>
                    {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700">
                    <option value="">Tất cả status</option>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-800 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700">
                    <option value="">Tất cả loại</option>
                    <option value="word">Word</option>
                    <option value="math">Math</option>
                    <option value="open-ended">Open-ended</option>
                </select>
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 bg-blue-950/50 p-3 rounded-lg border border-blue-800">
                    <span className="text-sm text-blue-300">Đã chọn {selected.size} câu hỏi</span>
                    <button onClick={handleBulkApprove} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium">✅ Duyệt</button>
                    <button onClick={handleBulkReject} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium">↩️ Reject</button>
                    <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium">🗑️ Xóa</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm">
                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-3 text-left">
                                <input type="checkbox" checked={selected.size === questions.length && questions.length > 0} onChange={toggleSelectAll} className="rounded" />
                            </th>
                            <th className="p-3 text-left">Nội dung</th>
                            <th className="p-3 text-left">Hành tinh</th>
                            <th className="p-3 text-center">Lớp</th>
                            <th className="p-3 text-center">Loại</th>
                            <th className="p-3 text-center">Bloom</th>
                            <th className="p-3 text-center">Độ khó</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={9} className="p-8 text-center text-gray-500">Đang tải...</td></tr>
                        ) : questions.length === 0 ? (
                            <tr><td colSpan={9} className="p-8 text-center text-gray-500">Không có câu hỏi nào</td></tr>
                        ) : questions.map(q => (
                            <tr key={q.id} className={`hover:bg-gray-900/50 ${selected.has(q.id) ? "bg-blue-950/30" : ""}`}>
                                <td className="p-3"><input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} /></td>
                                <td className="p-3 max-w-xs">
                                    <div className="truncate text-white">{q.question_text || q.equation || "—"}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {q.type === "word" ? `✓ ${q.correct_word}` : q.type === "math" ? `= ${q.answer}` : `✓ ${q.correct_word}`}
                                    </div>
                                </td>
                                <td className="p-3 text-gray-300">{q.planet_id}</td>
                                <td className="p-3 text-center">{q.grade}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${q.type === "word" ? "bg-blue-900 text-blue-300" : q.type === "math" ? "bg-purple-900 text-purple-300" : "bg-teal-900 text-teal-300"}`}>
                                        {q.type}
                                    </span>
                                </td>
                                <td className="p-3 text-center text-gray-300">L{q.bloom_level}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${q.difficulty === "easy" ? "bg-green-900 text-green-300" : q.difficulty === "medium" ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}>
                                        {q.difficulty}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.status === "approved" ? "bg-green-900 text-green-300" : q.status === "review" ? "bg-blue-900 text-blue-300" : "bg-gray-700 text-gray-300"}`}>
                                        {q.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => setEditingId(q.id)} className="text-blue-400 hover:text-blue-300 text-xs mr-2">✏️</button>
                                    <button onClick={async () => {
                                        if (!confirm("Xóa câu hỏi này?")) return;
                                        await fetch("/api/admin/questions", {
                                            method: "DELETE",
                                            headers: authHeaders(),
                                            body: JSON.stringify({ id: q.id }),
                                        });
                                        fetchQuestions(pagination.page);
                                    }} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(0, 10).map(p => (
                        <button
                            key={p}
                            onClick={() => fetchQuestions(p)}
                            className={`px-3 py-1 rounded text-sm ${p === pagination.page ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                        >{p}</button>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <CreateQuestionModal
                    authHeaders={authHeaders()}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); fetchQuestions(); showMessage("success", "Đã tạo câu hỏi mới (draft)"); }}
                />
            )}

            {/* Import Modal */}
            {showImport && (
                <ImportModal
                    authHeaders={authHeaders()}
                    onClose={() => setShowImport(false)}
                    onSuccess={(msg) => { setShowImport(false); fetchQuestions(); showMessage("success", msg); }}
                />
            )}

            {/* Edit Modal */}
            {editingId && (
                <EditQuestionModal
                    question={questions.find(q => q.id === editingId)!}
                    authHeaders={authHeaders()}
                    onClose={() => setEditingId(null)}
                    onSuccess={() => { setEditingId(null); fetchQuestions(pagination.page); showMessage("success", "Đã cập nhật"); }}
                />
            )}
        </div>
    );
}

// ─── Create Modal ────────────────────────
function CreateQuestionModal({ authHeaders, onClose, onSuccess }: {
    authHeaders: Record<string, string>;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        planet_id: "hue", subject: "Lịch sử", grade: 3, bloom_level: 1,
        difficulty: "easy", type: "word",
        question_text: "", correct_word: "", wrong_words: "",
        equation: "", answer: "", options: "",
        accept_answers: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const body: Record<string, unknown> = {
            planet_id: form.planet_id,
            subject: form.subject,
            grade: form.grade,
            bloom_level: form.bloom_level,
            difficulty: form.difficulty,
            type: form.type,
        };

        if (form.type === "word" || form.type === "open-ended") {
            body.question_text = form.question_text;
            body.correct_word = form.correct_word;
        }
        if (form.type === "word") {
            body.wrong_words = form.wrong_words.split("|").map(w => w.trim()).filter(Boolean);
        }
        if (form.type === "open-ended") {
            body.accept_answers = form.accept_answers.split("|").map(w => w.trim()).filter(Boolean);
        }
        if (form.type === "math") {
            body.equation = form.equation;
            body.answer = parseFloat(form.answer);
            body.options = form.options.split("|").map(Number).filter(n => !isNaN(n));
        }

        const res = await fetch("/api/admin/questions", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(body),
        });
        const json = await res.json();
        setSubmitting(false);

        if (res.ok) {
            onSuccess();
        } else {
            setError(json.details?.join(", ") || json.error || "Error");
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Tạo câu hỏi mới</h3>
                {error && <div className="bg-red-900/50 text-red-300 text-sm p-2 rounded mb-3">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs text-gray-400">Hành tinh</span>
                            <select value={form.planet_id} onChange={e => setForm({ ...form, planet_id: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {PLANET_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-400">Lớp</span>
                            <select value={form.grade} onChange={e => setForm({ ...form, grade: parseInt(e.target.value) })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="block">
                            <span className="text-xs text-gray-400">Loại</span>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                <option value="word">Word</option>
                                <option value="math">Math</option>
                                <option value="open-ended">Open-ended</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-400">Bloom level</span>
                            <select value={form.bloom_level} onChange={e => setForm({ ...form, bloom_level: parseInt(e.target.value) })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>L{l}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-400">Độ khó</span>
                            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-xs text-gray-400">Môn học</span>
                        <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="Lịch sử" />
                    </label>

                    {/* Word / Open-ended fields */}
                    {(form.type === "word" || form.type === "open-ended") && (
                        <>
                            <label className="block">
                                <span className="text-xs text-gray-400">Câu hỏi</span>
                                <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" rows={2} />
                            </label>
                            <label className="block">
                                <span className="text-xs text-gray-400">Đáp án đúng</span>
                                <input value={form.correct_word} onChange={e => setForm({ ...form, correct_word: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                            </label>
                        </>
                    )}
                    {form.type === "word" && (
                        <label className="block">
                            <span className="text-xs text-gray-400">Đáp án sai (phân cách bằng |)</span>
                            <input value={form.wrong_words} onChange={e => setForm({ ...form, wrong_words: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="Lê|Trần|Lý" />
                        </label>
                    )}
                    {form.type === "open-ended" && (
                        <label className="block">
                            <span className="text-xs text-gray-400">Các đáp án chấp nhận (|)</span>
                            <input value={form.accept_answers} onChange={e => setForm({ ...form, accept_answers: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="đáp án 1|đáp án 2" />
                        </label>
                    )}

                    {/* Math fields */}
                    {form.type === "math" && (
                        <>
                            <label className="block">
                                <span className="text-xs text-gray-400">Phương trình</span>
                                <input value={form.equation} onChange={e => setForm({ ...form, equation: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="12 + 8 = ?" />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs text-gray-400">Đáp án</span>
                                    <input value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="20" />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-400">Options (|)</span>
                                    <input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" placeholder="10|20|30|40" />
                                </label>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium disabled:opacity-50">
                            {submitting ? "Đang tạo..." : "Tạo (Draft)"}
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Edit Modal ──────────────────────────
function EditQuestionModal({ question, authHeaders, onClose, onSuccess }: {
    question: Question;
    authHeaders: Record<string, string>;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        planet_id: question.planet_id,
        subject: question.subject,
        grade: question.grade,
        bloom_level: question.bloom_level,
        difficulty: question.difficulty,
        type: question.type,
        question_text: question.question_text || "",
        correct_word: question.correct_word || "",
        wrong_words: question.wrong_words?.join("|") || "",
        equation: question.equation || "",
        answer: String(question.answer ?? ""),
        options: question.options?.join("|") || "",
        accept_answers: question.accept_answers?.join("|") || "",
        status: question.status,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const body: Record<string, unknown> = {
            id: question.id,
            planet_id: form.planet_id,
            subject: form.subject,
            grade: form.grade,
            bloom_level: form.bloom_level,
            difficulty: form.difficulty,
            type: form.type,
            status: form.status,
        };

        if (form.type === "word" || form.type === "open-ended") {
            body.question_text = form.question_text;
            body.correct_word = form.correct_word;
        }
        if (form.type === "word") {
            body.wrong_words = form.wrong_words.split("|").map(w => w.trim()).filter(Boolean);
        }
        if (form.type === "open-ended") {
            body.accept_answers = form.accept_answers.split("|").map(w => w.trim()).filter(Boolean);
        }
        if (form.type === "math") {
            body.equation = form.equation;
            body.answer = parseFloat(form.answer);
            body.options = form.options.split("|").map(Number).filter(n => !isNaN(n));
        }

        const res = await fetch("/api/admin/questions", {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify(body),
        });
        const json = await res.json();
        setSubmitting(false);

        if (res.ok) onSuccess();
        else setError(json.details?.join(", ") || json.error || "Error");
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Chỉnh sửa câu hỏi</h3>
                {error && <div className="bg-red-900/50 text-red-300 text-sm p-2 rounded mb-3">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Same fields as Create but with pre-filled values */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs text-gray-400">Hành tinh</span>
                            <select value={form.planet_id} onChange={e => setForm({ ...form, planet_id: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {PLANET_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-400">Lớp</span>
                            <select value={form.grade} onChange={e => setForm({ ...form, grade: parseInt(e.target.value) })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs text-gray-400">Bloom</span>
                            <select value={form.bloom_level} onChange={e => setForm({ ...form, bloom_level: parseInt(e.target.value) })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>L{l}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs text-gray-400">Status</span>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as "draft" | "review" | "approved" })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                                <option value="draft">Draft</option>
                                <option value="review">Review</option>
                                <option value="approved">Approved</option>
                            </select>
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-xs text-gray-400">Môn</span>
                        <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                    </label>

                    {(form.type === "word" || form.type === "open-ended") && (
                        <>
                            <label className="block">
                                <span className="text-xs text-gray-400">Câu hỏi</span>
                                <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" rows={2} />
                            </label>
                            <label className="block">
                                <span className="text-xs text-gray-400">Đáp án đúng</span>
                                <input value={form.correct_word} onChange={e => setForm({ ...form, correct_word: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                            </label>
                        </>
                    )}
                    {form.type === "word" && (
                        <label className="block">
                            <span className="text-xs text-gray-400">Đáp án sai (|)</span>
                            <input value={form.wrong_words} onChange={e => setForm({ ...form, wrong_words: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                        </label>
                    )}
                    {form.type === "open-ended" && (
                        <label className="block">
                            <span className="text-xs text-gray-400">Đáp án chấp nhận (|)</span>
                            <input value={form.accept_answers} onChange={e => setForm({ ...form, accept_answers: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                        </label>
                    )}
                    {form.type === "math" && (
                        <>
                            <label className="block">
                                <span className="text-xs text-gray-400">Phương trình</span>
                                <input value={form.equation} onChange={e => setForm({ ...form, equation: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs text-gray-400">Đáp án</span>
                                    <input value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-400">Options (|)</span>
                                    <input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                                </label>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium disabled:opacity-50">
                            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Import Modal ────────────────────────
function ImportModal({ authHeaders, onClose, onSuccess }: {
    authHeaders: Record<string, string>;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}) {
    const [fileContent, setFileContent] = useState("");
    const [format, setFormat] = useState<"json" | "csv">("json");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setFileContent(reader.result as string);
        reader.readAsText(file);
        if (file.name.endsWith(".csv")) setFormat("csv");
        else setFormat("json");
    }

    async function handleImport() {
        if (!fileContent) return;
        setSubmitting(true);
        setError("");

        const headers: Record<string, string> = { ...authHeaders };
        headers["Content-Type"] = format === "json" ? "application/json" : "text/csv";

        const res = await fetch("/api/admin/questions/import", {
            method: "POST",
            headers,
            body: fileContent,
        });
        const json = await res.json();
        setSubmitting(false);

        if (res.ok) {
            onSuccess(`Import thành công: ${json.imported} câu hỏi, bỏ qua: ${json.skipped || 0}`);
        } else {
            setError(json.error + (json.validationErrors ? "\n" + json.validationErrors.join("\n") : ""));
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">📥 Import câu hỏi</h3>
                {error && <div className="bg-red-900/50 text-red-300 text-sm p-2 rounded mb-3 whitespace-pre-wrap max-h-32 overflow-y-auto">{error}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Chọn file (.json hoặc .csv)</label>
                        <input type="file" accept=".json,.csv" onChange={handleFile} className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600" />
                    </div>

                    {fileContent && (
                        <div>
                            <div className="text-xs text-gray-400 mb-1">Preview ({format.toUpperCase()}, {fileContent.length} chars)</div>
                            <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300 max-h-40 overflow-auto">{fileContent.slice(0, 1000)}{fileContent.length > 1000 ? "..." : ""}</pre>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={handleImport} disabled={!fileContent || submitting} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50">
                            {submitting ? "Đang import..." : "Import (Draft)"}
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Hủy</button>
                    </div>

                    <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
                        <p className="font-medium mb-1">JSON format:</p>
                        <code className="text-gray-400">{`[{"planet_id":"hue","subject":"Lịch sử","grade":3,...}]`}</code>
                        <p className="font-medium mt-2 mb-1">CSV header:</p>
                        <code className="text-gray-400 text-[10px]">planet_id,subject,grade,bloom_level,difficulty,type,question_text,correct_word,wrong_words</code>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminQuestionsPage() {
    return (
        <Suspense fallback={<div className="text-gray-400 p-8">Đang tải...</div>}>
            <QuestionsContent />
        </Suspense>
    );
}
