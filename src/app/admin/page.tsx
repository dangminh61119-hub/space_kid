"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/services/auth-context";

interface Stats {
    total: number;
    draft: number;
    review: number;
    approved: number;
    byPlanet: Record<string, number>;
    byGrade: Record<number, number>;
}

export default function AdminDashboard() {
    const { session } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.access_token) return;
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    async function fetchStats() {
        setLoading(true);
        try {
            // Fetch all questions to compute stats client-side
            const res = await fetch("/api/admin/questions?limit=9999", {
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const { data } = await res.json();

            const byPlanet: Record<string, number> = {};
            const byGrade: Record<number, number> = {};
            let draft = 0, review = 0, approved = 0;

            for (const q of data || []) {
                byPlanet[q.planet_id] = (byPlanet[q.planet_id] || 0) + 1;
                byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
                if (q.status === "draft") draft++;
                else if (q.status === "review") review++;
                else if (q.status === "approved") approved++;
            }

            setStats({
                total: data?.length || 0,
                draft, review, approved,
                byPlanet, byGrade,
            });
        } catch (e) {
            console.error("Stats fetch error:", e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-400 animate-pulse">Đang tải thống kê...</div>
            </div>
        );
    }

    const planetNames: Record<string, string> = {
        "ha-long": "Vịnh Hạ Long 🏝️",
        "hue": "Cố đô Huế 🏯",
        "giong": "Làng Gióng ⚔️",
        "phong-nha": "Phong Nha 🦇",
        "hoi-an": "Hội An 🏮",
        "sapa": "Sa Pa 🌾",
        "hanoi": "Hà Nội 🏛️",
        "mekong": "Mê Kông 🌊",
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
                <p className="text-gray-400 text-sm">Tổng quan dữ liệu câu hỏi</p>
            </div>

            {/* Quick actions */}
            <div className="flex gap-3">
                <a href="/admin/questions" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                    📋 Quản lý câu hỏi
                </a>
                <a href="/admin/questions?status=draft" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors">
                    ⏳ Duyệt câu hỏi ({stats?.draft || 0})
                </a>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Tổng câu hỏi" value={stats?.total || 0} color="text-white" />
                <StatCard label="Đã duyệt" value={stats?.approved || 0} color="text-green-400" />
                <StatCard label="Chờ duyệt" value={stats?.draft || 0} color="text-orange-400" />
                <StatCard label="Đang review" value={stats?.review || 0} color="text-blue-400" />
            </div>

            {/* By Planet */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Theo hành tinh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(stats?.byPlanet || {}).sort((a, b) => b[1] - a[1]).map(([id, count]) => (
                        <div key={id} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                            <div className="text-sm text-gray-400">{planetNames[id] || id}</div>
                            <div className="text-xl font-bold text-white">{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* By Grade */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Theo lớp</h3>
                <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(g => (
                        <div key={g} className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
                            <div className="text-sm text-gray-400">Lớp {g}</div>
                            <div className="text-xl font-bold text-white">{stats?.byGrade[g] || 0}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">{label}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    );
}
