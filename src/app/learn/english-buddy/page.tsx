"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import LunaChatSession from "@/components/learn/LunaChatSession";

/* ─── Voice options ─── */
const VOICES = [
    // Female
    { id: "en-US-Studio-O", name: "Olivia", gender: "female", tier: "Studio", desc: "Ấm áp, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Aoede", name: "Aria", gender: "female", tier: "Chirp3", desc: "Sáng, thân thiện" },
    { id: "en-US-Chirp3-HD-Kore", name: "Kira", gender: "female", tier: "Chirp3", desc: "Nhẹ nhàng, dịu dàng" },
    { id: "en-US-Chirp3-HD-Leda", name: "Leah", gender: "female", tier: "Chirp3", desc: "Rõ ràng, chuyên nghiệp" },
    { id: "en-US-Chirp3-HD-Zephyr", name: "Zoe", gender: "female", tier: "Chirp3", desc: "Vui tươi, trẻ trung" },
    // Male
    { id: "en-US-Studio-Q", name: "Quinn", gender: "male", tier: "Studio", desc: "Trầm ấm, tự nhiên nhất" },
    { id: "en-US-Chirp3-HD-Fenrir", name: "Felix", gender: "male", tier: "Chirp3", desc: "Tự tin, mạnh mẽ" },
    { id: "en-US-Chirp3-HD-Puck", name: "Parker", gender: "male", tier: "Chirp3", desc: "Vui, playful" },
    { id: "en-US-Chirp3-HD-Charon", name: "Charlie", gender: "male", tier: "Chirp3", desc: "Ấm áp, tự nhiên" },
    { id: "en-US-Chirp3-HD-Orus", name: "Owen", gender: "male", tier: "Chirp3", desc: "Điềm tĩnh, rõ ràng" },
];

/* ─── Duration options ─── */
const DURATIONS = [
    { minutes: 15, label: "15 phút", desc: "Buổi ngắn, nhanh gọn", emoji: "⚡" },
    { minutes: 30, label: "30 phút", desc: "Chuẩn nhất", emoji: "⭐", popular: true },
    { minutes: 45, label: "45 phút", desc: "Luyện sâu, có thời gian ôn từ", emoji: "🔥" },
];

/* ─── Suggested topics by grade ─── */
const TOPIC_SUGGESTIONS: Record<string, string[]> = {
    "1": ["Animals 🐶", "Colors 🎨", "Numbers 1–20 🔢", "Family 👨‍👩‍👧", "My classroom 📚"],
    "2": ["My day 🌅", "Food I like 🍕", "Weather ☀️🌧️", "Hobbies 🎮", "My friends 🤝"],
    "3": ["School life 🏫", "Sports ⚽", "Wild animals 🦁", "Seasons 🍂", "Going shopping 🛒"],
    "4": ["Travel & places ✈️", "My dream job 👩‍🚀", "Environment 🌍", "Technology 💻", "Celebrations 🎉"],
    "5": ["Vietnamese culture 🇻🇳", "Science & nature 🔬", "What I learned this week 📖", "Future plans 🚀", "Social media 📱"],
};

interface PastSession {
    id: string;
    topic: string;
    duration_minutes: number;
    summary: string;
    key_phrases: Array<{ phrase: string; translation: string }>;
    created_at: string;
}

function formatAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

