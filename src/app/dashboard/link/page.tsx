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
            <div className="dash-card p-5 sm:p-6">
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
            <div className="dash-card p-5 sm:p-6">
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
                        className="flex-1 px-4 py-3 rounded-xl border text-center text-lg font-bold tracking-[0.3em] uppercase transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        style={{
                            borderColor: "var(--dash-border)",
                            fontFamily: "var(--font-heading)",
                        }}
                    />
                    <button
                        onClick={handleLink}
                        disabled={loading || code.trim().length !== 6}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${loading || code.trim().length !== 6
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "text-white hover:shadow-lg hover:scale-[1.02]"
                            }`}
                        style={
                            !(loading || code.trim().length !== 6)
                                ? { background: "linear-gradient(135deg, var(--dash-hero-from), var(--dash-hero-to))" }
                                : undefined
                        }
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
            <div className="dash-card p-5 sm:p-6">
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    👧 Tài khoản con đã liên kết
                </h3>

                {linkedChildren.length === 0 ? (
                    <div className="text-center py-8">
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}
                        >
                            <span className="text-3xl">🔗</span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                            Chưa liên kết tài khoản nào
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--dash-muted)" }}>
                            Nhập mã liên kết ở trên để bắt đầu
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {linkedChildren.map((childId, i) => (
                            <div
                                key={childId}
                                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:shadow-sm"
                                style={{
                                    background: "linear-gradient(135deg, #F0FFF4, #ECFDF5)",
                                    border: "1px solid #BBF7D0",
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                    style={{ background: "rgba(34, 197, 94, 0.12)" }}
                                >
                                    👧
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-bold" style={{ color: "#166534" }}>
                                        Bé #{i + 1}
                                    </span>
                                    <span className="text-xs ml-2" style={{ color: "#16A34A" }}>
                                        ID: {childId.slice(0, 8)}...
                                    </span>
                                </div>
                                <span
                                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ color: "#16A34A", background: "rgba(34, 197, 94, 0.1)" }}
                                >
                                    ✓ Đã liên kết
                                </span>
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                    color: "var(--dash-accent)",
                    background: "var(--dash-accent-light)",
                }}
            >
                {num}
            </div>
            <p className="text-sm pt-0.5" style={{ color: "var(--dash-text)" }}>
                {text}
            </p>
        </div>
    );
}
