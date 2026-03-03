"use client";

import Link from "next/link";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { usePdfExport } from "@/hooks/usePdfExport";

export default function SettingsPage() {
    const { player } = useGame();
    const { exportPdf } = usePdfExport();

    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const mascotName = player.mascot ? MASCOT_INFO[player.mascot].name : "Chưa chọn";
    const className = player.playerClass
        ? CLASS_ABILITIES[player.playerClass].name
        : "Chưa chọn";

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Cài đặt ⚙️
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                    Thông tin phụ huynh, thông tin bé, và xuất báo cáo
                </p>
            </div>

            {/* ── Parent Info ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                        👨‍👩‍👧
                    </div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Thông tin Phụ huynh
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Tên phụ huynh" value={player.parentName || "Chưa cung cấp"} icon="👤" />
                    <InfoField label="Email" value={player.parentEmail || "Chưa cung cấp"} icon="📧" />
                    <InfoField label="Số điện thoại" value={player.parentPhone || "Chưa cung cấp"} icon="📱" />
                </div>

                <p className="text-[11px] mt-4" style={{ color: "var(--dash-muted)" }}>
                    💡 Để thay đổi thông tin phụ huynh, vui lòng vào trang{" "}
                    <Link href="/profile" className="text-indigo-600 hover:underline font-medium">
                        Hồ sơ
                    </Link>
                    .
                </p>
            </div>

            {/* ── Child Info ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl">
                        👧
                    </div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Thông tin Bé
                    </h3>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl mb-4" style={{ background: "#F8F9FF" }}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl">
                        {mascotEmoji}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-lg" style={{ color: "var(--dash-text)" }}>
                            {player.name}
                        </div>
                        <div className="text-sm" style={{ color: "var(--dash-muted)" }}>
                            Lớp {player.grade} · Level {player.level} · {player.xp.toLocaleString()} XP
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniCard label="Mascot" value={mascotName} icon={mascotEmoji} />
                    <MiniCard label="Lớp nhân vật" value={className} icon="⚔️" />
                    <MiniCard label="Streak" value={`${player.streak} ngày`} icon="🔥" />
                    <MiniCard label="Giờ chơi" value={`${player.totalPlayHours}h`} icon="⏱️" />
                </div>
            </div>

            {/* ── Export PDF ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">
                        📄
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                            Xuất Báo cáo
                        </h3>
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                            Tạo file PDF tổng hợp tiến trình học tập của bé
                        </p>
                    </div>
                </div>

                <button
                    onClick={exportPdf}
                    className="px-5 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                    📄 Xuất PDF Báo cáo
                </button>

                <p className="text-[11px] mt-3" style={{ color: "var(--dash-muted)" }}>
                    Báo cáo bao gồm: thông tin bé, XP, mastery theo môn, tiến trình hành tinh. Tuân thủ COPPA.
                </p>
            </div>

            {/* ── Quick links ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    Liên kết nhanh
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuickLink href="/portal" icon="🎮" label="Giao diện học tập của bé" />
                    <QuickLink href="/portal/player" icon="👤" label="Hồ sơ người chơi" />
                    <QuickLink href="/profile" icon="📝" label="Chỉnh sửa thông tin" />
                    <QuickLink href="/dashboard" icon="📊" label="Tổng quan Dashboard" />
                </div>
            </div>
        </div>
    );
}

/* ─── Sub-components ─── */

function InfoField({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="p-3 rounded-xl border" style={{ borderColor: "var(--dash-border)" }}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--dash-muted)" }}>
                    {label}
                </span>
            </div>
            <div className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                {value}
            </div>
        </div>
    );
}

function MiniCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-xs font-bold" style={{ color: "var(--dash-text)" }}>
                {value}
            </div>
            <div className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                {label}
            </div>
        </div>
    );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                {label}
            </span>
        </Link>
    );
}
