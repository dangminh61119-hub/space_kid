"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Navigation structure ─── */
const NAV_SECTIONS = [
    {
        label: "Quản lý chung",
        items: [
            { href: "/admin", icon: "📊", label: "Tổng quan", id: "dashboard" },
        ],
    },
    {
        label: "Dữ liệu",
        items: [
            { href: "/admin/questions", icon: "📋", label: "Câu hỏi", id: "questions" },
            { href: "/admin/race-questions", icon: "☀️", label: "Race Questions", id: "race" },
            { href: "/admin/textbooks", icon: "📚", label: "Sách Giáo Khoa", id: "textbooks" },
        ],
    },
];

const GRADES = [1, 2, 3, 4, 5];
const SUBJECTS = [
    { id: "math", label: "Toán", emoji: "🔢" },
    { id: "vietnamese", label: "Tiếng Việt", emoji: "📖" },
    { id: "english", label: "Tiếng Anh", emoji: "🌍" },
    { id: "science", label: "Khoa học", emoji: "🔬" },
    { id: "history", label: "Lịch sử & Địa lý", emoji: "🗺️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedGrade, setExpandedGrade] = useState<number | null>(null);

    useEffect(() => {
        if (!loading) {
            if (!user || role !== "admin") {
                router.replace("/portal");
            } else {
                setAuthorized(true);
            }
        }
    }, [user, role, loading, router]);

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    if (loading || !authorized) {
        return (
            <div className="admin-loading">
                <div className="admin-loading-inner">
                    <div className="admin-loading-icon">⚙️</div>
                    <p>Đang xác thực quyền admin...</p>
                </div>
            </div>
        );
    }

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <div className="admin-root">
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
                <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
                {/* Logo */}
                <div className="admin-sidebar-header">
                    <span className="admin-logo-icon">⚙️</span>
                    {sidebarOpen && <span className="admin-logo-text">Admin Panel</span>}
                </div>

                {/* Nav sections */}
                <nav className="admin-nav">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label} className="admin-nav-section">
                            {sidebarOpen && (
                                <div className="admin-nav-section-label">{section.label}</div>
                            )}
                            {section.items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`admin-nav-item ${isActive(item.href) ? "active" : ""}`}
                                    onClick={() => isMobile && setSidebarOpen(false)}
                                >
                                    <span className="admin-nav-icon">{item.icon}</span>
                                    {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}

                    {/* Grade / Subject hierarchy */}
                    {sidebarOpen && (
                        <div className="admin-nav-section">
                            <div className="admin-nav-section-label">Theo lớp & môn</div>
                            {GRADES.map((g) => (
                                <div key={g}>
                                    <button
                                        className={`admin-nav-item admin-grade-btn ${expandedGrade === g ? "active" : ""}`}
                                        onClick={() => setExpandedGrade(expandedGrade === g ? null : g)}
                                    >
                                        <span className="admin-nav-icon">🎓</span>
                                        <span className="admin-nav-label">Lớp {g}</span>
                                        <span className="admin-grade-arrow">
                                            {expandedGrade === g ? "▾" : "▸"}
                                        </span>
                                    </button>
                                    {expandedGrade === g && (
                                        <div className="admin-subject-list">
                                            {SUBJECTS.map((s) => (
                                                <Link
                                                    key={s.id}
                                                    href={`/admin/questions?grade=${g}&subject=${s.id}`}
                                                    className="admin-subject-item"
                                                    onClick={() => isMobile && setSidebarOpen(false)}
                                                >
                                                    <span>{s.emoji}</span>
                                                    <span>{s.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </nav>

                {/* Bottom: portal link */}
                <div className="admin-sidebar-footer">
                    <Link href="/portal" className="admin-nav-item admin-portal-link">
                        <span className="admin-nav-icon">🚀</span>
                        {sidebarOpen && <span className="admin-nav-label">← Portal</span>}
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
                {/* Top bar */}
                <header className="admin-topbar">
                    <button
                        className="admin-hamburger"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? "✕" : "☰"}
                    </button>
                    <div className="admin-topbar-right">
                        <span className="admin-role-badge">role: admin</span>
                    </div>
                </header>

                <main className="admin-content">
                    {children}
                </main>
            </div>

            <style jsx>{`
                .admin-root {
                    display: flex; min-height: 100vh;
                    background: #0a0a0f; color: white;
                }
                .admin-loading {
                    min-height: 100vh; background: #0a0a0f;
                    display: flex; align-items: center; justify-content: center;
                }
                .admin-loading-inner { text-align: center; }
                .admin-loading-icon { font-size: 40px; animation: spin 1.5s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-loading-inner p { color: #9ca3af; margin-top: 12px; }

                /* Overlay */
                .admin-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    z-index: 40;
                }

                /* Sidebar */
                .admin-sidebar {
                    position: fixed; top: 0; left: 0; bottom: 0;
                    background: #111827; border-right: 1px solid #1f2937;
                    display: flex; flex-direction: column;
                    z-index: 50; transition: width 0.2s ease;
                    overflow-y: auto; overflow-x: hidden;
                }
                .admin-sidebar.open { width: 240px; }
                .admin-sidebar.closed { width: 60px; }

                .admin-sidebar-header {
                    display: flex; align-items: center; gap: 10px;
                    padding: 16px; border-bottom: 1px solid #1f2937;
                    min-height: 56px;
                }
                .admin-logo-icon { font-size: 24px; }
                .admin-logo-text {
                    font-weight: 800; font-size: 15px;
                    color: #f59e0b; white-space: nowrap;
                }

                /* Nav */
                .admin-nav {
                    flex: 1; padding: 8px;
                    display: flex; flex-direction: column; gap: 2px;
                }
                .admin-nav-section { margin-bottom: 8px; }
                .admin-nav-section-label {
                    font-size: 10px; font-weight: 700; text-transform: uppercase;
                    color: #6b7280; padding: 8px 12px 4px; letter-spacing: 0.05em;
                }
                .admin-nav-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px 12px; border-radius: 8px;
                    color: #d1d5db; font-size: 13px; font-weight: 600;
                    text-decoration: none; cursor: pointer;
                    transition: all 0.15s; border: none; background: none;
                    width: 100%; text-align: left;
                }
                .admin-nav-item:hover {
                    background: #1f2937; color: white;
                }
                .admin-nav-item.active {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fbbf24;
                }
                .admin-nav-icon { font-size: 18px; flex-shrink: 0; }
                .admin-nav-label { white-space: nowrap; }

                /* Grade accordion */
                .admin-grade-btn {
                    position: relative;
                }
                .admin-grade-arrow {
                    margin-left: auto; font-size: 11px; color: #6b7280;
                }
                .admin-subject-list {
                    padding-left: 16px; margin-bottom: 4px;
                }
                .admin-subject-item {
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 12px; border-radius: 6px;
                    font-size: 12px; color: #9ca3af;
                    text-decoration: none; transition: all 0.15s;
                }
                .admin-subject-item:hover {
                    background: #1f2937; color: #fbbf24;
                }

                /* Footer */
                .admin-sidebar-footer {
                    padding: 8px; border-top: 1px solid #1f2937;
                }
                .admin-portal-link { color: #6b7280 !important; }
                .admin-portal-link:hover { color: #d1d5db !important; }

                /* Main content */
                .admin-main {
                    flex: 1; transition: margin-left 0.2s ease;
                }
                .admin-main.sidebar-open { margin-left: 240px; }
                .admin-main.sidebar-closed { margin-left: 60px; }

                .admin-topbar {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 24px; background: #111827;
                    border-bottom: 1px solid #1f2937; position: sticky; top: 0; z-index: 30;
                }
                .admin-hamburger {
                    background: none; border: none; color: #9ca3af;
                    font-size: 20px; cursor: pointer; padding: 4px 8px;
                    border-radius: 6px;
                }
                .admin-hamburger:hover { background: #1f2937; color: white; }
                .admin-topbar-right { display: flex; align-items: center; gap: 12px; }
                .admin-role-badge {
                    font-size: 11px; color: #6b7280; background: #1f2937;
                    padding: 4px 10px; border-radius: 6px;
                }

                .admin-content {
                    padding: 24px; max-width: 1200px;
                }

                /* Mobile */
                @media (max-width: 767px) {
                    .admin-sidebar.closed { width: 0; border: none; }
                    .admin-main.sidebar-closed { margin-left: 0; }
                    .admin-main.sidebar-open { margin-left: 0; }
                    .admin-content { padding: 16px; }
                }
            `}</style>
        </div>
    );
}
