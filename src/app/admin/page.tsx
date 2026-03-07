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

const EMPTY_STATS: DashboardStats = {
    questions: { total: 0, draft: 0, approved: 0, byGrade: {} },
    raceQuestions: { total: 0, byGrade: {} },
    textbooks: { total: 0, ready: 0, totalChunks: 0, byGrade: {} },
    players: { total: 0, byGrade: {} },
};

export default function AdminDashboard() {
    const { session } = useAuth();
    const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
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
            // Fetch all data sources in parallel
            const [questionsRes, raceRes, textbooksRes, playersRes] = await Promise.allSettled([
                fetch("/api/admin/questions?limit=9999", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/race-questions", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/textbooks", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/admin/players", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const result = { ...EMPTY_STATS };

            // Questions
            if (questionsRes.status === "fulfilled" && questionsRes.value.ok) {
                const { data } = await questionsRes.value.json();
                const byGrade: Record<number, number> = {};
                let draft = 0, approved = 0;
                for (const q of data || []) {
                    byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
                    if (q.status === "draft") draft++;
                    else if (q.status === "approved") approved++;
                }
                result.questions = { total: data?.length || 0, draft, approved, byGrade };
            }

            // Race questions
            if (raceRes.status === "fulfilled" && raceRes.value.ok) {
                const rData = await raceRes.value.json();
                const questions = rData.data || rData.questions || rData || [];
                const byGrade: Record<number, number> = {};
                for (const q of Array.isArray(questions) ? questions : []) {
                    byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
                }
                result.raceQuestions = { total: Array.isArray(questions) ? questions.length : 0, byGrade };
            }

            // Textbooks
            if (textbooksRes.status === "fulfilled" && textbooksRes.value.ok) {
                const { textbooks } = await textbooksRes.value.json();
                const byGrade: Record<number, number> = {};
                let ready = 0, totalChunks = 0;
                for (const t of textbooks || []) {
                    byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
                    if (t.status === "ready") ready++;
                    totalChunks += t.total_chunks || 0;
                }
                result.textbooks = { total: textbooks?.length || 0, ready, totalChunks, byGrade };
            }

            // Players
            if (playersRes.status === "fulfilled" && playersRes.value.ok) {
                const pData = await playersRes.value.json();
                const players = pData.data || pData.players || pData || [];
                const byGrade: Record<number, number> = {};
                for (const p of Array.isArray(players) ? players : []) {
                    byGrade[p.grade] = (byGrade[p.grade] || 0) + 1;
                }
                result.players = { total: Array.isArray(players) ? players.length : 0, byGrade };
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
            <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                <div style={{ fontSize: 40, animation: "spin 1.5s linear infinite", display: "inline-block" }}>📊</div>
                <p style={{ marginTop: 12 }}>Đang tải thống kê...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📊 Tổng quan hệ thống</h1>
            <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>
                Quản lý toàn bộ dữ liệu CosmoMosaic
            </p>

            {/* Top stat cards */}
            <div className="dash-stats-grid">
                <StatCard icon="📋" label="Câu hỏi" value={stats.questions.total} sub={`${stats.questions.approved} đã duyệt`} color="#3b82f6" href="/admin/questions" />
                <StatCard icon="☀️" label="Race Questions" value={stats.raceQuestions.total} sub="Helios Race" color="#f59e0b" href="/admin/race-questions" />
                <StatCard icon="📚" label="Sách Giáo Khoa" value={stats.textbooks.total} sub={`${stats.textbooks.totalChunks} chunks`} color="#8b5cf6" href="/admin/textbooks" />
                <StatCard icon="👤" label="Học sinh" value={stats.players.total} sub="Registered" color="#22c55e" href="#" />
            </div>

            {/* Grade breakdown */}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>
                🎓 Phân bổ theo lớp
            </h2>
            <div className="dash-grade-table">
                <table>
                    <thead>
                        <tr>
                            <th>Lớp</th>
                            <th>📋 Câu hỏi</th>
                            <th>☀️ Race</th>
                            <th>📚 SGK</th>
                            <th>👤 Học sinh</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map(g => (
                            <tr key={g}>
                                <td style={{ fontWeight: 700 }}>Lớp {g}</td>
                                <td>{stats.questions.byGrade[g] || 0}</td>
                                <td>{stats.raceQuestions.byGrade[g] || 0}</td>
                                <td>{stats.textbooks.byGrade[g] || 0}</td>
                                <td>{stats.players.byGrade[g] || 0}</td>
                                <td>
                                    <Link href={`/admin/questions?grade=${g}`} className="dash-action-link">
                                        Xem chi tiết →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        <tr className="dash-total-row">
                            <td style={{ fontWeight: 800 }}>Tổng</td>
                            <td style={{ fontWeight: 800 }}>{stats.questions.total}</td>
                            <td style={{ fontWeight: 800 }}>{stats.raceQuestions.total}</td>
                            <td style={{ fontWeight: 800 }}>{stats.textbooks.total}</td>
                            <td style={{ fontWeight: 800 }}>{stats.players.total}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Quick actions */}
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>
                ⚡ Thao tác nhanh
            </h2>
            <div className="dash-actions-grid">
                <Link href="/admin/questions?status=draft" className="dash-quick-btn draft">
                    <span>⏳</span>
                    <span>Duyệt câu hỏi ({stats.questions.draft})</span>
                </Link>
                <Link href="/admin/textbooks" className="dash-quick-btn sgk">
                    <span>📥</span>
                    <span>Upload SGK mới</span>
                </Link>
                <Link href="/admin/race-questions" className="dash-quick-btn race">
                    <span>☀️</span>
                    <span>Thêm Race Question</span>
                </Link>
                <Link href="/admin/questions" className="dash-quick-btn questions">
                    <span>➕</span>
                    <span>Thêm câu hỏi</span>
                </Link>
            </div>

            <style jsx>{`
                .dash-stats-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px; margin-bottom: 8px;
                }
                .dash-grade-table {
                    background: #111827; border-radius: 12px;
                    border: 1px solid #1f2937; overflow: hidden;
                }
                .dash-grade-table table {
                    width: 100%; border-collapse: collapse;
                }
                .dash-grade-table th {
                    padding: 10px 16px; text-align: left;
                    font-size: 12px; font-weight: 700;
                    color: #9ca3af; text-transform: uppercase;
                    background: #0d1117; border-bottom: 1px solid #1f2937;
                }
                .dash-grade-table td {
                    padding: 10px 16px; font-size: 14px;
                    border-bottom: 1px solid #1f293740;
                }
                .dash-grade-table tr:hover { background: #1f293740; }
                .dash-total-row { background: #0d1117; }
                .dash-total-row td { border-bottom: none; }
                .dash-action-link {
                    font-size: 12px; color: #f59e0b; text-decoration: none;
                    font-weight: 600;
                }
                .dash-action-link:hover { text-decoration: underline; }

                .dash-actions-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 10px;
                }
                .dash-quick-btn {
                    display: flex; align-items: center; gap: 10px;
                    padding: 14px 16px; border-radius: 10px;
                    font-size: 14px; font-weight: 600;
                    text-decoration: none; color: white;
                    transition: all 0.15s;
                }
                .dash-quick-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
                .dash-quick-btn.draft { background: linear-gradient(135deg, #92400e, #b45309); }
                .dash-quick-btn.sgk { background: linear-gradient(135deg, #5b21b6, #7c3aed); }
                .dash-quick-btn.race { background: linear-gradient(135deg, #b45309, #d97706); }
                .dash-quick-btn.questions { background: linear-gradient(135deg, #1e40af, #3b82f6); }

                @media (max-width: 768px) {
                    .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .dash-actions-grid { grid-template-columns: 1fr; }
                    .dash-grade-table { overflow-x: auto; }
                }
            `}</style>
        </div>
    );
}

/* ─── Stat Card Component ─── */
function StatCard({ icon, label, value, sub, color, href }: {
    icon: string; label: string; value: number; sub: string; color: string; href: string;
}) {
    return (
        <Link href={href} style={{
            background: "#111827", borderRadius: 12,
            padding: 20, border: "1px solid #1f2937",
            textDecoration: "none", display: "block",
            transition: "all 0.15s",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{sub}</div>
        </Link>
    );
}
