"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || role !== "admin") {
                router.replace("/portal");
            } else {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setAuthorized(true);
            }
        }
    }, [user, role, loading, router]);

    if (loading || !authorized) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl animate-spin">⚙️</div>
                    <p className="text-gray-400">Đang xác thực quyền admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Admin top bar */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-orange-400">⚙️ CosmoMosaic Admin</h1>
                        <nav className="flex gap-1">
                            <a href="/admin" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                Dashboard
                            </a>
                            <a href="/admin/questions" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                Câu hỏi
                            </a>
                            <a href="/admin/race-questions" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                ☀️ Race Questions
                            </a>
                            <a href="/admin/textbooks" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                📚 Sách Giáo Khoa
                            </a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            role: admin
                        </span>
                        <a href="/portal" className="text-sm text-gray-400 hover:text-white">
                            ← Portal
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
