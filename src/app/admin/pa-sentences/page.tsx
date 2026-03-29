"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

/* ─── Types ─── */
interface PASentence {
    id: string;
    text: string;
    level: number;
    phoneme_targets: string[];
    vietnamese_trap: string | null;
    category: string;
    topic: string;
    difficulty: number;
    tip_vi: string | null;
    is_active: boolean;
    created_at: string;
}

const LEVEL_LABELS = ["", "Level 1 (Pre-A1)", "Level 2 (A1)", "Level 3 (A2)", "Level 4 (B1)", "Level 5 (B1+)"];
const CATEGORY_LABELS: Record<string, string> = { word: "Từ", phrase: "Cụm từ", sentence: "Câu", passage: "Đoạn" };
const DIFF_LABELS = ["", "Dễ", "Trung bình", "Khó"];
const PHONEMES = ["θ", "ð", "r", "l", "z", "ʃ", "ʒ", "v", "ɪ", "iː", "ʊ", "uː", "æ", "st", "sp", "sk", "str", "spr", "θr", "stress", "linking", "reduced", "intonation", "prosody"];
const TOPICS = ["general", "animals", "food", "school", "nature", "family", "activities", "transport", "home", "greetings", "body", "people", "colors", "toys", "feelings", "numbers"];

export default function PASentencesAdmin() {
    const { session } = useAuth();
    const [sentences, setSentences] = useState<PASentence[]>([]);
    const [stats, setStats] = useState<Record<number, number>>({});
    const [levelFilter, setLevelFilter] = useState("all");
    const [phonemeFilter, setPhonemeFilter] = useState("all");
    const [topicFilter, setTopicFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [audioGen, setAudioGen] = useState<{ running: boolean; generated: number; remaining: number; status: string }>(
        { running: false, generated: 0, remaining: -1, status: "" }
    );

    const authHeaders = { Authorization: `Bearer ${session?.access_token}` };

    const fetchSentences = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (levelFilter !== "all") params.set("level", levelFilter);
            if (phonemeFilter !== "all") params.set("phoneme", phonemeFilter);
            if (topicFilter !== "all") params.set("topic", topicFilter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/pa-sentences?${params}`, { headers: authHeaders });
            const { data, stats: s } = await res.json();
            setSentences(data || []);
            setStats(s || {});
        } catch { /* ignore */ }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelFilter, phonemeFilter, topicFilter, search, session]);

    useEffect(() => {
        if (session?.access_token) fetchSentences();
    }, [session, fetchSentences]);

    /* ─── Create ─── */
    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const phonemes = (fd.get("phoneme_targets") as string).split(",").map(s => s.trim()).filter(Boolean);
        try {
            const res = await fetch("/api/admin/pa-sentences", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: fd.get("text"),
                    level: parseInt(fd.get("level") as string),
                    phoneme_targets: phonemes,
                    vietnamese_trap: fd.get("vietnamese_trap") || null,
                    category: fd.get("category"),
                    topic: fd.get("topic"),
                    difficulty: parseInt(fd.get("difficulty") as string),
                    tip_vi: fd.get("tip_vi") || null,
                }),
            });
            if (res.ok) {
                setMsg({ type: "ok", text: "✅ Đã thêm câu luyện" });
                setShowCreate(false);
                fetchSentences();
            } else {
                setMsg({ type: "err", text: "Lỗi thêm câu" });
            }
        } catch { setMsg({ type: "err", text: "Lỗi server" }); }
    }

    /* ─── Toggle Active ─── */
    async function handleToggle(id: string, isActive: boolean) {
        await fetch("/api/admin/pa-sentences", {
            method: "PUT",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_active: !isActive }),
        });
        setSentences(s => s.map(x => x.id === id ? { ...x, is_active: !isActive } : x));
    }

    /* ─── Delete ─── */
    async function handleDelete(id: string) {
        if (!confirm("Xóa câu này?")) return;
        await fetch("/api/admin/pa-sentences", {
            method: "DELETE",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [id] }),
        });
        setSentences(s => s.filter(x => x.id !== id));
        fetchSentences();
    }

    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    /* ─── Generate Audio Batch ─── */
    async function handleGenerateAudio() {
        setAudioGen({ running: true, generated: 0, remaining: -1, status: "Đang generate..." });
        let totalGenerated = 0;
        let remaining = 999;

        while (remaining > 0) {
            try {
                const res = await fetch("/api/admin/pa-audio-generate", {
                    method: "POST",
                    headers: { ...authHeaders, "Content-Type": "application/json" },
                    body: JSON.stringify({ limit: 10 }),
                });
                const data = await res.json();
                totalGenerated += data.generated || 0;
                remaining = data.remaining ?? 0;
                setAudioGen({
                    running: remaining > 0,
                    generated: totalGenerated,
                    remaining,
                    status: remaining > 0
                        ? `✅ ${totalGenerated} đã xong, còn ${remaining}...`
                        : `✅ Hoàn tất! ${totalGenerated} audio đã generate.`,
                });
                if (data.failed > 0) {
                    console.warn("[Audio Gen] Some failed:", data.results?.filter((r: any) => r.status !== "✅ OK"));
                }
            } catch (err) {
                setAudioGen(prev => ({ ...prev, running: false, status: `❌ Lỗi: ${err}` }));
                break;
            }
        }
    }

    return (
        <div className="qb">
            <div className="qb-header">
                <div>
                    <h1 className="qb-title">🎤 Ngân hàng Câu Phát âm</h1>
                    <p className="qb-sub">Quản lý {total} câu luyện phát âm • {[1,2,3,4,5].map(l => `L${l}: ${stats[l] || 0}`).join(" • ")}</p>
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
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                    <option value="all">Tất cả Level</option>
                    {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
                <select value={phonemeFilter} onChange={e => setPhonemeFilter(e.target.value)}>
                    <option value="all">Tất cả Phoneme</option>
                    {PHONEMES.map(p => <option key={p} value={p}>/{p}/</option>)}
                </select>
                <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
                    <option value="all">Tất cả Topic</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                    type="text" placeholder="🔍 Tìm câu..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#0f1729", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.08)", flex: 1, minWidth: 120 }}
                />
                <button onClick={() => setShowCreate(!showCreate)} className="qb-btn qb-btn-create">
                    ➕ Thêm câu
                </button>
                <button
                    onClick={handleGenerateAudio}
                    disabled={audioGen.running}
                    className="qb-btn"
                    style={{
                        background: audioGen.running ? "rgba(234,179,8,0.15)" : "rgba(124,58,237,0.15)",
                        color: audioGen.running ? "#FDE047" : "#A78BFA",
                        border: `1px solid ${audioGen.running ? "rgba(234,179,8,0.3)" : "rgba(124,58,237,0.3)"}`,
                    }}
                >
                    {audioGen.running ? `⏳ ${audioGen.status}` : "🔊 Generate Audio"}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="qb-create-form">
                    <textarea name="text" placeholder="Câu luyện phát âm..." required className="qb-textarea" />
                    <div className="qb-form-row">
                        <select name="level" className="qb-select" required>
                            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                        </select>
                        <select name="category" className="qb-select">
                            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select name="difficulty" className="qb-select">
                            {[1, 2, 3].map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}
                        </select>
                    </div>
                    <div className="qb-form-row">
                        <input name="phoneme_targets" placeholder='Phonemes (phẩy cách, vd: θ, r, l)' className="qb-input" style={{ flex: 2 }} />
                        <select name="topic" className="qb-select">
                            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <input name="vietnamese_trap" placeholder="Lỗi người Việt (vd: th → t)" className="qb-input" />
                    <input name="tip_vi" placeholder="Tip sửa lỗi tiếng Việt" className="qb-input" />
                    <button type="submit" className="qb-btn qb-btn-save">💾 Lưu</button>
                </form>
            )}

            {/* Sentences List */}
            <div className="qb-q-list">
                {loading ? <p className="qb-loading">Đang tải...</p> : sentences.length === 0 ? (
                    <div className="qb-empty">Không có câu nào. Thêm câu mới.</div>
                ) : sentences.map((s, idx) => (
                    <div key={s.id} className="qb-q-card" style={{ opacity: s.is_active ? 1 : 0.4 }}>
                        <div className="qb-q-num">#{idx + 1}</div>
                        <div className="qb-q-body">
                            <div className="qb-q-text">{s.text}</div>
                            <div className="qb-q-tags">
                                <span className="qb-tag bloom">L{s.level}</span>
                                <span className="qb-tag diff">{DIFF_LABELS[s.difficulty]}</span>
                                <span className="qb-tag" style={{ background: "rgba(94,234,212,0.12)", color: "#5EEAD4" }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                                <span className="qb-tag stats">{s.topic}</span>
                                {s.phoneme_targets.map(p => (
                                    <span key={p} className="qb-tag ai-src">/{p}/</span>
                                ))}
                                {s.vietnamese_trap && <span className="qb-tag" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}>⚠ {s.vietnamese_trap}</span>}
                            </div>
                            {s.tip_vi && <div className="qb-q-explain">💡 {s.tip_vi}</div>}
                        </div>
                        <div className="qb-q-btns">
                            <button onClick={() => handleToggle(s.id, s.is_active)} className="qb-q-review" title={s.is_active ? "Ẩn" : "Hiện"}>
                                {s.is_active ? "👁" : "👁‍🗨"}
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="qb-q-del" title="Xóa">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .qb { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; } }
                .qb-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
                .qb-title { font-size:24px; font-weight:800; color:#f8fafc; margin:0 0 4px; }
                .qb-sub { font-size:13px; color:#64748b; margin:0; }
                .qb-back {
                    font-size:12px; color:#5EEAD4; text-decoration:none; font-weight:600;
                    padding:8px 14px; border-radius:8px; background:rgba(94,234,212,0.1);
                    border:1px solid rgba(94,234,212,0.2); transition:all 0.15s;
                }
                .qb-back:hover { background:rgba(94,234,212,0.2); }

                .qb-msg {
                    padding:10px 16px; border-radius:10px; margin-bottom:16px; font-size:13px;
                    cursor:pointer; font-weight:600;
                }
                .qb-msg.ok { background:rgba(34,197,94,0.1); color:#4ade80; border:1px solid rgba(34,197,94,0.2); }
                .qb-msg.err { background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2); }

                .qb-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
                .qb-filters select {
                    padding:8px 14px; border-radius:10px; font-size:13px; font-weight:600;
                    background:#0f1729; color:#e2e8f0;
                    border:1px solid rgba(255,255,255,0.08); cursor:pointer;
                }

                .qb-loading { color:#64748b; font-size:13px; }
                .qb-empty { color:#475569; font-size:14px; text-align:center; padding:40px; }

                .qb-btn {
                    padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;
                    border:none; cursor:pointer; transition:all 0.15s; white-space:nowrap;
                }
                .qb-btn-create { background:rgba(94,234,212,0.15); color:#5EEAD4; border:1px solid rgba(94,234,212,0.3); }
                .qb-btn-save { background:linear-gradient(135deg,#0D9488,#14B8A6); color:white; width:100%; margin-top:8px; }

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
                .qb-q-tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:4px; }
                .qb-tag {
                    font-size:10px; padding:2px 8px; border-radius:4px; font-weight:700;
                }
                .qb-tag.bloom { background:rgba(13,148,136,0.15); color:#5EEAD4; }
                .qb-tag.diff { background:rgba(245,158,11,0.15); color:#fbbf24; }
                .qb-tag.stats { background:rgba(99,102,241,0.1); color:#818cf8; }
                .qb-tag.ai-src { background:rgba(168,85,247,0.15); color:#c084fc; }
                .qb-q-explain { font-size:11px; color:#64748b; margin-top:4px; }
                .qb-q-btns { display:flex; flex-direction:column; gap:4px; }
                .qb-q-review {
                    background:none; border:none; cursor:pointer; font-size:16px;
                    opacity:0.4; transition:opacity 0.15s; padding:4px;
                }
                .qb-q-review:hover { opacity:1; }
                .qb-q-del {
                    background:none; border:none; cursor:pointer; font-size:16px;
                    opacity:0.3; transition:opacity 0.15s; padding:4px;
                }
                .qb-q-del:hover { opacity:1; }
            `}</style>
        </div>
    );
}
