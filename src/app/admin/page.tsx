"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

/* ─── Types ─── */
interface DashboardStats {
    questions: { total: number; draft: number; approved: number; byGrade: Record<number, number> };
    raceQuestions: { total: number; byGrade: Record<number, number> };
    textbooks: { total: number; ready: number; totalChunks: number; byGrade: Record<number, number> };
    players: { total: number; byGrade: Record<number, number> };
}

const EMPTY: DashboardStats = {
    questions: { total: 0, draft: 0, approved: 0, byGrade: {} },
    raceQuestions: { total: 0, byGrade: {} },
    textbooks: { total: 0, ready: 0, totalChunks: 0, byGrade: {} },
    players: { total: 0, byGrade: {} },
};

export default function AdminDashboard() {
    const { session } = useAuth();
    const [stats, setStats] = useState<DashboardStats>(EMPTY);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.access_token) return;
        fetchAllStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    async function fetchAllStats() {
        setLoading(true);
        const token = session?.access_token;
        if (!token) return;

        try {
            const [qRes, rRes, tRes, pRes] = await Promise.allSettled([
                fetch("/api/admin/questions?limit=9999", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/race-questions", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/textbooks", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/players", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const result = { ...EMPTY };

            if (qRes.status === "fulfilled" && qRes.value.ok) {
                const { data } = await qRes.value.json();
                const byGrade: Record<number, number> = {};
                let draft = 0, approved = 0;
                for (const q of data || []) {
                    byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
                    if (q.status === "draft") draft++;
                    else if (q.status === "approved") approved++;
                }
                result.questions = { total: data?.length || 0, draft, approved, byGrade };
            }

            if (rRes.status === "fulfilled" && rRes.value.ok) {
                const d = await rRes.value.json();
                const arr = d.data || d.questions || (Array.isArray(d) ? d : []);
                const byGrade: Record<number, number> = {};
                for (const q of arr) byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
                result.raceQuestions = { total: arr.length, byGrade };
            }

            if (tRes.status === "fulfilled" && tRes.value.ok) {
                const { textbooks } = await tRes.value.json();
                const byGrade: Record<number, number> = {};
                let ready = 0, totalChunks = 0;
                for (const t of textbooks || []) {
                    byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
                    if (t.status === "ready") ready++;
                    totalChunks += t.total_chunks || 0;
                }
                result.textbooks = { total: textbooks?.length || 0, ready, totalChunks, byGrade };
            }

            if (pRes.status === "fulfilled" && pRes.value.ok) {
                const d = await pRes.value.json();
                const arr = d.data || d.players || (Array.isArray(d) ? d : []);
                const byGrade: Record<number, number> = {};
                for (const p of arr) byGrade[p.grade] = (byGrade[p.grade] || 0) + 1;
                result.players = { total: arr.length, byGrade };
            }

            setStats(result);
        } catch (e) {
            console.error("Dashboard stats error:", e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
                <p>Đang tải thống kê...</p>
                <style jsx>{`
                    .dash-loading { text-align: center; padding: 80px 0; color: #64748b; }
                    .dash-loading-spinner {
                        width: 36px; height: 36px; border-radius: 50%;
                        border: 3px solid #1e293b; border-top-color: #f59e0b;
                        animation: spin 0.8s linear infinite;
                        margin: 0 auto 12px;
                    }
                    @keyframes spin { to { transform: rotate(360deg); }}
                `}</style>
            </div>
        );
    }

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

    return (
        <div className="dash">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-greeting">{greeting} 👋</h1>
                    <p className="dash-subtitle">Tổng quan hệ thống CosmoMosaic</p>
                </div>
                <div className="dash-date">
                    {now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
            </div>

            {/* Stat cards */}
            <div className="dash-cards">
                <div className="dash-card card-blue">
                    <div className="dash-card-bg" />
                    <div className="dash-card-content">
                        <div className="dash-card-top">
                            <div className="dash-card-icon">📋</div>
                            <Link href="/admin/questions" className="dash-card-link">Xem →</Link>
                        </div>
                        <div className="dash-card-value">{stats.questions.total.toLocaleString()}</div>
                        <div className="dash-card-label">Câu hỏi</div>
                        <div className="dash-card-sub">{stats.questions.approved} đã duyệt · {stats.questions.draft} chờ duyệt</div>
                    </div>
                </div>

                <div className="dash-card card-amber">
                    <div className="dash-card-bg" />
                    <div className="dash-card-content">
                        <div className="dash-card-top">
                            <div className="dash-card-icon">☀️</div>
                            <Link href="/admin/race-questions" className="dash-card-link">Xem →</Link>
                        </div>
                        <div className="dash-card-value">{stats.raceQuestions.total.toLocaleString()}</div>
                        <div className="dash-card-label">Race Questions</div>
                        <div className="dash-card-sub">Helios Race</div>
                    </div>
                </div>

                <div className="dash-card card-purple">
                    <div className="dash-card-bg" />
                    <div className="dash-card-content">
                        <div className="dash-card-top">
                            <div className="dash-card-icon">📚</div>
                            <Link href="/admin/textbooks" className="dash-card-link">Xem →</Link>
                        </div>
                        <div className="dash-card-value">{stats.textbooks.total}</div>
                        <div className="dash-card-label">Sách Giáo Khoa</div>
                        <div className="dash-card-sub">{stats.textbooks.totalChunks} chunks · {stats.textbooks.ready} sẵn sàng</div>
                    </div>
                </div>

                <div className="dash-card card-green">
                    <div className="dash-card-bg" />
                    <div className="dash-card-content">
                        <div className="dash-card-top">
                            <div className="dash-card-icon">👤</div>
                            <span className="dash-card-link" />
                        </div>
                        <div className="dash-card-value">{stats.players.total}</div>
                        <div className="dash-card-label">Học sinh</div>
                        <div className="dash-card-sub">Tài khoản đăng ký</div>
                    </div>
                </div>
            </div>

            {/* Grade breakdown */}
            <div className="dash-section">
                <h2 className="dash-section-title">🎓 Phân bổ theo lớp</h2>
                <div className="dash-table-wrap">
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Lớp</th>
                                <th>📋 Câu hỏi</th>
                                <th>☀️ Race</th>
                                <th>📚 SGK</th>
                                <th>👤 Học sinh</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map(g => {
                                const qCount = stats.questions.byGrade[g] || 0;
                                const rCount = stats.raceQuestions.byGrade[g] || 0;
                                const tCount = stats.textbooks.byGrade[g] || 0;
                                const pCount = stats.players.byGrade[g] || 0;
                                return (
                                    <tr key={g}>
                                        <td>
                                            <span className="dash-grade-badge">Lớp {g}</span>
                                        </td>
                                        <td>
                                            <span className="dash-num">{qCount}</span>
                                            {qCount > 0 && (
                                                <div className="dash-bar">
                                                    <div className="dash-bar-fill blue" style={{ width: `${Math.min(100, (qCount / Math.max(1, stats.questions.total)) * 100)}%` }} />
                                                </div>
                                            )}
                                        </td>
                                        <td><span className="dash-num">{rCount}</span></td>
                                        <td><span className="dash-num">{tCount}</span></td>
                                        <td><span className="dash-num">{pCount}</span></td>
                                        <td>
                                            <Link href={`/admin/questions?grade=${g}`} className="dash-detail-link">
                                                Chi tiết →
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick actions */}
            <div className="dash-section">
                <h2 className="dash-section-title">⚡ Thao tác nhanh</h2>
                <div className="dash-actions">
                    <Link href="/admin/questions?status=draft" className="dash-action action-amber">
                        <span className="dash-action-icon">⏳</span>
                        <div>
                            <div className="dash-action-label">Duyệt câu hỏi</div>
                            <div className="dash-action-count">{stats.questions.draft} chờ duyệt</div>
                        </div>
                    </Link>
                    <Link href="/admin/textbooks" className="dash-action action-purple">
                        <span className="dash-action-icon">📥</span>
                        <div>
                            <div className="dash-action-label">Upload SGK</div>
                            <div className="dash-action-count">Thêm nội dung mới</div>
                        </div>
                    </Link>
                    <Link href="/admin/race-questions" className="dash-action action-orange">
                        <span className="dash-action-icon">☀️</span>
                        <div>
                            <div className="dash-action-label">Race Questions</div>
                            <div className="dash-action-count">Quản lý Helios</div>
                        </div>
                    </Link>
                    <Link href="/admin/questions" className="dash-action action-blue">
                        <span className="dash-action-icon">➕</span>
                        <div>
                            <div className="dash-action-label">Thêm câu hỏi</div>
                            <div className="dash-action-count">Tạo câu hỏi mới</div>
                        </div>
                    </Link>
                    <Link href="/admin/question-bank" className="dash-action action-indigo">
                        <span className="dash-action-icon">🧩</span>
                        <div>
                            <div className="dash-action-label">Ngân hàng Câu hỏi</div>
                            <div className="dash-action-count">Curriculum + AI sinh câu hỏi</div>
                        </div>
                    </Link>
                    <Link href="/admin/lessons" className="dash-action action-teal">
                        <span className="dash-action-icon">🎬</span>
                        <div>
                            <div className="dash-action-label">Bài giảng</div>
                            <div className="dash-action-count">YouTube + tóm tắt nội dung</div>
                        </div>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .dash { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

                .dash-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 28px;
                }
                .dash-greeting {
                    font-size: 26px; font-weight: 800; color: #f8fafc;
                    margin: 0 0 4px;
                }
                .dash-subtitle { font-size: 14px; color: #64748b; margin: 0; }
                .dash-date {
                    font-size: 13px; color: #475569;
                    background: rgba(255,255,255,0.04);
                    padding: 6px 14px; border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.06);
                }

                /* Cards */
                .dash-cards {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px; margin-bottom: 32px;
                }
                .dash-card {
                    position: relative; border-radius: 16px; overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .dash-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                }
                .dash-card-bg {
                    position: absolute; inset: 0; opacity: 0.12;
                }
                .card-blue { background: #0c1629; }
                .card-blue .dash-card-bg { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
                .card-blue .dash-card-value { color: #60a5fa; }
                .card-amber { background: #1a1408; }
                .card-amber .dash-card-bg { background: linear-gradient(135deg, #f59e0b, #d97706); }
                .card-amber .dash-card-value { color: #fbbf24; }
                .card-purple { background: #130d24; }
                .card-purple .dash-card-bg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
                .card-purple .dash-card-value { color: #a78bfa; }
                .card-green { background: #071a0e; }
                .card-green .dash-card-bg { background: linear-gradient(135deg, #22c55e, #16a34a); }
                .card-green .dash-card-value { color: #4ade80; }

                .dash-card-content {
                    position: relative; z-index: 1; padding: 20px;
                }
                .dash-card-top {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 16px;
                }
                .dash-card-icon { font-size: 28px; }
                .dash-card-link {
                    font-size: 11px; color: #64748b; text-decoration: none;
                    font-weight: 600; transition: color 0.15s;
                }
                .dash-card-link:hover { color: #e2e8f0; }
                .dash-card-value {
                    font-size: 36px; font-weight: 800; line-height: 1;
                    margin-bottom: 4px; letter-spacing: -0.02em;
                }
                .dash-card-label {
                    font-size: 14px; font-weight: 600; color: #94a3b8;
                    margin-bottom: 4px;
                }
                .dash-card-sub { font-size: 12px; color: #475569; }

                /* Section */
                .dash-section { margin-bottom: 32px; }
                .dash-section-title {
                    font-size: 16px; font-weight: 700; color: #e2e8f0;
                    margin: 0 0 16px;
                }

                /* Table */
                .dash-table-wrap {
                    background: rgba(255,255,255,0.02);
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06);
                    overflow: hidden;
                }
                .dash-table { width: 100%; border-collapse: collapse; }
                .dash-table th {
                    padding: 12px 16px; text-align: left;
                    font-size: 11px; font-weight: 700; color: #475569;
                    text-transform: uppercase; letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.02);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .dash-table td {
                    padding: 12px 16px; font-size: 14px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .dash-table tr:last-child td { border-bottom: none; }
                .dash-table tr:hover td { background: rgba(255,255,255,0.02); }
                .dash-grade-badge {
                    font-weight: 700; color: #e2e8f0; font-size: 13px;
                }
                .dash-num { font-weight: 600; color: #cbd5e1; font-size: 14px; font-variant-numeric: tabular-nums; }
                .dash-bar {
                    width: 60px; height: 4px; background: rgba(255,255,255,0.06);
                    border-radius: 2px; margin-top: 4px;
                }
                .dash-bar-fill {
                    height: 100%; border-radius: 2px;
                    transition: width 0.5s ease;
                }
                .dash-bar-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
                .dash-detail-link {
                    font-size: 12px; color: #f59e0b; text-decoration: none;
                    font-weight: 600; opacity: 0.7; transition: opacity 0.15s;
                }
                .dash-detail-link:hover { opacity: 1; }

                /* Actions */
                .dash-actions {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }
                .dash-action {
                    display: flex; align-items: center; gap: 14px;
                    padding: 16px 18px; border-radius: 14px;
                    text-decoration: none; color: white;
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: all 0.2s;
                }
                .dash-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                }
                .dash-action-icon { font-size: 28px; }
                .dash-action-label { font-size: 14px; font-weight: 700; }
                .dash-action-count { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
                .action-amber { background: linear-gradient(135deg, #78350f, #92400e); }
                .action-purple { background: linear-gradient(135deg, #3b0764, #581c87); }
                .action-orange { background: linear-gradient(135deg, #7c2d12, #9a3412); }
                .action-blue { background: linear-gradient(135deg, #1e3a5f, #1e40af); }
                .action-indigo { background: linear-gradient(135deg, #312e81, #4338ca); }
                .action-teal { background: linear-gradient(135deg, #134e4a, #0f766e); }

                @media (max-width: 768px) {
                    .dash-header { flex-direction: column; gap: 12px; }
                    .dash-cards { grid-template-columns: repeat(2, 1fr); }
                    .dash-actions { grid-template-columns: 1fr; }
                    .dash-table-wrap { overflow-x: auto; }
                    .dash-card-value { font-size: 28px; }
                }
            `}</style>
        </div>
    );
}
