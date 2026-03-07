"use client";

import Link from "next/link";
import { useState } from "react";
import CalmModeToggle from "./CalmModeToggle";
import VolumeControl from "./VolumeControl";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { player } = useGame();
    const { user, role, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-white/10" style={{ borderRadius: 0 }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl">🌌</span>
                    <span className="text-xl font-bold font-[var(--font-heading)] neon-text">
                        CosmoMosaic
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <button
                            onClick={handleSignOut}
                            className="text-sm text-white/70 hover:text-red-400 transition-colors duration-300"
                        >
                            Đăng xuất
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm text-white/70 hover:text-neon-cyan transition-colors duration-300"
                        >
                            Đăng nhập
                        </Link>
                    )}
                    <Link
                        href="/portal"
                        className="text-sm text-white/70 hover:text-neon-cyan transition-colors duration-300"
                    >
                        Bản đồ Vũ trụ
                    </Link>
                    <Link
                        href="/learn"
                        className="text-sm text-white/70 hover:text-neon-cyan transition-colors duration-300"
                    >
                        📚 Học Tập
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-sm text-white/70 hover:text-neon-cyan transition-colors duration-300"
                    >
                        Phụ huynh
                    </Link>

                    {role === "admin" && (
                        <Link
                            href="/admin"
                            className="text-sm text-amber-400/80 hover:text-amber-300 transition-colors duration-300 font-semibold"
                        >
                            ⚙️ Admin
                        </Link>
                    )}

                    {/* Calm Mode toggle — luôn hiển thị khi đã onboarding */}
                    {player.onboardingComplete && (
                        <div className="flex items-center gap-2">
                            {player.calmMode && (
                                <span className="calm-mode-indicator">🌙 Calm</span>
                            )}
                            <CalmModeToggle />
                            <VolumeControl />
                        </div>
                    )}

                    <Link
                        href="/login"
                        className="ml-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-neon-cyan to-neon-magenta text-space-deep hover:opacity-90 transition-opacity"
                    >
                        Chơi ngay 🚀
                    </Link>
                </div>

                {/* Mobile: Calm toggle + hamburger */}
                <div className="md:hidden flex items-center gap-3">
                    <CalmModeToggle />
                    <VolumeControl />
                    <button
                        className="text-white/70 hover:text-neon-cyan transition-colors"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden glass-card-strong border-t border-white/10 px-4 py-4 space-y-3" style={{ borderRadius: 0 }}>
                    {user ? (
                        <button onClick={handleSignOut} className="block text-white/70 hover:text-red-400 transition-colors">
                            Đăng xuất
                        </button>
                    ) : (
                        <Link href="/login" className="block text-white/70 hover:text-neon-cyan transition-colors">
                            Đăng nhập
                        </Link>
                    )}
                    <Link href="/portal" className="block text-white/70 hover:text-neon-cyan transition-colors">
                        Bản đồ Vũ trụ
                    </Link>
                    <Link href="/learn" className="block text-white/70 hover:text-neon-cyan transition-colors">
                        📚 Học Tập
                    </Link>
                    <Link href="/dashboard" className="block text-white/70 hover:text-neon-cyan transition-colors">
                        Phụ huynh
                    </Link>
                    {role === "admin" && (
                        <Link href="/admin" className="block text-amber-400/80 hover:text-amber-300 transition-colors font-semibold">
                            ⚙️ Admin
                        </Link>
                    )}
                    <Link
                        href="/login"
                        className="block text-center px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-neon-cyan to-neon-magenta text-space-deep"
                    >
                        Chơi ngay 🚀
                    </Link>
                </div>
            )
            }
        </nav >
    );
}
