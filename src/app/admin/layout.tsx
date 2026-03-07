"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

/* ─── Navigation structure ─── */
const NAV_ITEMS = [
    { href: "/admin", icon: "📊", label: "Tổng quan", id: "dashboard" },
    { href: "/admin/questions", icon: "📋", label: "Câu hỏi", id: "questions", badge: "5.5k" },
    { href: "/admin/race-questions", icon: "☀️", label: "Race", id: "race" },
    { href: "/admin/textbooks", icon: "📚", label: "Sách GK", id: "textbooks" },
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
            <div className="adm-loading">
                <div className="adm-loading-spinner" />
                <p>Đang xác thực quyền admin...</p>
                <style jsx>{`
                    .adm-loading {
                        min-height: 100vh; background: #06070d;
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center; gap: 16px;
                        color: #6b7280;
                    }
                    .adm-loading-spinner {
                        width: 40px; height: 40px; border-radius: 50%;
                        border: 3px solid #1e293b; border-top-color: #f59e0b;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin { to { transform: rotate(360deg); }}
                `}</style>
            </div>
        );
    }

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <div className="adm-root">
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
                <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`adm-sidebar ${sidebarOpen ? "open" : "closed"}`}>
                {/* Logo */}
                <div className="adm-sidebar-logo">
                    <div className="adm-logo-glow">
                        <span className="adm-logo-emoji">🌌</span>
                    </div>
                    {sidebarOpen && (
                        <div className="adm-logo-text">
                            <span className="adm-logo-title">CosmoMosaic</span>
                            <span className="adm-logo-subtitle">Admin Panel</span>
                        </div>
                    )}
                </div>

                {/* Nav items */}
                <nav className="adm-nav">
                    <div className="adm-nav-group">
                        {sidebarOpen && <div className="adm-nav-group-label">QUẢN LÝ</div>}
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`adm-nav-item ${isActive(item.href) ? "active" : ""}`}
                                onClick={() => isMobile && setSidebarOpen(false)}
                            >
                                <span className="adm-nav-icon">{item.icon}</span>
                                {sidebarOpen && (
                                    <>
                                        <span className="adm-nav-label">{item.label}</span>
                                        {item.badge && (
                                            <span className="adm-nav-badge">{item.badge}</span>
                                        )}
                                    </>
                                )}
                                {isActive(item.href) && <div className="adm-nav-active-bar" />}
                            </Link>
                        ))}
                    </div>

                    {/* Grade / Subject tree */}
                    {sidebarOpen && (
                        <div className="adm-nav-group">
                            <div className="adm-nav-group-label">THEO LỚP</div>
                            {GRADES.map((g) => (
                                <div key={g}>
                                    <button
                                        className={`adm-nav-item adm-grade-btn ${expandedGrade === g ? "expanded" : ""}`}
                                        onClick={() => setExpandedGrade(expandedGrade === g ? null : g)}
                                    >
                                        <span className="adm-nav-icon">🎓</span>
                                        <span className="adm-nav-label">Lớp {g}</span>
                                        <span className="adm-chevron">{expandedGrade === g ? "▾" : "›"}</span>
                                    </button>
                                    <div className={`adm-subject-list ${expandedGrade === g ? "show" : ""}`}>
                                        {SUBJECTS.map((s) => (
                                            <Link
                                                key={s.id}
                                                href={`/admin/questions?grade=${g}&subject=${s.id}`}
                                                className="adm-subject-item"
                                                onClick={() => isMobile && setSidebarOpen(false)}
                                            >
                                                <span>{s.emoji}</span>
                                                <span>{s.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </nav>

                {/* Bottom */}
                <div className="adm-sidebar-bottom">
                    <Link href="/portal" className="adm-nav-item adm-portal-btn">
                        <span className="adm-nav-icon">🚀</span>
                        {sidebarOpen && <span className="adm-nav-label">Về Portal</span>}
                    </Link>
                </div>
            </aside>

            {/* Main area */}
            <div className={`adm-main ${sidebarOpen ? "sb-open" : "sb-closed"}`}>
                {/* Top bar */}
                <header className="adm-topbar">
                    <div className="adm-topbar-left">
                        <button className="adm-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {sidebarOpen
                                    ? <path d="M18 6L6 18M6 6l12 12" />
                                    : <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
                                }
                            </svg>
                        </button>
                        <div className="adm-breadcrumb">
                            {pathname === "/admin" ? "Tổng quan" :
                                pathname.includes("questions") && !pathname.includes("race") ? "Câu hỏi" :
                                    pathname.includes("race") ? "Race Questions" :
                                        pathname.includes("textbooks") ? "Sách Giáo Khoa" : "Admin"}
                        </div>
                    </div>
                    <div className="adm-topbar-right">
                        <div className="adm-user-badge">
                            <div className="adm-user-avatar">👨‍💻</div>
                            {!isMobile && <span className="adm-user-role">Admin</span>}
                        </div>
                    </div>
                </header>

                <main className="adm-content">{children}</main>
            </div>

            <style jsx>{`
                .adm-root {
                    display: flex; min-height: 100vh;
                    background: #06070d; color: #e2e8f0;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                /* ─── Overlay ─── */
                .adm-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                    z-index: 40; backdrop-filter: blur(4px);
                }

                /* ─── Sidebar ─── */
                .adm-sidebar {
                    position: fixed; top: 0; left: 0; bottom: 0;
                    background: linear-gradient(180deg, #0c0e1a 0%, #0a0b14 100%);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    display: flex; flex-direction: column;
                    z-index: 50; transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
                    overflow-y: auto; overflow-x: hidden;
                }
                .adm-sidebar::-webkit-scrollbar { width: 4px; }
                .adm-sidebar::-webkit-scrollbar-track { background: transparent; }
                .adm-sidebar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
                .adm-sidebar.open { width: 240px; }
                .adm-sidebar.closed { width: 64px; }

                /* Logo */
                .adm-sidebar-logo {
                    display: flex; align-items: center; gap: 12px;
                    padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .adm-logo-glow {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: linear-gradient(135deg, #f59e0b33, #8b5cf633);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 20px rgba(245,158,11,0.15);
                    flex-shrink: 0;
                }
                .adm-logo-emoji { font-size: 20px; }
                .adm-logo-text { display: flex; flex-direction: column; }
                .adm-logo-title {
                    font-size: 14px; font-weight: 800; color: #f8fafc;
                    letter-spacing: -0.02em;
                }
                .adm-logo-subtitle {
                    font-size: 10px; color: #f59e0b; text-transform: uppercase;
                    letter-spacing: 0.1em; font-weight: 600;
                }

                /* Nav */
                .adm-nav {
                    flex: 1; padding: 12px 8px;
                    display: flex; flex-direction: column; gap: 4px;
                }
                .adm-nav-group { margin-bottom: 8px; }
                .adm-nav-group-label {
                    font-size: 10px; font-weight: 700; color: #475569;
                    padding: 12px 14px 6px; letter-spacing: 0.1em;
                }
                .adm-nav-item {
                    position: relative;
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 14px; border-radius: 10px;
                    color: #94a3b8; font-size: 13px; font-weight: 500;
                    text-decoration: none; cursor: pointer;
                    transition: all 0.2s ease; border: none; background: none;
                    width: 100%; text-align: left;
                }
                .adm-nav-item:hover {
                    background: rgba(255,255,255,0.04); color: #e2e8f0;
                }
                .adm-nav-item.active {
                    background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(139,92,246,0.08));
                    color: #fbbf24;
                }
                .adm-nav-active-bar {
                    position: absolute; left: 0; top: 50%;
                    transform: translateY(-50%);
                    width: 3px; height: 20px; border-radius: 0 3px 3px 0;
                    background: linear-gradient(180deg, #f59e0b, #8b5cf6);
                }
                .adm-nav-icon { font-size: 18px; flex-shrink: 0; width: 24px; text-align: center; }
                .adm-nav-label { white-space: nowrap; flex: 1; }
                .adm-nav-badge {
                    font-size: 10px; font-weight: 700; color: #94a3b8;
                    background: rgba(255,255,255,0.06); padding: 2px 8px;
                    border-radius: 10px;
                }

                /* Grade accordion */
                .adm-grade-btn.expanded { color: #fbbf24; }
                .adm-chevron {
                    font-size: 12px; color: #475569; transition: transform 0.2s;
                }
                .adm-subject-list {
                    max-height: 0; overflow: hidden;
                    transition: max-height 0.25s ease;
                    padding-left: 20px;
                }
                .adm-subject-list.show { max-height: 200px; }
                .adm-subject-item {
                    display: flex; align-items: center; gap: 8px;
                    padding: 6px 12px; border-radius: 8px;
                    font-size: 12px; color: #64748b;
                    text-decoration: none; transition: all 0.15s;
                }
                .adm-subject-item:hover {
                    background: rgba(255,255,255,0.04); color: #f59e0b;
                }

                /* Sidebar bottom */
                .adm-sidebar-bottom {
                    padding: 8px; border-top: 1px solid rgba(255,255,255,0.05);
                }
                .adm-portal-btn { color: #475569 !important; }
                .adm-portal-btn:hover { color: #94a3b8 !important; }

                /* ─── Main ─── */
                .adm-main {
                    flex: 1; transition: margin-left 0.25s cubic-bezier(0.4,0,0.2,1);
                    display: flex; flex-direction: column; min-height: 100vh;
                }
                .adm-main.sb-open { margin-left: 240px; }
                .adm-main.sb-closed { margin-left: 64px; }

                /* Top bar */
                .adm-topbar {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 24px; height: 56px;
                    background: rgba(6,7,13,0.8); backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    position: sticky; top: 0; z-index: 30;
                }
                .adm-topbar-left { display: flex; align-items: center; gap: 16px; }
                .adm-topbar-right { display: flex; align-items: center; gap: 12px; }
                .adm-menu-btn {
                    background: none; border: none; color: #64748b;
                    cursor: pointer; padding: 6px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .adm-menu-btn:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
                .adm-breadcrumb {
                    font-size: 14px; font-weight: 600; color: #94a3b8;
                }
                .adm-user-badge {
                    display: flex; align-items: center; gap: 8px;
                    padding: 4px 12px 4px 4px; border-radius: 20px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .adm-user-avatar {
                    width: 28px; height: 28px; border-radius: 50%;
                    background: linear-gradient(135deg, #f59e0b, #8b5cf6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px;
                }
                .adm-user-role {
                    font-size: 12px; font-weight: 600; color: #94a3b8;
                }

                /* Content */
                .adm-content {
                    flex: 1; padding: 24px;
                    max-width: 1200px; width: 100%;
                }

                /* ─── Mobile ─── */
                @media (max-width: 767px) {
                    .adm-sidebar.closed { width: 0; border: none; }
                    .adm-main.sb-closed { margin-left: 0; }
                    .adm-main.sb-open { margin-left: 0; }
                    .adm-content { padding: 16px; }
                    .adm-topbar { padding: 0 16px; }
                }
            `}</style>
        </div>
    );
}
