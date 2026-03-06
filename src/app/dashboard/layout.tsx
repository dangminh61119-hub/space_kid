"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireRole } from "@/hooks/useRequireRole";

const navItems = [
    { label: "Tổng quan", icon: "📊", href: "/dashboard" },
    { label: "Lịch sử", icon: "📅", href: "/dashboard/history" },
    { label: "Giới hạn", icon: "⏰", href: "/dashboard/controls" },
    { label: "Liên kết", icon: "🔗", href: "/dashboard/link" },
    { label: "AI Insights", icon: "🤖", href: "/dashboard#insights" },
    { label: "Cài đặt", icon: "⚙️", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading, allowed, redirecting } = useRequireRole("parent");

    if (loading || redirecting || !allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dash-bg)" }}>
                <div className="text-center">
                    <div className="text-4xl animate-pulse mb-3">🌌</div>
                    <p className="text-gray-500 text-sm">
                        {loading ? "Đang kiểm tra quyền truy cập..." : "Đang chuyển hướng..."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ background: "var(--dash-bg)", color: "var(--dash-text)" }}>
            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          bg-white border-r flex flex-col
        `}
                style={{ borderColor: "var(--dash-border)" }}
            >
                {/* Logo */}
                <div className="p-6 border-b" style={{ borderColor: "var(--dash-border)" }}>
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🌌</span>
                        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                            CosmoMosaic
                        </span>
                    </Link>
                    <p className="text-xs mt-1" style={{ color: "var(--dash-muted)" }}>
                        Bảng điều khiển Phụ huynh
                    </p>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "hover:bg-gray-50"
                                    }
                `}
                                style={!isActive ? { color: "var(--dash-muted)" } : undefined}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to game */}
                <div className="p-4 border-t" style={{ borderColor: "var(--dash-border)" }}>
                    <Link
                        href="/portal"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                        style={{ color: "var(--dash-muted)" }}
                    >
                        <span>🎮</span>
                        Xem giao diện bé
                    </Link>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header
                    className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-4 sm:px-8 py-4 flex items-center justify-between"
                    style={{ borderColor: "var(--dash-border)" }}
                >
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                            Xin chào, phụ huynh! 👋
                        </h1>
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                            Theo dõi tiến độ học tập của bé
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm hover:bg-gray-200 transition-colors">
                            🔔
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            P
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
