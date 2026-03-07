"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";

/* ─── Sidebar Navigation Items ─── */
const NAV_ITEMS = [
    { href: "/learn", icon: "🏠", label: "Tổng quan", id: "home" },
    { href: "/learn/path", icon: "🗺️", label: "Lộ trình", id: "path" },
    { href: "/learn/practice", icon: "📝", label: "Luyện tập", id: "practice" },
    { href: "/learn/lessons", icon: "📺", label: "Bài giảng", id: "lessons" },
    { href: "/learn/review", icon: "🔄", label: "Ôn tập", id: "review" },
    { href: "/learn/tutor", icon: "🤖", label: "AI Tutor", id: "tutor" },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { player } = useGame();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const activeItem = NAV_ITEMS.find(item =>
        pathname === item.href || (item.href !== "/learn" && pathname.startsWith(item.href))
    ) || NAV_ITEMS[0];

    return (
        <div className="learn-layout">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <motion.aside
                    className="learn-sidebar"
                    animate={{ width: sidebarOpen ? 240 : 72 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {/* Logo / Brand */}
                    <div className="learn-sidebar-header">
                        <Link href="/portal" className="learn-sidebar-back">
                            <span className="learn-sidebar-icon">🚀</span>
                            {sidebarOpen && <span className="learn-sidebar-back-text">Portal</span>}
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="learn-sidebar-toggle"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                    </div>

                    {/* Player info mini */}
                    {sidebarOpen && (
                        <motion.div
                            className="learn-player-mini"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="learn-player-avatar">
                                {player.mascot === "cat" ? "🐱" : player.mascot === "dog" ? "🐶" : "👤"}
                            </div>
                            <div className="learn-player-info">
                                <span className="learn-player-name">{player.name}</span>
                                <span className="learn-player-grade">Lớp {player.grade}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Navigation */}
                    <nav className="learn-sidebar-nav">
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeItem.id === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`learn-nav-item ${isActive ? "active" : ""}`}
                                    title={item.label}
                                >
                                    <span className="learn-nav-icon">{item.icon}</span>
                                    {sidebarOpen && (
                                        <motion.span
                                            className="learn-nav-label"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            className="learn-nav-active-indicator"
                                            layoutId="learn-active-nav"
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Streak mini */}
                    {sidebarOpen && (
                        <div className="learn-sidebar-streak">
                            <span className="learn-streak-fire">🔥</span>
                            <span className="learn-streak-count">{player.streak} ngày</span>
                        </div>
                    )}
                </motion.aside>
            )}

            {/* Main Content */}
            <main className="learn-main" style={{ marginLeft: isMobile ? 0 : sidebarOpen ? 240 : 72 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="learn-content"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <nav className="learn-mobile-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeItem.id === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`learn-mobile-nav-item ${isActive ? "active" : ""}`}
                            >
                                <span className="learn-mobile-nav-icon">{item.icon}</span>
                                <span className="learn-mobile-nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}

            {/* Scoped styles */}
            <style jsx global>{`
        .learn-layout {
          min-height: 100vh;
          background: var(--learn-bg);
          color: var(--learn-text);
          font-family: var(--font-body);
          display: flex;
        }

        /* ─── Sidebar ─── */
        .learn-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: linear-gradient(180deg, var(--learn-sidebar) 0%, #4F46E5 100%);
          color: var(--learn-sidebar-text);
          display: flex;
          flex-direction: column;
          padding: 16px 12px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(99, 102, 241, 0.15);
        }

        .learn-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 4px;
        }

        .learn-sidebar-back {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          font-weight: 600;
          padding: 8px 10px;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .learn-sidebar-back:hover { background: rgba(255,255,255,0.15); }

        .learn-sidebar-icon { font-size: 20px; }
        .learn-sidebar-back-text { white-space: nowrap; }

        .learn-sidebar-toggle {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .learn-sidebar-toggle:hover { background: rgba(255,255,255,0.25); }

        /* Player mini card */
        .learn-player-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: rgba(255,255,255,0.12);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .learn-player-avatar { font-size: 28px; }
        .learn-player-info { display: flex; flex-direction: column; }
        .learn-player-name { font-weight: 700; font-size: 14px; }
        .learn-player-grade { font-size: 12px; opacity: 0.8; }

        /* Nav items */
        .learn-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .learn-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          text-decoration: none;
          color: rgba(255,255,255,0.75);
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          overflow: hidden;
        }
        .learn-nav-item:hover { background: rgba(255,255,255,0.12); color: white; }
        .learn-nav-item.active { background: rgba(255,255,255,0.2); color: white; }

        .learn-nav-icon { font-size: 20px; flex-shrink: 0; }
        .learn-nav-label { white-space: nowrap; }

        .learn-nav-active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: white;
          border-radius: 0 4px 4px 0;
        }

        /* Streak */
        .learn-sidebar-streak {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
        }
        .learn-streak-fire { font-size: 20px; }

        /* ─── Main Content ─── */
        .learn-main {
          flex: 1;
          min-height: 100vh;
          transition: margin-left 0.3s ease;
        }

        .learn-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 24px 100px;
        }

        /* ─── Mobile Bottom Nav ─── */
        .learn-mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid var(--learn-border);
          display: flex;
          justify-content: space-around;
          padding: 8px 4px;
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          z-index: 50;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }

        .learn-mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          color: var(--learn-text-secondary);
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
          transition: color 0.2s;
        }
        .learn-mobile-nav-item.active { color: var(--learn-accent); }
        .learn-mobile-nav-icon { font-size: 22px; }
        .learn-mobile-nav-label { white-space: nowrap; }

        /* ─── Shared Learn Components ─── */
        .learn-page-title {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 800;
          color: var(--learn-text);
          margin-bottom: 4px;
        }

        .learn-page-subtitle {
          color: var(--learn-text-secondary);
          font-size: 15px;
          margin-bottom: 24px;
        }

        .learn-card {
          background: var(--learn-card);
          border: 1px solid var(--learn-border);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .learn-card:hover {
          box-shadow: 0 8px 24px rgba(99,102,241,0.08);
          border-color: var(--learn-accent-light);
        }

        .learn-card-title {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 700;
          color: var(--learn-text);
          margin-bottom: 8px;
        }

        .learn-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
        }

        .learn-badge-success {
          background: var(--learn-success-bg);
          color: #065F46;
        }
        .learn-badge-warning {
          background: var(--learn-warning-bg);
          color: #92400E;
        }
        .learn-badge-error {
          background: var(--learn-error-bg);
          color: #991B1B;
        }

        .learn-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .learn-btn-primary {
          background: var(--learn-accent);
          color: white;
        }
        .learn-btn-primary:hover {
          background: #4F46E5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .learn-btn-secondary {
          background: var(--learn-bg-alt);
          color: var(--learn-accent);
          border: 1px solid var(--learn-border);
        }
        .learn-btn-secondary:hover {
          background: var(--learn-border);
        }

        /* Progress wheel */
        .learn-progress-wheel {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .learn-progress-wheel svg {
          transform: rotate(-90deg);
        }
        .learn-progress-wheel-text {
          position: absolute;
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--learn-text);
        }
      `}</style>
        </div>
    );
}
