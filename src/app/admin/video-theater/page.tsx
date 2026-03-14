"use client";

import { useState, useEffect, useCallback } from "react";
import {
    adminGetAllSeries, adminCreateSeries, adminUpdateSeries, adminDeleteSeries,
    adminGetEpisodes, adminCreateEpisode, adminUpdateEpisode, adminDeleteEpisode,
    adminGetQuizQuestions, adminCreateQuizQuestion, adminUpdateQuizQuestion, adminDeleteQuizQuestion,
    type VideoSeries,
} from "@/lib/services/video-theater-service";
import { type DBVideoEpisode, type DBVideoQuizQuestion } from "@/lib/services/supabase";

type Tab = "series" | "episodes" | "quiz";

const CATEGORIES = [
    { id: "english", label: "Tiếng Anh", emoji: "🌍" },
    { id: "math", label: "Toán học", emoji: "🔢" },
    { id: "science", label: "Khoa học", emoji: "🔬" },
];

export default function AdminVideoTheaterPage() {
    const [tab, setTab] = useState<Tab>("series");
    const [seriesList, setSeriesList] = useState<VideoSeries[]>([]);
    const [episodes, setEpisodes] = useState<DBVideoEpisode[]>([]);
    const [quizQuestions, setQuizQuestions] = useState<DBVideoQuizQuestion[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Load series
    const loadSeries = useCallback(async () => {
        setLoading(true);
        const data = await adminGetAllSeries();
        setSeriesList(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadSeries(); }, [loadSeries]);

    // Load episodes
    const loadEpisodes = useCallback(async (seriesId: string) => {
        setLoading(true);
        const data = await adminGetEpisodes(seriesId);
        setEpisodes(data);
        setLoading(false);
    }, []);

    // Load quiz
    const loadQuiz = useCallback(async (episodeId: string) => {
        setLoading(true);
        const data = await adminGetQuizQuestions(episodeId);
        setQuizQuestions(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (tab === "episodes" && selectedSeriesId) loadEpisodes(selectedSeriesId);
        if (tab === "quiz" && selectedEpisodeId) loadQuiz(selectedEpisodeId);
    }, [tab, selectedSeriesId, selectedEpisodeId, loadEpisodes, loadQuiz]);

    // ── Handlers ──
    const openCreateForm = () => {
        setEditId(null);
        if (tab === "series") {
            setFormData({ title: "", description: "", thumbnail_url: "", category: "english", grade_min: 1, grade_max: 5, unlock_cost: 0, order_index: seriesList.length });
        } else if (tab === "episodes") {
            setFormData({ title: "", youtube_id: "", duration_seconds: 0, order_index: episodes.length });
        } else {
            setFormData({ question_text: "", options: ["", "", "", ""], correct_index: 0, order_index: quizQuestions.length });
        }
        setShowForm(true);
    };

    const openEditForm = (item: any) => {
        setEditId(item.id);
        if (tab === "series") {
            setFormData({
                title: item.title, description: item.description,
                thumbnail_url: item.thumbnailUrl || item.thumbnail_url || "",
                category: item.category, grade_min: item.gradeMin || item.grade_min || 1,
                grade_max: item.gradeMax || item.grade_max || 5,
                unlock_cost: item.unlockCost || item.unlock_cost || 0,
                order_index: item.orderIndex || item.order_index || 0,
            });
        } else if (tab === "episodes") {
            setFormData({
                title: item.title, youtube_id: item.youtube_id,
                duration_seconds: item.duration_seconds, order_index: item.order_index,
            });
        } else {
            setFormData({
                question_text: item.question_text,
                options: Array.isArray(item.options) ? [...item.options] : ["", "", "", ""],
                correct_index: item.correct_index, order_index: item.order_index,
            });
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        if (tab === "series") {
            if (editId) {
                await adminUpdateSeries(editId, {
                    title: formData.title, description: formData.description,
                    thumbnail_url: formData.thumbnail_url, category: formData.category,
                    grade_min: Number(formData.grade_min), grade_max: Number(formData.grade_max),
                    unlock_cost: Number(formData.unlock_cost), order_index: Number(formData.order_index),
                } as any);
            } else {
                await adminCreateSeries({
                    title: formData.title, description: formData.description,
                    thumbnail_url: formData.thumbnail_url, category: formData.category,
                    grade_min: Number(formData.grade_min), grade_max: Number(formData.grade_max),
                    unlock_cost: Number(formData.unlock_cost), order_index: Number(formData.order_index),
                });
            }
            loadSeries();
        } else if (tab === "episodes" && selectedSeriesId) {
            if (editId) {
                await adminUpdateEpisode(editId, {
                    title: formData.title, youtube_id: formData.youtube_id,
                    duration_seconds: Number(formData.duration_seconds), order_index: Number(formData.order_index),
                } as any);
            } else {
                await adminCreateEpisode({
                    series_id: selectedSeriesId, title: formData.title,
                    youtube_id: formData.youtube_id,
                    duration_seconds: Number(formData.duration_seconds), order_index: Number(formData.order_index),
                });
            }
            loadEpisodes(selectedSeriesId);
        } else if (tab === "quiz" && selectedEpisodeId) {
            if (editId) {
                await adminUpdateQuizQuestion(editId, {
                    question_text: formData.question_text, options: formData.options,
                    correct_index: Number(formData.correct_index), order_index: Number(formData.order_index),
                } as any);
            } else {
                await adminCreateQuizQuestion({
                    episode_id: selectedEpisodeId, question_text: formData.question_text,
                    options: formData.options, correct_index: Number(formData.correct_index),
                    order_index: Number(formData.order_index),
                });
            }
            loadQuiz(selectedEpisodeId);
        }
        setShowForm(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn chắc chắn muốn xóa?")) return;
        if (tab === "series") { await adminDeleteSeries(id); loadSeries(); }
        else if (tab === "episodes" && selectedSeriesId) { await adminDeleteEpisode(id); loadEpisodes(selectedSeriesId); }
        else if (tab === "quiz" && selectedEpisodeId) { await adminDeleteQuizQuestion(id); loadQuiz(selectedEpisodeId); }
    };

    const updateOption = (index: number, value: string) => {
        const opts = [...(formData.options || [])];
        opts[index] = value;
        setFormData({ ...formData, options: opts });
    };

    const selectedSeriesTitle = seriesList.find(s => s.id === selectedSeriesId)?.title;
    const selectedEpTitle = episodes.find(e => e.id === selectedEpisodeId)?.title;

    return (
        <div>
            {/* Tab bar */}
            <div className="avt-tabs">
                <button className={`avt-tab ${tab === "series" ? "active" : ""}`} onClick={() => { setTab("series"); setShowForm(false); }}>
                    📺 Series
                </button>
                <button
                    className={`avt-tab ${tab === "episodes" ? "active" : ""} ${!selectedSeriesId ? "disabled" : ""}`}
                    onClick={() => selectedSeriesId && (setTab("episodes"), setShowForm(false))}
                    disabled={!selectedSeriesId}
                >
                    🎬 Episodes
                    {selectedSeriesTitle && <span className="avt-tab-sub">({selectedSeriesTitle})</span>}
                </button>
                <button
                    className={`avt-tab ${tab === "quiz" ? "active" : ""} ${!selectedEpisodeId ? "disabled" : ""}`}
                    onClick={() => selectedEpisodeId && (setTab("quiz"), setShowForm(false))}
                    disabled={!selectedEpisodeId}
                >
                    🧩 Quiz
                    {selectedEpTitle && <span className="avt-tab-sub">({selectedEpTitle})</span>}
                </button>
            </div>

            {/* Create button */}
            <div className="avt-toolbar">
                <button className="avt-btn avt-btn-create" onClick={openCreateForm}>
                    + Thêm mới
                </button>
            </div>

            {/* Form modal */}
            {showForm && (
                <div className="avt-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="avt-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="avt-modal-title">
                            {editId ? "Chỉnh sửa" : "Tạo mới"} {tab === "series" ? "Series" : tab === "episodes" ? "Episode" : "Câu hỏi"}
                        </h3>

                        {tab === "series" && (
                            <div className="avt-form">
                                <label>Tiêu đề</label>
                                <input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                <label>Mô tả</label>
                                <textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                <label>Thumbnail URL</label>
                                <input value={formData.thumbnail_url || ""} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} />
                                <label>Danh mục</label>
                                <select value={formData.category || "english"} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                                </select>
                                <div className="avt-form-row">
                                    <div><label>Lớp min</label><input type="number" min={1} max={5} value={formData.grade_min || 1} onChange={e => setFormData({ ...formData, grade_min: e.target.value })} /></div>
                                    <div><label>Lớp max</label><input type="number" min={1} max={5} value={formData.grade_max || 5} onChange={e => setFormData({ ...formData, grade_max: e.target.value })} /></div>
                                </div>
                                <div className="avt-form-row">
                                    <div><label>Giá mở khóa (coins)</label><input type="number" min={0} value={formData.unlock_cost || 0} onChange={e => setFormData({ ...formData, unlock_cost: e.target.value })} /></div>
                                    <div><label>Thứ tự</label><input type="number" min={0} value={formData.order_index || 0} onChange={e => setFormData({ ...formData, order_index: e.target.value })} /></div>
                                </div>
                            </div>
                        )}

                        {tab === "episodes" && (
                            <div className="avt-form">
                                <label>Tiêu đề tập</label>
                                <input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                <label>YouTube Video ID</label>
                                <input value={formData.youtube_id || ""} onChange={e => setFormData({ ...formData, youtube_id: e.target.value })} placeholder="dQw4w9WgXcQ" />
                                <p className="avt-hint">Lấy từ URL: youtube.com/watch?v=<strong>VIDEO_ID</strong></p>
                                <div className="avt-form-row">
                                    <div><label>Thời lượng (giây)</label><input type="number" min={0} value={formData.duration_seconds || 0} onChange={e => setFormData({ ...formData, duration_seconds: e.target.value })} /></div>
                                    <div><label>Thứ tự tập</label><input type="number" min={0} value={formData.order_index || 0} onChange={e => setFormData({ ...formData, order_index: e.target.value })} /></div>
                                </div>
                            </div>
                        )}

                        {tab === "quiz" && (
                            <div className="avt-form">
                                <label>Câu hỏi</label>
                                <textarea value={formData.question_text || ""} onChange={e => setFormData({ ...formData, question_text: e.target.value })} />
                                <label>Đáp án (4 lựa chọn)</label>
                                {(formData.options || ["", "", "", ""]).map((opt: string, i: number) => (
                                    <div key={i} className="avt-option-row">
                                        <span className={`avt-option-letter ${formData.correct_index === i ? "correct" : ""}`}>
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} />
                                        <button
                                            className={`avt-correct-btn ${formData.correct_index === i ? "active" : ""}`}
                                            onClick={() => setFormData({ ...formData, correct_index: i })}
                                            type="button"
                                        >
                                            {formData.correct_index === i ? "✅" : "○"}
                                        </button>
                                    </div>
                                ))}
                                <div className="avt-form-row">
                                    <div><label>Thứ tự</label><input type="number" min={0} value={formData.order_index || 0} onChange={e => setFormData({ ...formData, order_index: e.target.value })} /></div>
                                </div>
                            </div>
                        )}

                        <div className="avt-modal-actions">
                            <button className="avt-btn avt-btn-cancel" onClick={() => setShowForm(false)}>Hủy</button>
                            <button className="avt-btn avt-btn-save" onClick={handleSave}>
                                {editId ? "Cập nhật" : "Tạo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="avt-loading">Đang tải...</div>
            ) : tab === "series" ? (
                <div className="avt-table-wrap">
                    <table className="avt-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Tiêu đề</th><th>Danh mục</th><th>Lớp</th><th>Giá</th><th>Tập</th><th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seriesList.map((s, i) => (
                                <tr key={s.id} className={selectedSeriesId === s.id ? "selected" : ""}>
                                    <td>{i + 1}</td>
                                    <td className="avt-title-cell">
                                        <button className="avt-link" onClick={() => { setSelectedSeriesId(s.id); setTab("episodes"); }}>
                                            {s.title}
                                        </button>
                                    </td>
                                    <td>{CATEGORIES.find(c => c.id === s.category)?.emoji} {CATEGORIES.find(c => c.id === s.category)?.label}</td>
                                    <td>{s.gradeMin}-{s.gradeMax}</td>
                                    <td>{s.unlockCost > 0 ? `🪙 ${s.unlockCost}` : "Free"}</td>
                                    <td>{s.episodeCount}</td>
                                    <td>
                                        <div className="avt-actions">
                                            <button className="avt-action-btn" onClick={() => openEditForm(s)}>✏️</button>
                                            <button className="avt-action-btn avt-del" onClick={() => handleDelete(s.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {seriesList.length === 0 && (
                                <tr><td colSpan={7} className="avt-empty">Chưa có series nào. Bấm "Thêm mới" để tạo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : tab === "episodes" ? (
                <div className="avt-table-wrap">
                    <table className="avt-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Tiêu đề</th><th>YouTube ID</th><th>Thời lượng</th><th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {episodes.map((ep, i) => (
                                <tr key={ep.id} className={selectedEpisodeId === ep.id ? "selected" : ""}>
                                    <td>{ep.order_index + 1}</td>
                                    <td>
                                        <button className="avt-link" onClick={() => { setSelectedEpisodeId(ep.id); setTab("quiz"); }}>
                                            {ep.title}
                                        </button>
                                    </td>
                                    <td><code>{ep.youtube_id}</code></td>
                                    <td>{Math.floor(ep.duration_seconds / 60)}:{(ep.duration_seconds % 60).toString().padStart(2, "0")}</td>
                                    <td>
                                        <div className="avt-actions">
                                            <button className="avt-action-btn" onClick={() => openEditForm(ep)}>✏️</button>
                                            <button className="avt-action-btn avt-del" onClick={() => handleDelete(ep.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {episodes.length === 0 && (
                                <tr><td colSpan={5} className="avt-empty">Chưa có tập nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="avt-table-wrap">
                    <table className="avt-table">
                        <thead>
                            <tr>
                                <th>#</th><th>Câu hỏi</th><th>Đáp án đúng</th><th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizQuestions.map((q, i) => (
                                <tr key={q.id}>
                                    <td>{i + 1}</td>
                                    <td className="avt-title-cell">{q.question_text}</td>
                                    <td>
                                        <span className="avt-correct-badge">
                                            {String.fromCharCode(65 + q.correct_index)}: {Array.isArray(q.options) ? q.options[q.correct_index] : ""}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="avt-actions">
                                            <button className="avt-action-btn" onClick={() => openEditForm(q)}>✏️</button>
                                            <button className="avt-action-btn avt-del" onClick={() => handleDelete(q.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {quizQuestions.length === 0 && (
                                <tr><td colSpan={4} className="avt-empty">Chưa có câu hỏi.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                /* Tabs */
                .avt-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; padding: 4px; }
                .avt-tab {
                    flex: 1; padding: 12px 16px; border-radius: 12px; border: none;
                    background: none; color: #94a3b8; font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; font-family: inherit;
                }
                .avt-tab:hover:not(.disabled) { background: rgba(255,255,255,0.04); color: #e2e8f0; }
                .avt-tab.active { background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1)); color: #c084fc; }
                .avt-tab.disabled { opacity: 0.3; cursor: not-allowed; }
                .avt-tab-sub { font-size: 10px; color: rgba(255,255,255,0.3); margin-left: 4px; }

                /* Toolbar */
                .avt-toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
                .avt-btn {
                    padding: 10px 20px; border-radius: 12px; border: none;
                    font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s;
                    font-family: inherit;
                }
                .avt-btn-create { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #fff; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
                .avt-btn-create:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139,92,246,0.4); }

                /* Table */
                .avt-table-wrap { overflow-x: auto; }
                .avt-table {
                    width: 100%; border-collapse: collapse;
                    font-size: 13px;
                }
                .avt-table th {
                    text-align: left; padding: 12px 16px;
                    color: #64748b; font-size: 11px; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .avt-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    color: #cbd5e1;
                }
                .avt-table tr.selected { background: rgba(139,92,246,0.06); }
                .avt-table tr:hover { background: rgba(255,255,255,0.02); }
                .avt-title-cell { max-width: 300px; }
                .avt-link { background: none; border: none; color: #c084fc; font-weight: 700; cursor: pointer; text-align: left; font-size: 13px; }
                .avt-link:hover { text-decoration: underline; }
                .avt-empty { text-align: center; color: #475569; padding: 40px !important; }

                .avt-actions { display: flex; gap: 6px; }
                .avt-action-btn {
                    width: 32px; height: 32px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
                    cursor: pointer; font-size: 14px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .avt-action-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
                .avt-action-btn.avt-del:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
                .avt-correct-badge { background: rgba(52,211,153,0.1); color: #34D399; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }

                /* Modal */
                .avt-modal-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center;
                }
                .avt-modal {
                    background: #0f1225; border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px; padding: 28px; width: 520px; max-width: 95vw;
                    max-height: 85vh; overflow-y: auto;
                }
                .avt-modal-title { font-size: 18px; font-weight: 800; color: #e2e8f0; margin-bottom: 20px; }

                .avt-form { display: flex; flex-direction: column; gap: 12px; }
                .avt-form label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .avt-form input, .avt-form textarea, .avt-form select {
                    width: 100%; padding: 10px 14px; border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
                    color: #e2e8f0; font-size: 14px; font-family: inherit;
                    transition: border-color 0.2s;
                }
                .avt-form input:focus, .avt-form textarea:focus, .avt-form select:focus {
                    outline: none; border-color: rgba(139,92,246,0.4);
                }
                .avt-form textarea { min-height: 80px; resize: vertical; }
                .avt-form select { appearance: none; cursor: pointer; }
                .avt-form-row { display: flex; gap: 12px; }
                .avt-form-row > div { flex: 1; display: flex; flex-direction: column; gap: 6px; }
                .avt-hint { font-size: 11px; color: #475569; margin-top: -8px; }

                /* Option row */
                .avt-option-row { display: flex; align-items: center; gap: 8px; }
                .avt-option-letter {
                    width: 28px; height: 28px; border-radius: 8px;
                    background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 12px; color: #64748b; flex-shrink: 0;
                }
                .avt-option-letter.correct { background: rgba(52,211,153,0.15); color: #34D399; }
                .avt-option-row input { flex: 1; }
                .avt-correct-btn {
                    width: 32px; height: 32px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
                    cursor: pointer; font-size: 16px; flex-shrink: 0;
                    transition: all 0.15s;
                }
                .avt-correct-btn.active { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.3); }

                .avt-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .avt-btn-cancel { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); }
                .avt-btn-cancel:hover { background: rgba(255,255,255,0.08); }
                .avt-btn-save { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #fff; }
                .avt-btn-save:hover { transform: translateY(-1px); }

                .avt-loading { text-align: center; padding: 40px; color: #475569; }
            `}</style>
        </div>
    );
}
