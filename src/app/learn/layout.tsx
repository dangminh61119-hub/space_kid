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
  { href: "/learn/bao-bai", icon: "📋", label: "Báo bài", id: "bao-bai" },
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
          background-color: var(--learn-bg);
          background-image: radial-gradient(var(--learn-accent-light) 1px, transparent 1px);
          background-size: 24px 24px;
          background-position: 0 0;
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
          background: linear-gradient(135deg, var(--learn-sidebar) 0%, #7C3AED 100%);
          color: var(--learn-sidebar-text);
          display: flex;
          flex-direction: column;
          padding: 16px 12px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(124, 58, 237, 0.2);
          border-radius: 0 24px 24px 0;
        }

        .learn-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 4px;
        }

        .learn-sidebar-back {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 12px;
          transition: all 0.2s;
          background: rgba(255,255,255,0.1);
        }
        .learn-sidebar-back:hover { 
          background: rgba(255,255,255,0.25); 
          transform: translateY(-1px);
        }

        .learn-sidebar-icon { font-size: 20px; }
        .learn-sidebar-back-text { white-space: nowrap; font-family: var(--font-heading); letter-spacing: 0.5px; }

        .learn-sidebar-toggle {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .learn-sidebar-toggle:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }

        /* Player mini card */
        .learn-player-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .learn-player-avatar { 
          font-size: 32px; 
          background: rgba(255,255,255,0.2);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
        }
        .learn-player-info { display: flex; flex-direction: column; gap: 2px; }
        .learn-player-name { font-weight: 800; font-size: 15px; font-family: var(--font-heading); }
        .learn-player-grade { font-size: 12px; opacity: 0.9; font-weight: 600; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 8px; display: inline-block; width: max-content; }

        /* Nav items */
        .learn-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .learn-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          text-decoration: none;
          color: rgba(255,255,255,0.8);
          font-weight: 700;
          font-family: var(--font-heading);
          font-size: 16px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }
        .learn-nav-item:hover { 
          background: rgba(255,255,255,0.15); 
          color: white; 
          transform: translateX(4px);
        }
        .learn-nav-item.active { 
          background: rgba(255,255,255,0.25); 
          color: white; 
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .learn-nav-icon { 
          font-size: 22px; 
          flex-shrink: 0; 
          transition: transform 0.2s;
        }
        .learn-nav-item:hover .learn-nav-icon { transform: scale(1.15) rotate(5deg); }
        .learn-nav-label { white-space: nowrap; }

        .learn-nav-active-indicator {
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 5px;
          background: var(--neon-gold);
          border-radius: 0 6px 6px 0;
          box-shadow: 0 0 8px var(--neon-gold);
        }

        /* Streak */
        .learn-sidebar-streak {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 15px;
          color: var(--neon-gold);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .learn-streak-fire { font-size: 22px; filter: drop-shadow(0 0 4px rgba(255,213,79,0.5)); animation: bounce 2s infinite; }

        /* ─── Main Content ─── */
        .learn-main {
          flex: 1;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .learn-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 28px 100px;
        }

        /* ─── Mobile Bottom Nav ─── */
        .learn-mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--learn-border);
          display: flex;
          justify-content: space-around;
          padding: 12px 6px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          z-index: 50;
          box-shadow: 0 -8px 24px rgba(124, 58, 237, 0.08);
          border-radius: 24px 24px 0 0;
        }

        .learn-mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: var(--learn-text-secondary);
          font-size: 11px;
          font-family: var(--font-heading);
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .learn-mobile-nav-item.active { 
          color: var(--learn-sidebar); 
          background: var(--learn-bg-alt);
        }
        .learn-mobile-nav-item:active { transform: scale(0.95); }
        .learn-mobile-nav-icon { font-size: 24px; transition: transform 0.2s; }
        .learn-mobile-nav-item.active .learn-mobile-nav-icon { transform: translateY(-2px) scale(1.1); }
        .learn-mobile-nav-label { white-space: nowrap; }

        /* ─── Shared Learn Components ─── */
        .learn-page-title {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          color: var(--learn-sidebar);
          margin-bottom: 6px;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
        }

        .learn-page-subtitle {
          color: var(--learn-text-secondary);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 32px;
        }

        .learn-card {
          background: var(--learn-card);
          border: 2px solid white;
          border-radius: 24px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.06), inset 0 0 0 1px var(--learn-border);
          position: relative;
          overflow: hidden;
        }
        .learn-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0));
          pointer-events: none;
        }
        .learn-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.12), inset 0 0 0 2px var(--learn-accent-light);
        }

        .learn-card-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: var(--learn-text);
          margin-bottom: 12px;
        }

        .learn-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .learn-badge-success {
          background: var(--learn-success-bg);
          color: #047857;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .learn-badge-warning {
          background: var(--learn-warning-bg);
          color: #B45309;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .learn-badge-error {
          background: var(--learn-error-bg);
          color: #B91C1C;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .learn-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 16px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .learn-btn-primary {
          background: linear-gradient(135deg, var(--learn-accent), #6366F1);
          color: white;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3), inset 0 -3px 0 rgba(0,0,0,0.1);
        }
        .learn-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4), inset 0 -3px 0 rgba(0,0,0,0.1);
          filter: brightness(1.05);
        }
        .learn-btn-primary:active {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3), inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .learn-btn-secondary {
          background: white;
          color: var(--learn-sidebar);
          border: 2px solid var(--learn-bg-alt);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), inset 0 -3px 0 var(--learn-bg-alt);
        }
        .learn-btn-secondary:hover {
          background: var(--learn-bg-alt);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06), inset 0 -3px 0 rgba(0,0,0,0.05);
        }
        .learn-btn-secondary:active {
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }

        /* Progress wheel */
        .learn-progress-wheel {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.05));
        }
        .learn-progress-wheel svg {
          transform: rotate(-90deg);
        }
        .learn-progress-wheel-text {
          position: absolute;
          font-family: var(--font-heading);
          font-weight: 900;
          color: var(--learn-text);
        }
      `}</style>
    </div>
  );
}
