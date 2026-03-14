"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import SpaceParticles from "@/components/learn/SpaceParticles";

/* ─── Sidebar Navigation Items ─── */
const NAV_ITEMS = [
  { href: "/learn", icon: "🏠", label: "Tổng quan", id: "home" },
  { href: "/learn/path", icon: "🗺️", label: "Lộ trình", id: "path" },
  { href: "/learn/practice", icon: "📝", label: "Luyện tập", id: "practice" },
  { href: "/learn/lessons", icon: "📺", label: "Bài giảng", id: "lessons" },
  { href: "/learn/review", icon: "🔄", label: "Ôn tập", id: "review" },
  { href: "/learn/tutor", icon: "🤖", label: "AI Tutor", id: "tutor" },
  { href: "/learn/bao-bai", icon: "📋", label: "Báo bài", id: "bao-bai" },
  { href: "/learn/english-buddy", icon: "🦅", label: "Luyện tiếng Anh", id: "english-buddy" },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { player } = useGame();
  const { loading: authLoading, allowed, redirecting } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auth guard: block rendering while checking or redirecting
  if (authLoading || redirecting || !allowed) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "var(--learn-bg)", color: "var(--learn-text)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌌</div>
          <p style={{ fontSize: 14, opacity: 0.6 }}>
            {authLoading ? "Đang kiểm tra đăng nhập..." : "Đang chuyển hướng..."}
          </p>
        </div>
      </div>
    );
  }

  const activeItem = NAV_ITEMS.find(item =>
    pathname === item.href || (item.href !== "/learn" && pathname.startsWith(item.href))
  ) || NAV_ITEMS[0];

  return (
    <div className="learn-layout">
      {/* Ambient Space Effects */}
      <SpaceParticles />
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          className="learn-sidebar"
          animate={{ width: sidebarOpen ? 260 : 76 }}
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

          {/* Coins balance */}
          {sidebarOpen ? (
            <div className="learn-sidebar-coins">
              <span className="learn-coins-icon">🪙</span>
              <span className="learn-coins-count">{player.coins.toLocaleString()}</span>
            </div>
          ) : (
            <div className="learn-sidebar-coins-mini" title={`${player.coins} Coins`}>
              <span>🪙</span>
              <span className="learn-coins-mini-count">{player.coins >= 1000 ? `${Math.floor(player.coins / 1000)}k` : player.coins}</span>
            </div>
          )}
        </motion.aside>
      )}

      {/* Main Content */}
      <main className="learn-main" style={{ marginLeft: isMobile ? 0 : sidebarOpen ? 260 : 76 }}>
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
          background-image: radial-gradient(circle at 15% 50%, rgba(0, 212, 255, 0.06), transparent 25%),
                            radial-gradient(circle at 85% 30%, rgba(0, 212, 255, 0.04), transparent 25%),
                            radial-gradient(circle at 50% 80%, rgba(245, 158, 11, 0.04), transparent 30%);
          background-attachment: fixed;
          color: var(--learn-text);
          font-family: var(--font-body);
          display: flex;
          position: relative;
        }
        .learn-layout::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        /* ─── Sidebar ─── */
        .learn-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: linear-gradient(180deg, #0A1628 0%, var(--learn-sidebar) 50%, var(--learn-sidebar-dark) 100%);
          color: var(--learn-sidebar-text);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 4px 0 32px rgba(0, 0, 0, 0.7), 1px 0 0 rgba(0, 212, 255, 0.08);
          border-right: 1px solid rgba(0, 212, 255, 0.08);
          border-radius: 0 24px 24px 0;
        }
        .learn-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.03) 0%, transparent 40%);
          pointer-events: none;
          border-radius: inherit;
        }

        .learn-sidebar-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding: 4px;
        }

        .learn-sidebar-back {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          font-weight: 700;
          padding: 10px 14px;
          border-radius: 14px;
          transition: all 0.25s;
          background: var(--learn-card);
          border: 1px solid var(--learn-card-border);
        }
        .learn-sidebar-back:hover { 
          background: rgba(0, 212, 255, 0.06); 
          color: white;
          border-color: rgba(0, 212, 255, 0.2);
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
        }

        .learn-sidebar-icon { font-size: 20px; }
        .learn-sidebar-back-text { white-space: nowrap; font-family: var(--font-heading); letter-spacing: 0.5px; }

        .learn-sidebar-toggle {
          background: var(--learn-card);
          border: 1px solid var(--learn-card-border);
          color: rgba(255,255,255,0.6);
          width: 34px;
          height: 34px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s;
        }
        .learn-sidebar-toggle:hover { 
          background: rgba(0, 212, 255, 0.08); 
          color: var(--learn-accent-cyan-light);
          border-color: rgba(0, 212, 255, 0.2);
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
        }

        /* Player mini card */
        .learn-player-mini {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--learn-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--learn-card-border);
          border-radius: 16px;
          margin-bottom: 28px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .learn-player-avatar { 
          font-size: 28px; 
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 212, 255, 0.05));
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
        }
        .learn-player-info { display: flex; flex-direction: column; gap: 3px; }
        .learn-player-name { font-weight: 800; font-size: 15px; font-family: var(--font-heading); letter-spacing: -0.2px; color: #FFF; }
        .learn-player-grade { 
          font-size: 11px; 
          opacity: 0.9; 
          font-weight: 700; 
          background: rgba(0, 212, 255, 0.12); 
          color: var(--learn-accent-cyan-light);
          padding: 3px 10px; 
          border-radius: 20px; 
          display: inline-block; 
          width: max-content; 
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        /* Nav items */
        .learn-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          position: relative;
        }

        .learn-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          text-decoration: none;
          color: rgba(255,255,255,0.6);
          font-weight: 600;
          font-family: var(--font-heading);
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          border: 1px solid transparent;
        }
        .learn-nav-item:hover { 
          background: rgba(0, 212, 255, 0.04); 
          color: white; 
          transform: translateX(4px);
        }
        .learn-nav-item.active { 
          background: linear-gradient(90deg, rgba(0, 212, 255, 0.08) 0%, transparent 100%); 
          color: white; 
          font-weight: 800;
        }

        .learn-nav-icon { 
          font-size: 20px; 
          flex-shrink: 0; 
          transition: all 0.25s;
          filter: grayscale(0.5) opacity(0.8);
        }
        .learn-nav-item.active .learn-nav-icon {
          filter: grayscale(0) drop-shadow(0 0 8px rgba(0, 212, 255, 0.6));
        }
        .learn-nav-item:hover .learn-nav-icon { 
          transform: scale(1.15) rotate(5deg); 
          filter: grayscale(0) opacity(1);
        }
        .learn-nav-label { white-space: nowrap; }

        .learn-nav-active-indicator {
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 4px;
          background: linear-gradient(180deg, var(--learn-accent-cyan-light), var(--learn-accent-cyan));
          border-radius: 0 6px 6px 0;
          box-shadow: 0 0 12px var(--learn-accent-cyan), 0 0 4px var(--learn-accent-cyan-light);
        }

        /* Streak */
        .learn-sidebar-streak {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: var(--learn-card);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 16px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 15px;
          color: var(--learn-accent-light);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 12px rgba(245, 158, 11, 0.08);
        }
        .learn-streak-fire { 
          font-size: 22px; 
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6)); 
          animation: bounce 2s infinite; 
        }

        /* Coins widget */
        .learn-sidebar-coins {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(245, 180, 11, 0.08), rgba(245, 158, 11, 0.03));
          border: 1px solid rgba(245, 180, 11, 0.15);
          border-radius: 16px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 15px;
          color: #FBBF24;
          margin-top: 8px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 0 12px rgba(245, 180, 11, 0.06);
        }
        .learn-coins-icon {
          font-size: 22px;
          filter: drop-shadow(0 0 8px rgba(245, 180, 11, 0.5));
        }
        .learn-sidebar-coins-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 0;
          font-size: 18px;
          color: #FBBF24;
          cursor: default;
        }
        .learn-coins-mini-count {
          font-size: 10px;
          font-weight: 900;
          font-family: var(--font-heading);
          color: #FBBF24;
        }

        /* ─── Main Content ─── */
        .learn-main {
          flex: 1;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          z-index: 1;
        }

        .learn-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 32px 100px;
        }

        /* ─── Mobile Bottom Nav ─── */
        .learn-mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(6, 10, 22, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(0, 212, 255, 0.1);
          display: flex;
          justify-content: space-around;
          padding: 10px 6px;
          padding-bottom: max(10px, env(safe-area-inset-bottom));
          z-index: 50;
          box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.8);
          border-radius: 20px 20px 0 0;
        }

        .learn-mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: var(--learn-text-secondary);
          font-size: 10px;
          font-family: var(--font-heading);
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .learn-mobile-nav-item.active { 
          color: var(--learn-accent-cyan-light); 
          background: rgba(0, 212, 255, 0.08);
          box-shadow: inset 0 0 12px rgba(0, 212, 255, 0.05);
        }
        .learn-mobile-nav-item:active { transform: scale(0.95); }
        .learn-mobile-nav-icon { 
          font-size: 22px; 
          transition: all 0.2s; 
          filter: grayscale(0.8); 
        }
        .learn-mobile-nav-item.active .learn-mobile-nav-icon { 
          transform: translateY(-2px) scale(1.1); 
          filter: grayscale(0) drop-shadow(0 0 6px var(--learn-accent-cyan));
        }
        .learn-mobile-nav-label { white-space: nowrap; letter-spacing: 0.2px; }

        /* ─── Shared Bento Components ─── */
        .learn-page-title {
          font-family: var(--font-heading);
          font-size: 34px;
          font-weight: 900;
          color: #FFF;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }

        .learn-page-subtitle {
          color: var(--learn-text-secondary);
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 36px;
        }

        .learn-card {
          background: var(--learn-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--learn-card-border);
          border-radius: 28px;
          padding: 28px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: var(--learn-card-shadow);
          position: relative;
          overflow: hidden;
        }
        .learn-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.03) 0%, transparent 60%);
          pointer-events: none;
        }
        .learn-card::after {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
          border-radius: 0 0 4px 4px;
          pointer-events: none;
        }
        .learn-card-glow {
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle at center, var(--learn-accent-cyan-glow) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.5s;
          pointer-events: none;
          z-index: -1;
        }
        .learn-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: var(--learn-card-shadow-hover);
          border-color: var(--learn-border-strong);
        }
        .learn-card:hover .learn-card-glow { opacity: 1; }

        .learn-card-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 12px;
          letter-spacing: 0.2px;
        }

        .learn-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .learn-badge-success {
          background: var(--learn-success-bg);
          color: var(--learn-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
        }
        .learn-badge-warning {
          background: var(--learn-warning-bg);
          color: var(--learn-warning);
          border: 1px solid rgba(245, 158, 11, 0.2);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.1);
        }
        .learn-badge-error {
          background: var(--learn-error-bg);
          color: var(--learn-error);
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.1);
        }

        .learn-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 16px;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.5px;
        }
        .learn-btn-primary {
          background: linear-gradient(135deg, var(--learn-accent-cyan) 0%, var(--learn-accent-cyan-dark) 100%);
          color: #050A14;
          box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.3);
          text-shadow: 0 1px 2px rgba(255,255,255,0.2);
        }
        .learn-btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 200%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        .learn-btn-primary:hover::before { left: 100%; }
        .learn-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4), 0 0 16px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.4);
          color: #000;
        }
        .learn-btn-primary:active {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3), inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .learn-btn-secondary {
          background: var(--learn-card);
          color: #FFF;
          border: 1px solid var(--learn-border-strong);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .learn-btn-secondary:hover {
          background: rgba(0, 212, 255, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 212, 255, 0.12);
          border-color: var(--learn-accent-cyan);
          color: var(--learn-accent-cyan-light);
        }
        .learn-btn-secondary:active {
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Progress wheel */
        .learn-progress-wheel {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 12px rgba(245,158,11,0.2));
        }
        .learn-progress-wheel svg {
          transform: rotate(-90deg);
        }
        .learn-progress-wheel-text {
          position: absolute;
          font-family: var(--font-heading);
          font-weight: 900;
          color: #FFF;
          font-size: 1.2rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* ─── Animations ─── */
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
