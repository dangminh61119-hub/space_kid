"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/services/supabase";

/* ═══════════════════════════════════════════════
 * Admin Race Questions Management
 * CRUD for race_questions table (Helios Planet)
 * ═══════════════════════════════════════════════ */

const JOURNEY_OPTIONS = [
    { id: "race-alpha", label: "race-alpha (Toán + Tiếng Việt)" },
    { id: "race-beta", label: "race-beta (Tiếng Anh)" },
    { id: "race-gamma", label: "race-gamma (KHMT)" },
];
const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
const GRADE_OPTIONS = [1, 2, 3, 4, 5];

interface RaceQuestion {
    id: string;
    journey_slug: string;
    subject: string;
    grade: number;
    question_text: string;
    correct_answer: string;
    wrong_answers: string[];
    difficulty: string;
    order_index: number;
}

interface Stats {
    [key: string]: number;
}

function getAuthHeaders(token: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/* ─── Main Page ─── */
export default function RaceQuestionsPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [questions, setQuestions] = useState<RaceQuestion[]>([]);
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [filterJourney, setFilterJourney] = useState("");
    const [filterGrade, setFilterGrade] = useState("");
    const [filterDifficulty, setFilterDifficulty] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // UI state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [showCreate, setShowCreate] = useState(false);
    const [editQuestion, setEditQuestion] = useState<RaceQuestion | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        supabase?.auth.getSession().then(({ data }) => {
            if (!data.session?.access_token) { router.push("/admin"); return; }
            setToken(data.session.access_token);
        });
    }, [router]);

    const fetchQuestions = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (filterJourney) params.set("journey", filterJourney);
        if (filterGrade) params.set("grade", filterGrade);
        if (filterDifficulty) params.set("difficulty", filterDifficulty);

        const res = await fetch(`/api/admin/race-questions?${params}`, { headers: getAuthHeaders(token) });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Lỗi tải dữ liệu"); setLoading(false); return; }
        setQuestions(json.data || []);
        setTotal(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
        setLoading(false);
    }, [token, page, filterJourney, filterGrade, filterDifficulty]);

    const fetchStats = useCallback(async () => {
        if (!token) return;
        const res = await fetch("/api/admin/race-questions?limit=1000", { headers: getAuthHeaders(token) });
        const json = await res.json();
        if (!res.ok) return;
        const s: Stats = {};
        (json.data || []).forEach((q: RaceQuestion) => {
            const key = `${q.journey_slug}|grade${q.grade}`;
            s[key] = (s[key] || 0) + 1;
            s[`total:${q.journey_slug}`] = (s[`total:${q.journey_slug}`] || 0) + 1;
        });
        s["grand_total"] = json.pagination?.total || 0;
        setStats(s);
    }, [token]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    async function handleDelete(ids: string[]) {
        if (!confirm(`Xóa ${ids.length} câu hỏi?`)) return;
        setDeleting(true);
        await fetch("/api/admin/race-questions", {
            method: "DELETE",
            headers: getAuthHeaders(token),
            body: JSON.stringify({ ids }),
        });
        setSelected(new Set());
        setDeleting(false);
        await fetchQuestions();
        await fetchStats();
    }

    const toggleSelect = (id: string) => {
        const newSet = new Set(selected);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setSelected(newSet);
    };

    const toggleAll = () => {
        if (selected.size === questions.length) setSelected(new Set());
        else setSelected(new Set(questions.map(q => q.id)));
    };

    const diffColor = (d: string) =>
        d === "easy" ? "text-emerald-400" : d === "medium" ? "text-yellow-400" : "text-red-400";

    const journeyColor = (j: string) =>
        j === "race-alpha" ? "bg-blue-900/50 text-blue-300" :
            j === "race-beta" ? "bg-purple-900/50 text-purple-300" :
                "bg-orange-900/50 text-orange-300";

    if (!token) return null;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button onClick={() => router.push("/admin")} className="text-gray-400 hover:text-white text-sm mb-1 flex items-center gap-1">
                        ← Admin Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        ☀️ Quản lý Race Questions
                        <span className="text-sm font-normal text-gray-400 ml-2">Helios Planet</span>
                    </h1>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    + Tạo câu hỏi
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <p className="text-gray-400 text-xs mb-1">Tổng câu hỏi</p>
                    <p className="text-2xl font-bold text-white">{stats["grand_total"] || 0}</p>
                </div>
                {JOURNEY_OPTIONS.map(j => (
                    <div key={j.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                        <p className="text-gray-400 text-xs mb-1">{j.id}</p>
                        <p className="text-2xl font-bold text-white">{stats[`total:${j.id}`] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Coverage Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-300">Phân bổ câu hỏi theo Journey × Grade</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-gray-500 p-3">Journey</th>
                                {GRADE_OPTIONS.map(g => <th key={g} className="text-gray-500 p-3">Grade {g}</th>)}
                                <th className="text-gray-500 p-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {JOURNEY_OPTIONS.map(j => (
                                <tr key={j.id} className="border-b border-gray-800/50">
                                    <td className="p-3 font-mono text-gray-300">{j.id}</td>
                                    {GRADE_OPTIONS.map(g => {
                                        const cnt = stats[`${j.id}|grade${g}`] || 0;
                                        return (
                                            <td key={g} className="p-3 text-center">
                                                <span className={cnt >= 20 ? "text-emerald-400 font-semibold" : cnt > 0 ? "text-yellow-400" : "text-red-500"}>
                                                    {cnt}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 text-center font-bold text-white">{stats[`total:${j.id}`] || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <select value={filterJourney} onChange={e => { setFilterJourney(e.target.value); setPage(1); }}
                    className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                    <option value="">Tất cả Journey</option>
                    {JOURNEY_OPTIONS.map(j => <option key={j.id} value={j.id}>{j.id}</option>)}
                </select>
                <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setPage(1); }}
                    className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                    <option value="">Tất cả Grade</option>
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value); setPage(1); }}
                    className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                    <option value="">Tất cả độ khó</option>
                    {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="ml-auto flex items-center gap-2">
                    {selected.size > 0 && (
                        <button onClick={() => handleDelete([...selected])} disabled={deleting}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm">
                            {deleting ? "Đang xóa..." : `Xóa ${selected.size} câu`}
                        </button>
                    )}
                    <span className="text-gray-400 text-sm">{total} câu hỏi</span>
                </div>
            </div>

            {/* Table */}
            {error && <div className="bg-red-900/30 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-800/50">
                                <th className="p-3 w-8">
                                    <input type="checkbox" checked={selected.size === questions.length && questions.length > 0}
                                        onChange={toggleAll} className="rounded" />
                                </th>
                                <th className="text-left p-3 text-gray-400">Journey</th>
                                <th className="text-left p-3 text-gray-400">Grade</th>
                                <th className="text-left p-3 text-gray-400">Câu hỏi</th>
                                <th className="text-left p-3 text-gray-400">Đáp án đúng</th>
                                <th className="text-left p-3 text-gray-400">Độ khó</th>
                                <th className="p-3 text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-500">Đang tải...</td></tr>
                            ) : questions.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-500">Không có câu hỏi nào</td></tr>
                            ) : questions.map(q => (
                                <tr key={q.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="p-3">
                                        <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} />
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${journeyColor(q.journey_slug)}`}>
                                            {q.journey_slug}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-gray-300">G{q.grade}</td>
                                    <td className="p-3 max-w-xs">
                                        <p className="text-white truncate">{q.question_text}</p>
                                        <p className="text-gray-500 text-xs">{q.subject}</p>
                                    </td>
                                    <td className="p-3 text-emerald-400 text-xs max-w-32 truncate">{q.correct_answer}</td>
                                    <td className="p-3">
                                        <span className={`text-xs font-medium ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setEditQuestion(q)}
                                                className="text-blue-400 hover:text-blue-300 text-xs">Sửa</button>
                                            <button onClick={() => handleDelete([q.id])}
                                                className="text-red-400 hover:text-red-300 text-xs">Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">←</button>
                    <span className="text-gray-400 text-sm">Trang {page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">→</button>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <QuestionFormModal
                    title="Tạo câu hỏi mới"
                    token={token}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); fetchQuestions(); fetchStats(); }}
                />
            )}

            {/* Edit Modal */}
            {editQuestion && (
                <QuestionFormModal
                    title="Chỉnh sửa câu hỏi"
                    token={token}
                    initial={editQuestion}
                    onClose={() => setEditQuestion(null)}
                    onSuccess={() => { setEditQuestion(null); fetchQuestions(); }}
                />
            )}
        </div>
    );
}

