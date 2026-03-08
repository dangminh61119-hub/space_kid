"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Types ─── */
interface Player {
    id: string;
    name: string;
    grade: number;
    xp: number;
    streak: number;
    role: string;
    coins: number;
    crystals: number;
    onboarding_complete: boolean;
    created_at: string;
    email: string | null;
    school: string | null;
}

const ROLE_LABELS: Record<string, string> = { child: "👶 Học sinh", parent: "👨‍👩‍👧 Phụ huynh", admin: "👨‍💻 Admin" };

export default function PlayersAdmin() {
    const { session } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradeFilter, setGradeFilter] = useState<number | "">("");
    const [roleFilter, setRoleFilter] = useState("");
    const [search, setSearch] = useState("");

    const fetchPlayers = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (gradeFilter) params.set("grade", String(gradeFilter));
            if (roleFilter) params.set("role", roleFilter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/players?${params}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const { data } = await res.json();
                setPlayers(data || []);
            }
        } catch (e) {
            console.error("Fetch players error:", e);
        } finally {
            setLoading(false);
        }
    }, [session, gradeFilter, roleFilter, search]);

    useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

    const total = players.length;
    const byRole = players.reduce<Record<string, number>>((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="pg">
            <div className="pg-header">
                <h1 className="pg-title">👤 Quản lý Học sinh</h1>
                <p className="pg-sub">Tổng: <b>{total}</b> tài khoản</p>
            </div>

            {/* Stats mini */}
            <div className="pg-stats">
                {Object.entries(byRole).map(([role, count]) => (
                    <div key={role} className="pg-stat">
                        <span className="pg-stat-label">{ROLE_LABELS[role] || role}</span>
                        <span className="pg-stat-value">{count}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="pg-filters">
                <input
                    type="text" placeholder="🔍 Tìm theo tên..."
                    className="pg-input" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="pg-select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Tất cả lớp</option>
                    {[1, 2, 3, 4, 5].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
                <select className="pg-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">Tất cả vai trò</option>
                    <option value="child">Học sinh</option>
                    <option value="parent">Phụ huynh</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="pg-loading">
                    <div className="pg-spinner" />
                    <p>Đang tải...</p>
                </div>
            ) : players.length === 0 ? (
                <div className="pg-empty">Không tìm thấy học sinh nào</div>
            ) : (
                <div className="pg-table-wrap">
                    <table className="pg-table">
                        <thead>
                            <tr>
                                <th>Tên</th>
                                <th>Lớp</th>
                                <th>Vai trò</th>
                                <th>XP</th>
                                <th>🔥 Streak</th>
                                <th>💰 Coins</th>
                                <th>💎 Crystals</th>
                                <th>Trường</th>
                                <th>Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="pg-name">
                                            {p.name}
                                            {!p.onboarding_complete && <span className="pg-badge-new">Mới</span>}
                                        </div>
                                    </td>
                                    <td><span className="pg-grade">Lớp {p.grade}</span></td>
                                    <td><span className={`pg-role pg-role-${p.role}`}>{ROLE_LABELS[p.role] || p.role}</span></td>
                                    <td className="pg-num">{p.xp.toLocaleString()}</td>
                                    <td className="pg-num">{p.streak}</td>
                                    <td className="pg-num">{p.coins?.toLocaleString() || 0}</td>
                                    <td className="pg-num">{p.crystals || 0}</td>
                                    <td className="pg-school">{p.school || "—"}</td>
                                    <td className="pg-date">{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .pg { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

                .pg-header { margin-bottom: 20px; }
                .pg-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0 0 4px; }
                .pg-sub { font-size: 13px; color: #64748b; margin: 0; }

                .pg-stats {
                    display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
                }
                .pg-stat {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
                    padding: 10px 18px; border-radius: 12px;
                    display: flex; gap: 10px; align-items: center;
                }
                .pg-stat-label { font-size: 13px; color: #94a3b8; }
                .pg-stat-value { font-size: 18px; font-weight: 800; color: #fbbf24; }

                .pg-filters {
                    display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
                }
                .pg-input, .pg-select {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                    color: #e2e8f0; padding: 8px 14px; border-radius: 10px; font-size: 13px;
                    outline: none; transition: border-color 0.2s;
                }
                .pg-input { flex: 1; min-width: 200px; }
                .pg-input:focus, .pg-select:focus { border-color: #f59e0b; }
                .pg-select { cursor: pointer; }

                .pg-loading { text-align: center; padding: 60px 0; color: #64748b; }
                .pg-spinner {
                    width: 32px; height: 32px; border-radius: 50%;
                    border: 3px solid #1e293b; border-top-color: #f59e0b;
                    animation: spin 0.8s linear infinite; margin: 0 auto 12px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .pg-empty {
                    text-align: center; padding: 60px; color: #475569;
                    background: rgba(255,255,255,0.02); border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06);
                }

                .pg-table-wrap {
                    background: rgba(255,255,255,0.02); border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.06); overflow-x: auto;
                }
                .pg-table { width: 100%; border-collapse: collapse; min-width: 800px; }
                .pg-table th {
                    padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700;
                    color: #475569; text-transform: uppercase; letter-spacing: 0.05em;
                    background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .pg-table td {
                    padding: 12px 14px; font-size: 13px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .pg-table tr:hover td { background: rgba(255,255,255,0.02); }
                .pg-table tr:last-child td { border-bottom: none; }

                .pg-name { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #e2e8f0; }
                .pg-badge-new {
                    font-size: 9px; padding: 2px 6px; border-radius: 6px;
                    background: #22c55e22; color: #4ade80; font-weight: 700;
                }
                .pg-grade {
                    font-size: 12px; font-weight: 600; padding: 3px 10px;
                    border-radius: 8px; background: rgba(59,130,246,0.1); color: #60a5fa;
                }
                .pg-role { font-size: 12px; font-weight: 600; }
                .pg-role-child { color: #4ade80; }
                .pg-role-parent { color: #a78bfa; }
                .pg-role-admin { color: #fbbf24; }
                .pg-num { font-variant-numeric: tabular-nums; color: #cbd5e1; font-weight: 500; }
                .pg-school { color: #64748b; font-size: 12px; }
                .pg-date { color: #475569; font-size: 12px; }

                @media (max-width: 768px) {
                    .pg-filters { flex-direction: column; }
                    .pg-stats { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
