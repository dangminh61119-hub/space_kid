"use client";

import { useState } from "react";
import { useGame } from "@/lib/game-context";

const PLAY_LIMITS = [
    { value: 0, label: "Không giới hạn" },
    { value: 15, label: "15 phút" },
    { value: 30, label: "30 phút" },
    { value: 45, label: "45 phút" },
    { value: 60, label: "1 giờ" },
    { value: 90, label: "1.5 giờ" },
    { value: 120, label: "2 giờ" },
];

const BREAK_INTERVALS = [
    { value: 15, label: "15 phút" },
    { value: 20, label: "20 phút" },
    { value: 30, label: "30 phút" },
    { value: 45, label: "45 phút" },
    { value: 60, label: "60 phút" },
];

export default function ControlsPage() {
    const { player, updateParentControls } = useGame();
    const [controls, setControls] = useState(player.parentControls);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateParentControls(controls);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const hasChanges =
        controls.dailyPlayLimit !== player.parentControls.dailyPlayLimit ||
        controls.breakReminder !== player.parentControls.breakReminder ||
        controls.breakInterval !== player.parentControls.breakInterval ||
        controls.allowCalmMode !== player.parentControls.allowCalmMode;

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Giới hạn & Kiểm soát ⏰
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                    Thiết lập thời gian chơi và các tùy chọn an toàn cho bé
                </p>
            </div>

            {/* ── Daily Play Limit ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                        ⏱️
                    </div>
                    <div>
                        <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                            Giới hạn thời gian chơi
                        </h3>
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                            Thời gian tối đa bé được chơi mỗi ngày
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PLAY_LIMITS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setControls({ ...controls, dailyPlayLimit: opt.value })}
                            className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${controls.dailyPlayLimit === opt.value
                                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm"
                                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {controls.dailyPlayLimit > 0 && (
                    <p className="text-xs mt-3 text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        💡 Bé sẽ được nhắc dừng chơi sau {controls.dailyPlayLimit} phút mỗi ngày.
                    </p>
                )}
            </div>

            {/* ── Break Reminder ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">
                            🧘
                        </div>
                        <div>
                            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                                Nhắc nghỉ ngơi
                            </h3>
                            <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                                Tự động nhắc bé nghỉ giải lao
                            </p>
                        </div>
                    </div>

                    {/* Toggle */}
                    <button
                        onClick={() => setControls({ ...controls, breakReminder: !controls.breakReminder })}
                        className="relative w-12 h-7 rounded-full transition-colors"
                        style={{
                            background: controls.breakReminder ? "#22c55e" : "#e2e8f0",
                        }}
                    >
                        <div
                            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform"
                            style={{
                                transform: controls.breakReminder ? "translateX(22px)" : "translateX(2px)",
                            }}
                        />
                    </button>
                </div>

                {controls.breakReminder && (
                    <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--dash-muted)" }}>
                            Nhắc nghỉ mỗi:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {BREAK_INTERVALS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setControls({ ...controls, breakInterval: opt.value })}
                                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all border ${controls.breakInterval === opt.value
                                            ? "bg-green-50 border-green-400 text-green-700 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Calm Mode ── */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
                            🌙
                        </div>
                        <div>
                            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                                Cho phép Calm Mode
                            </h3>
                            <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                                Giảm hiệu ứng, âm thanh và animation cho trẻ nhạy cảm
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setControls({ ...controls, allowCalmMode: !controls.allowCalmMode })}
                        className="relative w-12 h-7 rounded-full transition-colors"
                        style={{
                            background: controls.allowCalmMode ? "#8b5cf6" : "#e2e8f0",
                        }}
                    >
                        <div
                            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform"
                            style={{
                                transform: controls.allowCalmMode ? "translateX(22px)" : "translateX(2px)",
                            }}
                        />
                    </button>
                </div>
            </div>

            {/* ── Save Button ── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges && !saved}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${saved
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : hasChanges
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {saved ? "✓ Đã lưu!" : "Lưu thay đổi"}
                </button>
                {hasChanges && !saved && (
                    <span className="text-xs text-amber-600">
                        ⚠️ Có thay đổi chưa lưu
                    </span>
                )}
            </div>
        </div>
    );
}
