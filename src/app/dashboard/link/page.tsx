"use client";

import { useState } from "react";
import { useAuth } from "@/lib/services/auth-context";

export default function LinkChildPage() {
    const { linkedChildren, linkChild } = useAuth();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleLink = async () => {
        if (code.trim().length !== 6) {
            setError("Mã liên kết phải có đúng 6 ký tự!");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = await linkChild(code);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(`✓ Đã liên kết thành công với bé ${result.childName}!`);
            setCode("");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Liên kết Tài khoản Con 🔗
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                    Nhập mã liên kết từ tài khoản của bé để xem báo cáo học tập
                </p>
            </div>

            {/* How it works */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    📋 Hướng dẫn
                </h3>
                <div className="space-y-3">
                    <Step num={1} text="Đăng nhập tài khoản của bé trên thiết bị khác" />
                    <Step num={2} text="Vào Hồ sơ người chơi → tìm 'Mã liên kết' (6 ký tự)" />
                    <Step num={3} text="Nhập mã đó vào ô bên dưới và nhấn 'Liên kết'" />
                </div>
            </div>

            {/* Link form */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    🔑 Nhập mã liên kết
                </h3>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="VD: ABC123"
                        maxLength={6}
                        className="flex-1 px-4 py-3 rounded-xl border text-center text-lg font-bold tracking-[0.3em] uppercase"
                        style={{
                            borderColor: "var(--dash-border)",
                            fontFamily: "var(--font-heading)",
                            letterSpacing: "0.3em",
                        }}
                    />
                    <button
                        onClick={handleLink}
                        disabled={loading || code.trim().length !== 6}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${loading || code.trim().length !== 6
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                            }`}
                    >
                        {loading ? "..." : "Liên kết"}
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3 border border-red-200">
                        ❌ {error}
                    </p>
                )}
                {success && (
                    <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-3 border border-green-200">
                        {success}
                    </p>
                )}
            </div>

            {/* Linked children */}
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    👧 Tài khoản con đã liên kết
                </h3>

                {linkedChildren.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🔗</div>
                        <p className="text-sm">Chưa liên kết tài khoản nào</p>
                        <p className="text-xs mt-1">Nhập mã liên kết ở trên để bắt đầu</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {linkedChildren.map((childId, i) => (
                            <div
                                key={childId}
                                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                                    👧
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-green-800">
                                        Bé #{i + 1}
                                    </span>
                                    <span className="text-xs text-green-600 ml-2">
                                        ID: {childId.slice(0, 8)}...
                                    </span>
                                </div>
                                <span className="text-xs text-green-500 font-medium">✓ Đã liên kết</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Step({ num, text }: { num: number; text: string }) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0"
            >
                {num}
            </div>
            <p className="text-sm pt-0.5" style={{ color: "var(--dash-text)" }}>
                {text}
            </p>
        </div>
    );
}