/* ─── Question Form Modal ─── */
function QuestionFormModal({
    title, token, initial, onClose, onSuccess,
}: {
    title: string;
    token: string;
    initial?: RaceQuestion;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        journey_slug: initial?.journey_slug || "race-alpha",
        subject: initial?.subject || "Toán",
        grade: initial?.grade || 3,
        question_text: initial?.question_text || "",
        correct_answer: initial?.correct_answer || "",
        wrong_answers: initial?.wrong_answers?.join("|") || "",
        difficulty: initial?.difficulty || "medium",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit() {
        const wrong = form.wrong_answers.split("|").map(s => s.trim()).filter(Boolean);
        if (!form.question_text || !form.correct_answer || wrong.length < 2) {
            setError("Vui lòng điền đầy đủ: câu hỏi, đáp án đúng, và ít nhất 2 đáp án sai (phân cách |)");
            return;
        }
        setSaving(true);
        const method = initial ? "PUT" : "POST";
        const body = initial ? { id: initial.id, ...form, wrong_answers: wrong } : { ...form, wrong_answers: wrong };
        const res = await fetch("/api/admin/race-questions", {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        setSaving(false);
        if (!res.ok) { setError(json.error || "Lỗi lưu câu hỏi"); return; }
        onSuccess();
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-xs text-gray-400">Journey</span>
                        <select value={form.journey_slug} onChange={e => setForm({ ...form, journey_slug: e.target.value })}
                            className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                            {JOURNEY_OPTIONS.map(j => <option key={j.id} value={j.id}>{j.id}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs text-gray-400">Môn học</span>
                        <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                            className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                    </label>
                    <label className="block">
                        <span className="text-xs text-gray-400">Grade</span>
                        <select value={form.grade} onChange={e => setForm({ ...form, grade: parseInt(e.target.value) })}
                            className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                            {GRADE_OPTIONS.map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs text-gray-400">Độ khó</span>
                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                            className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1">
                            {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </label>
                </div>

                <label className="block">
                    <span className="text-xs text-gray-400">Câu hỏi</span>
                    <textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })}
                        className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" rows={2} />
                </label>
                <label className="block">
                    <span className="text-xs text-gray-400">Đáp án đúng</span>
                    <input value={form.correct_answer} onChange={e => setForm({ ...form, correct_answer: e.target.value })}
                        className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                </label>
                <label className="block">
                    <span className="text-xs text-gray-400">Đáp án sai (phân cách bằng |, ít nhất 2)</span>
                    <input value={form.wrong_answers} onChange={e => setForm({ ...form, wrong_answers: e.target.value })}
                        placeholder="Đáp án 1|Đáp án 2|Đáp án 3"
                        className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-700 mt-1" />
                </label>

                {/* Preview */}
                {form.correct_answer && (
                    <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-2">Preview options:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[form.correct_answer, ...form.wrong_answers.split("|").filter(Boolean)].slice(0, 4).map((opt, i) => (
                                <div key={i} className={`rounded px-2 py-1 text-xs ${opt === form.correct_answer ? "bg-emerald-900/50 text-emerald-300 border border-emerald-600" : "bg-gray-700 text-gray-300"}`}>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Hủy</button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
                        {saving ? "Đang lưu..." : initial ? "Cập nhật" : "Tạo mới"}
                    </button>
                </div>
            </div>
        </div>
    );
}