/* ─── Luna Owl SVG (homepage owl, amber+indigo tone) ─── */
function LunaOwl() {
    return (
        <svg viewBox="0 0 100 110" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 20px rgba(251,191,36,0.6))" }}>
            <defs>
                <radialGradient id="lunaDeep" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#3B1F6E" />
                    <stop offset="60%" stopColor="#1E0F3A" />
                    <stop offset="100%" stopColor="#0A0612" />
                </radialGradient>
                <linearGradient id="lunaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="30%" stopColor="#F59E0B" />
                    <stop offset="70%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                </linearGradient>
                <radialGradient id="lunaGalaxy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="40%" stopColor="#3B1F6E" />
                    <stop offset="100%" stopColor="#0A0612" />
                </radialGradient>
                <linearGradient id="lunaEyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF3C7" />
                    <stop offset="30%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="lunaScroll" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F5DEB3" />
                    <stop offset="50%" stopColor="#FAEBD7" />
                    <stop offset="100%" stopColor="#E6C280" />
                </linearGradient>
                <filter id="lunaGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Legs */}
            <g>
                <path d="M 38 78 L 33 92 C 32 96 28 97 28 97 C 32 97 35 99 35 99 C 36 96 39 94 40 92 L 44 78 Z" fill="url(#lunaGold)" stroke="#92400E" strokeWidth="1" />
                <circle cx="38" cy="80" r="3.5" fill="#1E0F3A" stroke="url(#lunaGold)" strokeWidth="1.5" />
                <circle cx="38" cy="80" r="1.5" fill="#F59E0B" filter="url(#lunaGlow)" />
                <path d="M 62 78 L 67 92 C 68 96 72 97 72 97 C 68 97 65 99 65 99 C 64 96 61 94 60 92 L 56 78 Z" fill="url(#lunaGold)" stroke="#92400E" strokeWidth="1" />
                <circle cx="62" cy="80" r="3.5" fill="#1E0F3A" stroke="url(#lunaGold)" strokeWidth="1.5" />
                <circle cx="62" cy="80" r="1.5" fill="#F59E0B" filter="url(#lunaGlow)" />
            </g>

            {/* Body */}
            <ellipse cx="50" cy="55" rx="34" ry="36" fill="url(#lunaDeep)" stroke="#0A0612" strokeWidth="2" />
            <path d="M 22 55 C 22 35 78 35 78 55 C 78 75 65 88 50 88 C 35 88 22 75 22 55 Z" fill="url(#lunaGalaxy)" stroke="url(#lunaGold)" strokeWidth="1.5" opacity="0.95" />
            {/* Stars in belly */}
            <circle cx="40" cy="50" r="0.8" fill="#FFF" opacity="0.9" filter="url(#lunaGlow)" />
            <circle cx="60" cy="65" r="1.2" fill="#F59E0B" opacity="0.8" filter="url(#lunaGlow)" />
            <circle cx="35" cy="60" r="1.5" fill="#FFF" opacity="0.7" filter="url(#lunaGlow)" />
            <circle cx="55" cy="45" r="0.6" fill="#FFF" opacity="0.9" />
            <circle cx="45" cy="70" r="1" fill="#C084FC" opacity="0.6" filter="url(#lunaGlow)" />
            <path d="M 30 65 Q 45 50 60 70 Q 55 75 45 65" fill="#F59E0B" opacity="0.15" filter="url(#lunaGlow)" />
            <path d="M 45 45 Q 60 40 65 55 Q 55 50 50 55" fill="#C084FC" opacity="0.15" filter="url(#lunaGlow)" />
            {/* Gold straps */}
            <path d="M 22 45 C 40 65 60 65 78 45" fill="none" stroke="url(#lunaGold)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            <path d="M 30 35 C 45 55 55 55 70 35" fill="none" stroke="url(#lunaGold)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            {/* Shield */}
            <g transform="translate(50, 56)">
                <path d="M -10 -10 L 10 -10 L 10 0 C 10 8 0 14 0 14 C 0 14 -10 8 -10 0 Z" fill="url(#lunaDeep)" stroke="url(#lunaGold)" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M -3 3 Q -3 0 0 0 Q 4 0 4 3 Q 7 3 7 6 L -5 6 Q -7 6 -7 4 Q -7 3 -3 3 Z" fill="url(#lunaGold)" />
            </g>

            {/* Left Wing */}
            <g>
                <path d="M 22 42 C 10 50 5 65 10 80 C 15 90 28 75 30 65" fill="url(#lunaDeep)" stroke="#0A0612" strokeWidth="1.5" />
                <circle cx="25" cy="48" r="8" fill="url(#lunaDeep)" stroke="url(#lunaGold)" strokeWidth="2" />
                <path d="M 23 45 A 4 4 0 1 1 23 51" fill="none" stroke="#F59E0B" strokeWidth="2" filter="url(#lunaGlow)" opacity="0.8" />
            </g>

            {/* Right Wing + Scroll */}
            <g>
                <path d="M 78 42 C 90 50 95 65 90 80 C 85 90 72 75 70 65" fill="url(#lunaDeep)" stroke="#0A0612" strokeWidth="1.5" />
                <g transform="translate(68, 62) rotate(-15)">
                    <path d="M 0 0 L 25 -5 L 20 30 L -5 35 Z" fill="url(#lunaScroll)" stroke="#9C6644" strokeWidth="1" />
                    <path d="M -2 0 C -5 -3 0 -5 2 -3 L 25 -5 C 28 -8 32 -5 30 -2 L 5 0 Z" fill="#FAD6A5" stroke="#9C6644" strokeWidth="1" strokeLinejoin="round" />
                    <circle cx="-1" cy="-2" r="1.5" fill="#92400E" />
                    <path d="M -5 35 C -8 32 -3 30 -1 32 L 20 30 C 17 27 22 25 24 28 L -1 37 Z" fill="#E6C280" stroke="#9C6644" strokeWidth="1" strokeLinejoin="round" />
                    <line x1="5" y1="4" x2="20" y2="1" stroke="#92400E" strokeWidth="1.2" strokeDasharray="3 1 2 2" opacity="0.6" />
                    <line x1="3" y1="9" x2="18" y2="6" stroke="#92400E" strokeWidth="1.2" strokeDasharray="4 2 1 1" opacity="0.6" />
                    <line x1="1" y1="14" x2="16" y2="11" stroke="#92400E" strokeWidth="1.2" strokeDasharray="2 2 4 1" opacity="0.6" />
                    <line x1="-1" y1="19" x2="14" y2="16" stroke="#92400E" strokeWidth="1.2" strokeDasharray="1 3 3 1" opacity="0.6" />
                    <line x1="-3" y1="24" x2="12" y2="21" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2 1 2" opacity="0.8" filter="url(#lunaGlow)" />
                </g>
                <path d="M 82 72 C 88 70 92 73 90 75 C 86 76 83 74 82 72 Z" fill="#1E0F3A" stroke="url(#lunaGold)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 80 78 C 86 76 90 79 88 81 C 84 82 81 80 80 78 Z" fill="#1E0F3A" stroke="url(#lunaGold)" strokeWidth="1.5" strokeLinejoin="round" />
            </g>

            {/* Head */}
            <ellipse cx="50" cy="32" rx="30" ry="26" fill="url(#lunaDeep)" stroke="#0A0612" strokeWidth="2" />
            <path d="M 40 10 C 50 18 60 10 50 25 Z" fill="url(#lunaGalaxy)" opacity="0.8" filter="url(#lunaGlow)" />
            <path d="M 24 18 C 35 25 45 32 50 35 C 55 32 65 25 76 18 C 80 20 75 14 74 12 C 65 18 55 24 50 28 C 45 24 35 18 26 12 C 25 14 20 20 24 18 Z" fill="url(#lunaDeep)" stroke="url(#lunaGold)" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Ears */}
            <path d="M 28 22 C 20 12 15 5 28 15 Z" fill="url(#lunaDeep)" stroke="#1E0F3A" strokeWidth="1.5" />
            <path d="M 25 20 C 18 12 16 8 26 14" fill="none" stroke="url(#lunaGold)" strokeWidth="1.5" />
            <path d="M 72 22 C 80 12 85 5 72 15 Z" fill="url(#lunaDeep)" stroke="#1E0F3A" strokeWidth="1.5" />
            <path d="M 75 20 C 82 12 84 8 74 14" fill="none" stroke="url(#lunaGold)" strokeWidth="1.5" />
            {/* Face patch */}
            <path d="M 42 38 C 38 45 46 52 50 54 C 54 52 62 45 58 38 C 52 42 48 42 42 38 Z" fill="#FEF3C7" stroke="#3B1F6E" strokeWidth="1" />
            {/* Beak */}
            <path d="M 46 38 C 50 36 50 36 54 38 C 52 45 51 46 50 50 C 49 46 48 45 46 38 Z" fill="#D4A373" stroke="#92400E" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 48 39 C 50 38 50 38 52 39 C 51 44 50.5 45 50 48 Z" fill="#FAD6A5" opacity="0.8" />

            {/* Left Eye */}
            <g>
                <circle cx="34" cy="30" r="16" fill="url(#lunaGold)" stroke="#92400E" strokeWidth="1.5" />
                <path d="M 34 14 L 34 18 M 34 46 L 34 42 M 18 30 L 22 30 M 50 30 L 46 30 M 22 18 L 25 21 M 46 42 L 43 39 M 22 42 L 25 39 M 46 18 L 43 21" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="34" cy="30" r="12" fill="#0A0612" stroke="#111" strokeWidth="2" />
                <circle cx="34" cy="30" r="11" fill="url(#lunaEyeGlow)" opacity="0.9" filter="url(#lunaGlow)" />
                <circle cx="34" cy="30" r="8" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
                <circle cx="34" cy="30" r="7" fill="#0A0612" />
                <circle cx="32" cy="28" r="2.5" fill="#FFF" opacity="0.95" />
                <circle cx="36" cy="31" r="1" fill="#F59E0B" filter="url(#lunaGlow)" />
                <path d="M 28 30 A 6 6 0 0 1 40 30" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.8" filter="url(#lunaGlow)" />
            </g>
            {/* Right Eye */}
            <g>
                <circle cx="66" cy="30" r="16" fill="url(#lunaGold)" stroke="#92400E" strokeWidth="1.5" />
                <path d="M 66 14 L 66 18 M 66 46 L 66 42 M 50 30 L 54 30 M 82 30 L 78 30 M 54 18 L 57 21 M 78 42 L 75 39 M 54 42 L 57 39 M 78 18 L 75 21" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="66" cy="30" r="12" fill="#0A0612" stroke="#111" strokeWidth="2" />
                <circle cx="66" cy="30" r="11" fill="url(#lunaEyeGlow)" opacity="0.9" filter="url(#lunaGlow)" />
                <circle cx="66" cy="30" r="8" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
                <circle cx="66" cy="30" r="7" fill="#0A0612" />
                <circle cx="64" cy="28" r="2.5" fill="#FFF" opacity="0.95" />
                <circle cx="68" cy="31" r="1" fill="#F59E0B" filter="url(#lunaGlow)" />
                <path d="M 60 30 A 6 6 0 0 1 72 30" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.8" filter="url(#lunaGlow)" />
            </g>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════ */

export default function EnglishBuddyPage() {
    const { player } = useGame();
    const { playerDbId, session } = useAuth();
    const token = session?.access_token;

    const [phase, setPhase] = useState<"setup" | "session">("setup");
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
    const [topicInput, setTopicInput] = useState("");
    const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    /* The active topic used for the session */
    const activeTopic = topicInput.trim() || null;

    /* Suggestions based on grade */
    const suggestions = useMemo(() => {
        const g = String(player.grade ?? 2);
        return TOPIC_SUGGESTIONS[g] ?? TOPIC_SUGGESTIONS["2"];
    }, [player.grade]);


    /* Load recent sessions */
    useEffect(() => {
        if (!playerDbId || !token) return;
        setLoadingSessions(true);
        fetch(`/api/english-sessions?player_id=${playerDbId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => setPastSessions(d.sessions ?? []))
            .catch(() => { /* silent */ })
            .finally(() => setLoadingSessions(false));
    }, [playerDbId, token]);

    /* ─── Start session ─── */
    function handleStart() {
        if (!activeTopic) {
            // Pick random suggestion
            const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
            setTopicInput(pick.replace(/\s*[^\w\s].*/u, "").trim()); // strip emoji
            // Use setTimeout to let state settle
            setTimeout(() => setPhase("session"), 50);
            return;
        }
        setPhase("session");
    }

    /* ─── Session ended: back to setup ─── */
    function handleSessionEnd() {
        setPhase("setup");
        setTopicInput("");
        // Refresh sessions
        if (playerDbId && token) {
            fetch(`/api/english-sessions?player_id=${playerDbId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.json())
                .then(d => setPastSessions(d.sessions ?? []))
                .catch(() => { /* silent */ });
        }
    }

    /* ════════ SESSION VIEW ════════ */
    if (phase === "session" && activeTopic) {
        return (
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h1 className="learn-page-title" style={{ marginBottom: 0 }}>🦅 Luna</h1>
                    <button className="learn-btn learn-btn-secondary" style={{ fontSize: 13 }} onClick={() => setPhase("setup")}>
                        ← Quay lại
                    </button>
                </div>
                <LunaChatSession
                    studentName={player.englishName?.trim() || player.name}
                    grade={player.grade ?? 2}
                    topic={activeTopic}
                    durationMinutes={selectedDuration}
                    playerId={playerDbId}
                    voice={selectedVoice}
                    onSessionEnd={handleSessionEnd}
                />
            </div>
        );
    }

    /* ════════ SETUP VIEW ════════ */
    return (
        <div className="luna-setup-page">
            {/* ─── Hero ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luna-hero-card">
                <div className="luna-hero-bg-1" />
                <div className="luna-hero-bg-2" />
                <div className="luna-hero-content">
                    <motion.div
                        className="luna-hero-owl"
                        animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <LunaOwl />
                    </motion.div>
                    <div className="luna-hero-text">
                        <div className="luna-hero-tag">✨ NEW — English Buddy</div>
                        <h1 className="luna-hero-title">Luna</h1>

                    </div>
                </div>
            </motion.div>



            {/* ─── Topic Input ─── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h2 className="luna-section-title">💬 Chủ đề hội thoại</h2>
                <div className="luna-topic-card">
                    <input
                        className="luna-topic-input"
                        placeholder="Nhập chủ đề bạn muốn luyện, hoặc để Luna chọn cho bạn..."
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleStart(); }}
                        maxLength={80}
                    />
                    <p className="luna-topic-hint">💡 Để trống → Luna sẽ gợi ý chủ đề phù hợp lớp {player.grade ?? 2}</p>
                    <div className="luna-suggestions">
                        {suggestions.map(s => (
                            <button
                                key={s}
                                className={`luna-suggestion-chip ${topicInput === s.replace(/\s*[^\w\s\u00C0-\u024F].*/u, "").trim() ? "selected" : ""}`}
                                onClick={() => setTopicInput(s.replace(/\s*\S*$/, "").trim() || s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── Voice Selector ─── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="luna-section-title">🎙️ Chọn giọng nói</h2>
                <div className="luna-voice-dropdown-wrap">
                    <select
                        className="luna-voice-select"
                        value={selectedVoice}
                        onChange={e => setSelectedVoice(e.target.value)}
                    >
                        <optgroup label="👩 Giọng Nữ">
                            {VOICES.filter(v => v.gender === "female").map(v => (
                                <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                            ))}
                        </optgroup>
                        <optgroup label="👨 Giọng Nam">
                            {VOICES.filter(v => v.gender === "male").map(v => (
                                <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                            ))}
                        </optgroup>
                    </select>
                    <span className="luna-voice-arrow">▾</span>
                </div>
            </motion.div>

            {/* ─── Start Button ─── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <motion.button
                    className="learn-btn learn-btn-primary luna-start-btn"
                    onClick={handleStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    🚀 Bắt đầu luyện với Luna
                    <span className="luna-start-meta">{selectedDuration} phút{activeTopic ? ` • ${activeTopic}` : " • Luna chọn chủ đề"}</span>
                </motion.button>
            </motion.div>

            {/* ─── Past Sessions ─── */}
            <AnimatePresence>
                {pastSessions.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                        <h2 className="luna-section-title">📅 Buổi luyện gần đây</h2>
                        <div className="luna-history-list">
                            {pastSessions.slice(0, 3).map(s => (
                                <div key={s.id} className="luna-history-card learn-card">
                                    <div className="luna-hist-header">
                                        <span className="luna-hist-topic">💬 {s.topic}</span>
                                        <span className="luna-hist-meta">{s.duration_minutes}p • {formatAgo(s.created_at)}</span>
                                    </div>
                                    <p className="luna-hist-summary">{s.summary}</p>
                                    {s.key_phrases?.length > 0 && (
                                        <div className="luna-hist-phrases">
                                            {s.key_phrases.slice(0, 3).map((kp, i) => (
                                                <span key={i} className="luna-hist-phrase-chip">
                                                    <span className="luna-hist-en">{kp.phrase}</span>
                                                    {kp.translation && <span className="luna-hist-vi"> · {kp.translation}</span>}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className="learn-btn learn-btn-secondary luna-replay-btn"
                                        onClick={() => { setTopicInput(s.topic); setSelectedDuration(s.duration_minutes); setPhase("session"); }}
                                    >
                                        🔄 Luyện lại chủ đề này
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loadingSessions && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--learn-text-secondary)" }}>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ display: "inline-block" }}>⏳</motion.span>
                </div>
            )}

            {/* ─── Scoped Styles ─── */}
            <style jsx>{`
              .luna-setup-page { display:flex; flex-direction:column; gap:28px; }

              /* Hero Card */
              .luna-hero-card { background:linear-gradient(135deg, #042F2E 0%, #134E4A 40%, #0D9488 100%); border-radius:32px; padding:40px; position:relative; overflow:hidden; box-shadow:0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); border:1px solid rgba(13,148,136,0.3); }
              .luna-hero-bg-1 { position:absolute; top:-30%; right:-5%; width:380px; height:380px; background:radial-gradient(circle, rgba(94,234,212,0.25) 0%, transparent 70%); border-radius:50%; pointer-events:none; }
              .luna-hero-bg-2 { position:absolute; bottom:-40%; left:10%; width:500px; height:500px; background:radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 60%); border-radius:50%; pointer-events:none; }
              .luna-hero-content { position:relative; z-index:2; display:flex; align-items:center; gap:32px; }
              .luna-hero-owl { width:140px; height:140px; flex-shrink:0; }
              .luna-hero-text { flex:1; }
              .luna-hero-tag { font-size:11px; font-weight:800; color:#5EEAD4; text-transform:uppercase; letter-spacing:1.5px; background:rgba(13,148,136,0.2); border:1px solid rgba(13,148,136,0.4); border-radius:20px; display:inline-block; padding:5px 14px; margin-bottom:12px; }
              .luna-hero-title { font-family:var(--font-heading); font-size:48px; font-weight:900; color:#fff; margin:0 0 12px; text-shadow:0 4px 16px rgba(0,0,0,0.4); letter-spacing:-1px; }
              .luna-hero-desc { font-size:15px; color:rgba(255,255,255,0.8); line-height:1.7; margin:0 0 18px; }
              .luna-hero-desc strong { color:#5EEAD4; }
              .luna-hero-badges { display:flex; flex-wrap:wrap; gap:8px; }
              .luna-badge-chip { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:6px 14px; font-size:13px; font-weight:700; color:rgba(255,255,255,0.85); backdrop-filter:blur(8px); }

              /* Section title */
              .luna-section-title { font-family:var(--font-heading); font-size:19px; font-weight:800; color:#fff; margin:0 0 14px; }

              /* Duration grid */
              .luna-duration-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; }
              .luna-duration-btn { position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; padding:22px 16px; border-radius:22px; border:1.5px solid var(--learn-card-border); background:var(--learn-card); cursor:pointer; transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
              .luna-duration-btn:hover { border-color:rgba(13,148,136,0.4); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }
              .luna-duration-btn.selected { border-color:rgba(13,148,136,0.7); background:rgba(13,148,136,0.1); box-shadow:0 0 0 3px rgba(13,148,136,0.12), 0 8px 20px rgba(13,148,136,0.15); }
              .luna-popular-badge { position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:linear-gradient(90deg, #0D9488, #14B8A6); color:#fff; font-size:9px; font-weight:900; letter-spacing:1px; padding:3px 10px; border-radius:10px; white-space:nowrap; }
              .luna-dur-emoji { font-size:28px; }
              .luna-dur-label { font-family:var(--font-heading); font-size:15px; font-weight:900; color:#fff; }
              .luna-dur-desc { font-size:12px; color:var(--learn-text-secondary); font-weight:600; text-align:center; }

              /* Topic card */
              .luna-topic-card { background:var(--learn-card); border:1px solid var(--learn-card-border); border-radius:24px; padding:22px; }
              .luna-topic-input { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid var(--learn-card-border); border-radius:16px; padding:14px 18px; font-size:15px; color:#fff; font-family:var(--font-body); outline:none; transition:all 0.25s; box-sizing:border-box; }
              .luna-topic-input:focus { border-color:rgba(13,148,136,0.5); box-shadow:0 0 0 3px rgba(13,148,136,0.12); }
              .luna-topic-input::placeholder { color:var(--learn-text-secondary); }
              .luna-topic-hint { font-size:13px; color:var(--learn-text-secondary); margin:10px 0 14px; }
              .luna-suggestions { display:flex; flex-wrap:wrap; gap:8px; }
              .luna-suggestion-chip { background:rgba(13,148,136,0.08); border:1px solid rgba(13,148,136,0.2); border-radius:20px; padding:7px 16px; font-size:13px; font-weight:700; color:#5EEAD4; cursor:pointer; transition:all 0.2s; }
              .luna-suggestion-chip:hover { background:rgba(13,148,136,0.18); transform:translateY(-1px); }
              .luna-suggestion-chip.selected { background:rgba(13,148,136,0.25); border-color:rgba(13,148,136,0.6); }

              /* Start button */
              .luna-start-btn { width:100%; padding:20px; font-size:18px; display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:20px; }
              .luna-start-meta { font-size:12px; font-weight:600; opacity:0.7; }

              /* History */
              .luna-history-list { display:flex; flex-direction:column; gap:14px; }
              .luna-history-card { padding:20px; }
              .luna-hist-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
              .luna-hist-topic { font-weight:800; font-size:15px; color:#fff; }
              .luna-hist-meta { font-size:12px; color:var(--learn-text-secondary); font-weight:700; }
              .luna-hist-summary { font-size:13px; color:rgba(255,255,255,0.7); line-height:1.6; margin:0 0 12px; }
              .luna-hist-phrases { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:14px; }
              .luna-hist-phrase-chip { background:rgba(13,148,136,0.12); border:1px solid rgba(13,148,136,0.25); border-radius:10px; padding:5px 12px; font-size:12px; }
              .luna-hist-en { color:#5EEAD4; font-weight:700; }
              .luna-hist-vi { color:var(--learn-text-secondary); }
              /* Voice picker */
              .luna-voice-grid { display:flex; flex-direction:column; gap:14px; }
              .luna-voice-group { display:flex; flex-direction:column; gap:8px; }
              .luna-voice-gender-label { font-size:12px; font-weight:800; color:var(--learn-text-secondary); text-transform:uppercase; letter-spacing:1px; }
              .luna-voice-row { display:flex; gap:10px; flex-wrap:wrap; }
              .luna-voice-chip { display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:11px 16px; border-radius:16px; border:1.5px solid var(--learn-card-border); background:var(--learn-card); cursor:pointer; transition:all 0.2s; min-width:100px; }
              .luna-voice-chip:hover { border-color:rgba(13,148,136,0.4); transform:translateY(-2px); }
              .luna-voice-chip.selected { border-color:rgba(13,148,136,0.7); background:rgba(13,148,136,0.1); box-shadow:0 0 0 3px rgba(13,148,136,0.12); }
              .luna-voice-name { font-family:var(--font-heading); font-size:15px; font-weight:900; color:#fff; }
              .luna-voice-tier { font-size:9px; font-weight:800; color:#5EEAD4; text-transform:uppercase; letter-spacing:1px; background:rgba(13,148,136,0.15); border-radius:6px; padding:2px 6px; }
              .luna-voice-desc { font-size:11px; color:var(--learn-text-secondary); margin-top:2px; }

              /* English name banner */
              .luna-name-banner { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 16px; border-radius:14px; background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.25); font-size:13px; color:rgba(255,255,255,0.7); }
              .luna-name-banner-link { color:#FCD34D; font-weight:700; text-decoration:none; white-space:nowrap; }
              .luna-name-banner-link:hover { text-decoration:underline; }

              .luna-replay-btn { font-size:13px; padding:9px 18px; }

              @media (max-width: 768px) {
                .luna-hero-content { flex-direction:column; text-align:center; gap:20px; }
                .luna-hero-owl { width:100px; height:100px; }
                .luna-hero-title { font-size:38px; }
                .luna-hero-badges { justify-content:center; }
                .luna-duration-grid { grid-template-columns:repeat(3,1fr); gap:10px; }
              }
              @media (max-width: 480px) {
                .luna-duration-grid { grid-template-columns:1fr; }
              }
            `}</style>
        </div>
    );
}
